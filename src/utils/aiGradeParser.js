// src/utils/aiGradeParser.js
import { Capacitor } from '@capacitor/core';
import * as pdfjsLib from 'pdfjs-dist';

// --- CONFIGURE PDF WORKER FOR VITE ---
// This ensures the PDF worker loads correctly in production without complex config
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// --- API CONFIGURATION ---
const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const isNative = Capacitor.isNativePlatform();
const API_URL = `${isNative ? PROD_API_URL : ''}/api/gemini`;

/**
 * WORKER: Process a single slice
 */
const sendToWorker = async (base64Data, label) => {
    try {
        // Use Flash for speed. 
        // We only send 'image/jpeg' because we convert everything to images first.
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma-3-27b-it", 
                prompt: [
                    `Analyze this PARTIAL SLICE (${label}) of a grade sheet.
                     
                     TASK:
                     1. Extract all student rows visible.
                     2. Return a JSON array: [{"name": "LAST, FIRST", "grades": {"Math": 90}, "average": 90}]
                     3. Ignore cut-off text at edges.
                     4. Return ONLY raw JSON.`,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: "image/jpeg",
                        },
                    },
                ]
            })
        });

        if (!response.ok) throw new Error(`${label} failed: ${response.statusText}`);
        
        const data = await response.json();
        const text = data.text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);

    } catch (error) {
        console.warn(`${label} warning:`, error);
        return []; 
    }
};

/**
 * HELPER: Convert PDF File to Array of ImageBitmaps (One per page)
 */
const convertPdfToBitmaps = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const bitmaps = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // 2.0 scale for clear text
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        
        // Create bitmap from the rendered page
        const bitmap = await createImageBitmap(canvas);
        bitmaps.push(bitmap);
    }
    
    return bitmaps;
};

/**
 * SLICER: Cuts a Bitmap into overlapping chunks
 */
const sliceBitmap = (bitmap) => {
    const { width, height } = bitmap;
    const SLICE_HEIGHT = 1200; 
    const OVERLAP = 300; 
    
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

    // 1. PREPARE IMAGE DATA
    if (file.type === 'application/pdf') {
        console.log("📄 Processing PDF client-side...");
        bitmaps = await convertPdfToBitmaps(file);
    } else {
        console.log("🖼️ Processing Image...");
        bitmaps = [await createImageBitmap(file)];
    }

    // 2. SLICE EVERYTHING
    console.log(`🔪 Slicing ${bitmaps.length} page(s)...`);
    const allSlices = [];
    bitmaps.forEach((bmp, pageIdx) => {
        const pageSlices = sliceBitmap(bmp);
        pageSlices.forEach((slice, sliceIdx) => {
            allSlices.push({
                data: slice,
                label: `Page ${pageIdx + 1} - Part ${sliceIdx + 1}`
            });
        });
    });

    console.log(`⚡ Dispatching ${allSlices.length} micro-workers...`);

    // 3. PARALLEL EXECUTION (Micro-Workers)
    const results = await Promise.all(
        allSlices.map(item => sendToWorker(item.data, item.label))
    );

    // 4. MERGE & DEDUPLICATE
    const mergedMap = new Map();
    let metaData = {};

    results.flat().forEach(record => {
        if (record.meta) metaData = { ...metaData, ...record.meta };
        
        if (record.name && record.grades) {
            const nameKey = record.name.toUpperCase().replace(/[^A-Z]/g, '');
            
            if (!mergedMap.has(nameKey)) {
                mergedMap.set(nameKey, record);
            } else {
                const existing = mergedMap.get(nameKey);
                if (Object.keys(record.grades).length > Object.keys(existing.grades).length) {
                    mergedMap.set(nameKey, record);
                }
            }
        }
    });

    return {
        meta: metaData,
        records: Array.from(mergedMap.values())
    };
};