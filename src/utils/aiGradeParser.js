// src/utils/aiGradeParser.js
import { Capacitor } from '@capacitor/core';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const isNative = Capacitor.isNativePlatform();
const API_URL = `${isNative ? PROD_API_URL : ''}/api/gemini`;

/**
 * PHASE 1: HEADER SCOUT
 * Looks at the top of the document to find the exact subject columns.
 */
const extractHeaders = async (base64Data) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma-3-27b-it",
                prompt: [
                    `Analyze the HEADER ROW of this grade sheet.
                     
                     TASK:
                     1. Identify the Subject Columns (e.g., Filipino, English, Math, Science, etc.).
                     2. Ignore metadata like "Name" or "Average". Just get the subjects.
                     3. Return a JSON array of strings: ["Filipino", "English", "Math", "Science"]
                     4. Ensure the order matches the visual columns left-to-right.`,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: "image/jpeg",
                        },
                    },
                ]
            })
        });

        if (!response.ok) throw new Error("Header scout failed");
        const data = await response.json();
        const text = data.text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.warn("Header detection failed, defaulting to auto-detect:", error);
        return null; // Fallback to worker auto-detect
    }
};

/**
 * PHASE 2: CONTEXT-AWARE WORKER
 */
const sendToWorker = async (base64Data, label, knownHeaders) => {
    try {
        const headerContext = knownHeaders 
            ? `IMPORTANT: The columns in this image correspond EXACTLY to these subjects: ${JSON.stringify(knownHeaders)}. Map the numbers to these keys.`
            : `Infer the subject headers from the image context.`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemini-1.5-flash", 
                prompt: [
                    `Analyze this PARTIAL SLICE (${label}) of a grade sheet.
                     
                     ${headerContext}

                     TASK:
                     1. Extract student rows.
                     2. If you see a CATEGORY HEADER like "BOYS", "GIRLS", "MALE", or "FEMALE" on its own line, return a specific object: {"type": "marker", "value": "BOYS"}.
                     3. For students, return: {"type": "student", "name": "LAST, FIRST", "grades": {"Subject": 90}, "average": 90}.
                     4. STRICTNESS: Do not invent names. If a row is blurry or empty, IGNORE IT. Do not hallucinate data.
                     5. Return ONLY a JSON array of these objects.`,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: "image/jpeg",
                        },
                    },
                ]
            })
        });

        if (!response.ok) throw new Error(`${label} failed`);
        const data = await response.json();
        const text = data.text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);

    } catch (error) {
        console.warn(`${label} warning:`, error);
        return []; 
    }
};

// --- PDF & IMAGE HELPERS (Same as before) ---
const convertPdfToBitmaps = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
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
    return bitmaps;
};

const sliceBitmap = (bitmap) => {
    const { width, height } = bitmap;
    const SLICE_HEIGHT = 1000; // Smaller slices for better focus
    const OVERLAP = 200; 
    const slices = [];
    let currentY = 0;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    while (currentY < height) {
        let h = Math.min(SLICE_HEIGHT, height - currentY);
        canvas.height = h;
        ctx.clearRect(0, 0, width, h);
        ctx.drawImage(bitmap, 0, currentY, width, h, 0, 0, width, h);
        slices.push(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
        currentY += (h - OVERLAP);
        if (currentY >= height - OVERLAP) break;
    }
    return slices;
};

/**
 * MAIN ORCHESTRATOR
 */
export const parseCumulativeGrades = async (file) => {
    let bitmaps = [];
    
    // 1. Load Data
    if (file.type === 'application/pdf') {
        bitmaps = await convertPdfToBitmaps(file);
    } else {
        bitmaps = [await createImageBitmap(file)];
    }

    // 2. Header Scout (Use the top of the first page)
    console.log("🕵️ Scouting headers...");
    const headerSliceCanvas = document.createElement('canvas');
    headerSliceCanvas.width = bitmaps[0].width;
    headerSliceCanvas.height = Math.min(1500, bitmaps[0].height);
    headerSliceCanvas.getContext('2d').drawImage(bitmaps[0], 0, 0);
    const headerSliceBase64 = headerSliceCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    const detectedHeaders = await extractHeaders(headerSliceBase64);
    console.log("✅ Detected Headers:", detectedHeaders);

    // 3. Prepare Slices
    const allSlices = [];
    bitmaps.forEach((bmp, pageIdx) => {
        const pageSlices = sliceBitmap(bmp);
        pageSlices.forEach((slice, sliceIdx) => {
            allSlices.push({
                data: slice,
                label: `Page ${pageIdx + 1}.${sliceIdx + 1}`
            });
        });
    });

    // 4. Run Workers (Passing the detected headers!)
    console.log(`⚡ Dispatching ${allSlices.length} workers with context...`);
    // We execute sequentially or in small batches to maintain order logic for Gender
    // But Promise.all is fine because we map results back to index
    const results = await Promise.all(
        allSlices.map(item => sendToWorker(item.data, item.label, detectedHeaders))
    );

    // 5. Intelligent Merge & Gender Assignment
    const finalRecords = [];
    let currentGender = 'MALE'; // Default to Boys usually first
    const seenNames = new Set();

    // Flatten results IN ORDER (Crucial for Boys/Girls detection)
    results.forEach(sliceResult => {
        sliceResult.forEach(item => {
            if (item.type === 'marker') {
                // Switch context if we see "GIRLS"
                const val = item.value.toUpperCase();
                if (val.includes('GIRL') || val.includes('FEMALE')) currentGender = 'FEMALE';
                if (val.includes('BOY') || val.includes('MALE')) currentGender = 'MALE';
            } else if (item.type === 'student' || !item.type) { // Handle legacy format
                const name = item.name;
                // Basic cleanup
                if (!name || name.length < 3 || name.toUpperCase().includes("NAME OF LEARNERS")) return;
                
                // Deduplicate (Exact Name Match)
                const nameKey = name.toUpperCase().replace(/[^A-Z]/g, '');
                if (seenNames.has(nameKey)) return;
                seenNames.add(nameKey);

                finalRecords.push({
                    name: item.name.toUpperCase(),
                    gender: currentGender, // Assign the tracked gender
                    grades: item.grades || {},
                    average: item.average
                });
            }
        });
    });

    return {
        meta: { headers: detectedHeaders },
        records: finalRecords
    };
};