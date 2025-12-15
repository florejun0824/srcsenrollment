// src/utils/aiGradeParser.js
import { Capacitor } from '@capacitor/core';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

// Configure PDF Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const isNative = Capacitor.isNativePlatform();
const API_URL = `${isNative ? PROD_API_URL : ''}/api/gemini`;

// --- RETRY HELPER ---
const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (response.status >= 500) throw new Error(`Server Error ${response.status}`);
                return response; 
            }
            return response;
        } catch (err) {
            console.warn(`Attempt ${i + 1} failed: ${err.message}. Retrying...`);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 1500));
        }
    }
};

/**
 * 🆕 FEATURE: Extract Raw Text from PDF to create the "Official List"
 */
const extractTextMapFromPDF = async (arrayBuffer) => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let extractedNames = [];
    let currentGender = 'MALE'; // Default start

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Simple heuristic parser for the "DepEd" style sheet
        const items = textContent.items.map(item => item.str.trim()).filter(Boolean);
        
        items.forEach(text => {
            // Detect Gender Markers
            if (text.toUpperCase().includes('BOYS')) currentGender = 'MALE';
            if (text.toUpperCase().includes('GIRLS')) currentGender = 'FEMALE';

            // Detect Names (Pattern: Number, Comma, Uppercase)
            // Regex matches: "1. LASTNAME, FIRSTNAME" or "LASTNAME, FIRSTNAME"
            // We look for the comma and length to ensure it's a name
            if (text.includes(',') && text.length > 5 && !text.includes('Subject') && !text.includes('Quarter')) {
                // Cleanup: Remove leading numbers "1. "
                const cleanName = text.replace(/^\d+\.?\s*/, '').trim().toUpperCase();
                extractedNames.push({ name: cleanName, gender: currentGender });
            }
        });
    }
    return extractedNames;
};

/**
 * PHASE 1: HEADER SCOUT (Vision)
 */
const extractHeaders = async (base64Data) => {
    try {
        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma-3-27b-it",
                prompt: [
                    `Analyze the HEADER ROW of this grade sheet.
                     TASK: Identify the Subject Columns (e.g., Filipino, English, Math).
                     Return JSON array of strings: ["Filipino", "English", "Math"]`,
                    { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
                ]
            })
        });
        if (!response.ok) return null;
        const data = await response.json();
        return JSON.parse(data.text.replace(/```json|```/g, '').trim());
    } catch (error) { return null; }
};

/**
 * PHASE 2: CONTEXT-AWARE WORKER
 */
const sendToWorker = async (base64Data, label, knownHeaders, validNamesList) => {
    try {
        const headerContext = knownHeaders 
            ? `The columns are EXACTLY: ${JSON.stringify(knownHeaders)}.`
            : `Infer headers.`;

        // 🧠 INJECT THE OFFICIAL LIST
        const nameContext = validNamesList.length > 0
            ? `RESTRICTION: You are extracting grades for these specific students ONLY: ${JSON.stringify(validNamesList.map(n => n.name))}. If you see a name, map it to the closest one in this list.`
            : `Extract names visible in the document.`;

        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma-3-27b-it", 
                prompt: [
                    `Analyze this PARTIAL SLICE (${label}) of a grade sheet.
                     ${headerContext}
                     ${nameContext}
                     
                     TASK:
                     1. Extract student rows.
                     2. Return ONLY JSON array: [{"name": "EXACT_NAME_FROM_LIST", "grades": {"Math": 90}, "average": 90}]
                     3. Do NOT invent new names. Use the provided list to correct typos.`,
                    { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
                ]
            })
        });

        if (!response.ok) throw new Error("Worker failed");
        const data = await response.json();
        return JSON.parse(data.text.replace(/```json|```/g, '').trim());

    } catch (error) {
        console.warn(`${label} error:`, error);
        return []; 
    }
};

// --- MAIN PROCESS ---
export const parseCumulativeGrades = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    
    // 1. EXTRACT TEXT (The "Truth")
    console.log("📖 Extracting text content...");
    let validStudents = [];
    if (file.type === 'application/pdf') {
        validStudents = await extractTextMapFromPDF(arrayBuffer);
    }
    console.log(`✅ Found ${validStudents.length} names in document text.`);

    // 2. PREPARE IMAGES
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const bitmaps = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        bitmaps.push(await createImageBitmap(canvas));
    }

    // 3. HEADER SCOUT
    console.log("🕵️ Scouting headers...");
    const headerCanvas = document.createElement('canvas');
    headerCanvas.width = bitmaps[0].width;
    headerCanvas.height = Math.min(1500, bitmaps[0].height);
    headerCanvas.getContext('2d').drawImage(bitmaps[0], 0, 0);
    const headerBase64 = headerCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    const detectedHeaders = await extractHeaders(headerBase64);

    // 4. SLICE & PROCESS
    const allSlices = [];
    const SLICE_HEIGHT = 1000;
    const OVERLAP = 200;

    bitmaps.forEach((bmp, pageIdx) => {
        let currentY = 0;
        let sliceIdx = 0;
        const { width, height } = bmp;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        const ctx = canvas.getContext('2d');

        while (currentY < height) {
            let h = Math.min(SLICE_HEIGHT, height - currentY);
            canvas.height = h;
            ctx.clearRect(0,0,width,h);
            ctx.drawImage(bmp, 0, currentY, width, h, 0, 0, width, h);
            allSlices.push({
                data: canvas.toDataURL('image/jpeg', 0.8).split(',')[1],
                label: `Page ${pageIdx+1}.${sliceIdx++}`
            });
            currentY += (h - OVERLAP);
            if(currentY >= height - OVERLAP) break;
        }
    });

    console.log(`⚡ Processing ${allSlices.length} slices...`);
    const results = [];
    for (const slice of allSlices) {
        // Pass 'validStudents' to the AI so it knows who to look for
        const res = await sendToWorker(slice.data, slice.label, detectedHeaders, validStudents);
        results.push(res);
        await new Promise(r => setTimeout(r, 500));
    }

    // 5. RECONCILIATION
    // We now merge the AI's "Grades" into our "Valid Student List"
    const finalMap = new Map();
    
    // Initialize map with Valid Students (Text Layer)
    validStudents.forEach(s => {
        finalMap.set(s.name, { ...s, grades: {}, average: null, source: 'text' });
    });

    // Merge AI Data (Vision Layer)
    results.flat().forEach(aiRecord => {
        if (!aiRecord.name) return;
        const aiNameUpper = aiRecord.name.toUpperCase();
        
        // Find best match in our valid list
        const match = validStudents.find(s => 
            s.name.includes(aiNameUpper) || aiNameUpper.includes(s.name)
        );

        if (match) {
            const existing = finalMap.get(match.name);
            // Merge grades (prefer new data if not empty)
            const mergedGrades = { ...existing.grades, ...aiRecord.grades };
            finalMap.set(match.name, {
                ...existing,
                grades: mergedGrades,
                average: aiRecord.average || existing.average
            });
        }
    });

    // Filter out names that didn't get any grades? Or keep them as empty?
    // We'll return everything we found in the text layer.
    return {
        meta: { headers: detectedHeaders },
        records: Array.from(finalMap.values())
    };
};