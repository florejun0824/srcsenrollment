// src/utils/aiGradeParser.js
import { Capacitor } from '@capacitor/core';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

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
 * TEXT EXTRACTOR (The "Truth")
 */
const extractTextMapFromPDF = async (arrayBuffer) => {
    // 1. Load PDF
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let extractedNames = [];
    let currentGender = 'MALE'; 

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items.map(item => item.str.trim()).filter(Boolean);
        
        items.forEach(text => {
            if (text.toUpperCase().includes('BOYS')) currentGender = 'MALE';
            if (text.toUpperCase().includes('GIRLS')) currentGender = 'FEMALE';

            // Detect Names (Pattern: "1. LASTNAME, FIRSTNAME" or just "LASTNAME, FIRSTNAME")
            // Must contain comma, be uppercase, and long enough
            if (text.includes(',') && text.length > 5 && /^[A-Z\s,.]+$/.test(text.replace(/[0-9]/g, ''))) {
                // Cleanup leading numbers (e.g., "1. ")
                const cleanName = text.replace(/^\d+\.?\s*/, '').trim().toUpperCase();
                // Exclude headers that look like names
                if (!cleanName.includes('PARENT') && !cleanName.includes('TEACHER')) {
                    extractedNames.push({ name: cleanName, gender: currentGender });
                }
            }
        });
    }
    return extractedNames;
};

/**
 * HEADER SCOUT
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
 * WORKER
 */
const sendToWorker = async (base64Data, label, knownHeaders, validNamesList) => {
    try {
        const headerContext = knownHeaders 
            ? `The columns are: ${JSON.stringify(knownHeaders)}.`
            : `Infer headers.`;

        // 🧠 Strict Name Matching Context
        const nameContext = validNamesList.length > 0
            ? `RESTRICTION: Extract grades ONLY for these names: ${JSON.stringify(validNamesList.map(n => n.name))}. Match fuzzy typos to this list.`
            : `Extract visible names.`;

        const response = await fetchWithRetry(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma-3-27b-it", 
                prompt: [
                    `Analyze this PARTIAL SLICE (${label}).
                     ${headerContext}
                     ${nameContext}
                     
                     TASK:
                     1. Extract student rows.
                     2. Return JSON: [{"name": "EXACT_NAME_FROM_LIST", "grades": {"Math": 90}, "average": 90}]
                     3. IGNORE names not in the provided list.`,
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
    // FIX: Use .slice(0) to pass a COPY, preserving the original arrayBuffer
    let validStudents = [];
    if (file.type === 'application/pdf') {
        console.log("📖 Extracting PDF Text Layer...");
        validStudents = await extractTextMapFromPDF(arrayBuffer.slice(0)); 
    }
    console.log(`✅ Found ${validStudents.length} names in text.`);

    // 2. PREPARE IMAGES (Original arrayBuffer is still valid)
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
        const res = await sendToWorker(slice.data, slice.label, detectedHeaders, validStudents);
        results.push(res);
        await new Promise(r => setTimeout(r, 500));
    }

    // 5. RECONCILIATION (Text + Vision)
    const finalMap = new Map();
    
    // A. Start with the "Truth" (Text Layer)
    validStudents.forEach(s => {
        finalMap.set(s.name, { ...s, grades: {}, average: null });
    });

    // B. Merge AI Grades (Vision Layer)
    results.flat().forEach(aiRecord => {
        if (!aiRecord.name) return;
        const aiNameUpper = aiRecord.name.toUpperCase();
        
        // Match AI result to Official List
        const match = validStudents.find(s => 
            s.name.includes(aiNameUpper) || aiNameUpper.includes(s.name)
        );

        if (match) {
            const existing = finalMap.get(match.name);
            finalMap.set(match.name, {
                ...existing,
                grades: { ...existing.grades, ...aiRecord.grades }, // Merge grades
                average: aiRecord.average || existing.average
            });
        }
    });

    return {
        meta: { headers: detectedHeaders },
        records: Array.from(finalMap.values())
    };
};