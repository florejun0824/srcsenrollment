// src/utils/aiGradeParser.js

// 1. ADOPT URL STRATEGY (From your aiService.jsx)
const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const isNative = window.location.protocol === 'capacitor:'; // Simple check
const API_URL = `${isNative ? PROD_API_URL : ''}/api/gemini`;

/**
 * MICRO-WORKER: Process a single slice
 */
const processSlice = async (base64Slice, sliceIndex) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // We use Flash because it's fast and cheap for micro-tasks
                model: "gemma-3-27b-it", 
                prompt: [
                    `Analyze this PARTIAL SLICE (Part ${sliceIndex + 1}) of a grade sheet.
                     
                     TASK:
                     1. Extract all student rows visible in this specific slice.
                     2. Return a JSON array: [{"name": "LAST, FIRST", "grades": {"Math": 90}, "average": 90}]
                     3. Ignore cut-off text at the very top/bottom edges.
                     4. Return ONLY raw JSON.`,
                    {
                        inlineData: {
                            data: base64Slice,
                            mimeType: "image/jpeg",
                        },
                    },
                ]
            })
        });

        if (!response.ok) throw new Error(`Worker ${sliceIndex} failed`);
        
        const data = await response.json();
        const text = data.text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);

    } catch (error) {
        console.warn(`Worker ${sliceIndex} error:`, error);
        return []; // Return empty so other workers continue
    }
};

/**
 * SLICER: Cuts image into overlapping chunks
 */
const sliceImage = async (file) => {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    
    // Config: Smaller chunks = Faster processing = No Timeout
    const SLICE_HEIGHT = 1200; 
    const OVERLAP = 300; // Large overlap to ensure we don't cut names
    
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
    console.log("🔪 Slicing image...");
    const slices = await sliceImage(file);
    
    console.log(`⚡ Dispatching ${slices.length} micro-workers...`);
    
    // This runs all slices IN PARALLEL.
    // Your api/gemini.js will handle them with random keys (Round Robin).
    const results = await Promise.all(slices.map((s, i) => processSlice(s, i)));

    // MERGE RESULTS & REMOVE DUPLICATES
    const mergedMap = new Map();
    let metaData = {};

    results.flat().forEach(record => {
        // Capture metadata if the AI found it in the header slice
        if (record.meta) metaData = { ...metaData, ...record.meta };
        
        if (record.name && record.grades) {
            // Clean Name to use as ID
            const nameKey = record.name.toUpperCase().replace(/[^A-Z]/g, '');
            
            if (!mergedMap.has(nameKey)) {
                mergedMap.set(nameKey, record);
            } else {
                // If duplicate found (due to overlap), keep the better one
                const existing = mergedMap.get(nameKey);
                const newScoreCount = Object.keys(record.grades).length;
                const oldScoreCount = Object.keys(existing.grades).length;
                
                if (newScoreCount > oldScoreCount) {
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