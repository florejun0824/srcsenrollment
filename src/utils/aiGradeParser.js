// src/utils/aiGradeParser.js
import { Capacitor } from '@capacitor/core';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

// Configure PDF Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const isNative = Capacitor.isNativePlatform();
const API_URL = `${isNative ? PROD_API_URL : ''}/api/gemini`;

/**
 * PHASE 1: HEADER SCOUT
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
                     TASK: Identify the Subject Columns (e.g., Filipino, English, Math).
                     Return JSON array of strings: ["Filipino", "English", "Math"]`,
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
        console.warn("Header detection failed:", error);
        return null; 
    }
};

/**
 * PHASE 2: WORKER
 */
const sendToWorker = async (base64Data, label, knownHeaders) => {
    try {
        const headerContext = knownHeaders 
            ? `IMPORTANT: The columns correspond to: ${JSON.stringify(knownHeaders)}.`
            : `Infer the subject headers.`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma-3-27b-it", 
                prompt: [
                    `Analyze this PARTIAL SLICE (${label}) of a grade sheet.
                     ${headerContext}
                     TASK:
                     1. Extract student rows.
                     2. Return {"type": "marker", "value": "BOYS"} for category headers.
                     3. Return {"type": "student", "name": "LAST, FIRST", "grades": {"Subject": 90}, "average": 90} for students.
                     4. Return ONLY JSON array.`,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: "image/jpeg",
                        },
                    },
                ]
            })
        });

        if (!response.ok) throw new Error(`${label} failed: ${response.status} ${response.statusText}`);
        const data = await response.json();
        const text = data.text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);

    } catch (error) {
        console.warn(`${label} error:`, error);
        return []; 
    }
};

// --- HELPERS ---
const convertPdfToBitmaps = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const bitmaps = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        // Reduce scale slightly to 1.5 to save bandwidth/memory while keeping text clear
        const viewport = page.getViewport({ scale: 1.5 });
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
    const SLICE_HEIGHT = 1000; 
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
        // Use 0.7 quality to reduce payload size
        slices.push(canvas.toDataURL('image/jpeg', 0.7).split(',')[1]);
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

    // 2. Header Scout
    console.log("🕵️ Scouting headers...");
    const headerSliceCanvas = document.createElement('canvas');
    headerSliceCanvas.width = bitmaps[0].width;
    headerSliceCanvas.height = Math.min(1500, bitmaps[0].height);
    headerSliceCanvas.getContext('2d').drawImage(bitmaps[0], 0, 0);
    const headerSliceBase64 = headerSliceCanvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    
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

    console.log(`⚡ Processing ${allSlices.length} slices SEQUENTIALLY...`);

    // 4. SEQUENTIAL EXECUTION (Fixes 500/Rate Limit)
    const results = [];
    for (const item of allSlices) {
        console.log(`Processing ${item.label}...`);
        // Wait for one to finish before starting the next
        const result = await sendToWorker(item.data, item.label, detectedHeaders);
        results.push(result);
        // Optional: Small delay to be gentle on the API
        await new Promise(r => setTimeout(r, 500));
    }

    // 5. Intelligent Merge & Gender Assignment
    const finalRecords = [];
    let currentGender = 'MALE'; 
    const seenNames = new Set();

    results.forEach(sliceResult => {
        if (!Array.isArray(sliceResult)) return;
        
        sliceResult.forEach(item => {
            if (item.type === 'marker') {
                const val = item.value.toUpperCase();
                if (val.includes('GIRL') || val.includes('FEMALE')) currentGender = 'FEMALE';
                if (val.includes('BOY') || val.includes('MALE')) currentGender = 'MALE';
            } else if (item.type === 'student' || (!item.type && item.name)) { 
                const name = item.name;
                if (!name || name.length < 3 || name.toUpperCase().includes("NAME OF LEARNERS")) return;
                
                const nameKey = name.toUpperCase().replace(/[^A-Z]/g, '');
                if (seenNames.has(nameKey)) return;
                seenNames.add(nameKey);

                finalRecords.push({
                    name: item.name.toUpperCase(),
                    gender: currentGender,
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