// src/utils/aiGradeParser.js
import { Capacitor } from '@capacitor/core';

// --- API CONFIGURATION ---
// Replicating the logic from your aiService.jsx for consistency
const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const isNative = Capacitor.isNativePlatform();
const API_URL = `${isNative ? PROD_API_URL : ''}/api/gemini`;

/**
 * WORKER: Process a payload (Slice or Whole File)
 */
const sendToWorker = async (base64Data, mimeType, label) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma-3-27b-it", // Flash is crucial for speed
                prompt: [
                    `Analyze this ${label}.
                     
                     TASK:
                     1. Extract all student rows visible.
                     2. Return a JSON array: [{"name": "LAST, FIRST", "grades": {"Math": 90}, "average": 90}]
                     3. Ignore cut-off text at edges.
                     4. Return ONLY raw JSON.`,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType,
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
        console.warn(`${label} error:`, error);
        return []; 
    }
};

/**
 * SLICER: Cuts IMAGES into overlapping chunks
 */
const sliceImage = async (file) => {
    const bitmap = await createImageBitmap(file);
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
    let results = [];

    // --- STRATEGY SELECTION ---
    if (file.type === 'application/pdf') {
        // 🚨 PDF PATH: Standard Processing (No Slicing)
        console.log("📄 PDF detected. Using Standard Processing...");
        
        const base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        // Send whole PDF. We trust 'gemini-1.5-flash' to be fast enough.
        results = [await sendToWorker(base64Data, 'application/pdf', 'Whole PDF')];
        
    } else {
        // ⚡ IMAGE PATH: Micro-Worker Slicing
        console.log("🖼️ Image detected. Using Micro-Worker Slicing...");
        const slices = await sliceImage(file);
        
        console.log(`⚡ Dispatching ${slices.length} micro-workers...`);
        results = await Promise.all(slices.map((s, i) => sendToWorker(s, 'image/jpeg', `Slice ${i+1}`)));
    }

    // --- MERGE & DEDUPLICATE ---
    const mergedMap = new Map();
    let metaData = {};

    results.flat().forEach(record => {
        if (record.meta) metaData = { ...metaData, ...record.meta };
        
        if (record.name && record.grades) {
            const nameKey = record.name.toUpperCase().replace(/[^A-Z]/g, '');
            
            if (!mergedMap.has(nameKey)) {
                mergedMap.set(nameKey, record);
            } else {
                // Keep the record with more detected grades
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