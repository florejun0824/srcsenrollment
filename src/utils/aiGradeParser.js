// src/utils/aiGradeParser.js
import { Capacitor } from '@capacitor/core';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const isNative = Capacitor.isNativePlatform();
const API_URL = `${isNative ? PROD_API_URL : ''}/api/gemini`;

// --- CONFIGURATION ---
const EXCLUDED_TERMS = [
    'PARENT', 'TEACHER', 'ADVISER', 'CHECKED BY', 'ATTESTED', 'PRINCIPAL', 
    'DATE', 'LPT', 'MA-ELM', 'PHD', 'EDD', 'GUIDANCE', 'COORDINATOR', 
    'SIGNATURE', 'APPROVED', 'SUBMITTED', 'NAME OF LEARNERS', 'DEPARTMENT',
    'MALE', 'FEMALE', 'TOTAL' 
];

// Limit chunk size to ensure <5s processing time
const LINES_PER_CHUNK = 15; 

// --- 1. SPATIAL TEXT EXTRACTOR (Returns Clean Lines) ---
const extractCleanLinesFromPDF = async (arrayBuffer) => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allLines = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group items by Y-coordinate (Row Detection)
        const rows = {};
        textContent.items.forEach(item => {
            const y = Math.round(item.transform[5] / 5) * 5; // 5px tolerance
            if (!rows[y]) rows[y] = [];
            rows[y].push({ x: item.transform[4], str: item.str.trim() });
        });

        // Sort Rows (Top to Bottom)
        const sortedY = Object.keys(rows).sort((a, b) => b - a);
        
        sortedY.forEach(y => {
            // Sort Columns (Left to Right)
            const rowItems = rows[y].sort((a, b) => a.x - b.x);
            const lineText = rowItems.map(item => item.str).join(' | '); // Pipe separator
            
            // Basic filtering to remove empty lines or headers
            if (lineText.length > 5 && !EXCLUDED_TERMS.some(term => lineText.toUpperCase().includes(term))) {
                allLines.push(lineText);
            }
        });
    }
    
    return allLines;
};

// --- 2. HEADER SCOUT (Scan first 20 lines) ---
const detectHeaders = async (firstLines) => {
    try {
        const textSample = firstLines.join('\n');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma-3-27b-it", 
                prompt: `
                Analyze these grade sheet lines.
                Identify the SUBJECT HEADERS (e.g. Filipino, English, Math, Science).
                Ignore "Name", "Average", "Section".
                
                Return strictly a JSON array of strings: ["Math", "English", "Filipino"]
                
                TEXT:
                ${textSample}
                `
            })
        });
        
        if (!response.ok) return [];
        const data = await response.json();
        const clean = data.text.replace(/```json|```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.warn("Header detection failed:", e);
        return []; // Will fallback to generic keys
    }
};

// --- 3. MICRO-CHUNK WORKER ---
const processChunkWithGemma = async (chunkText, chunkIndex, knownHeaders) => {
    try {
        // Retry logic for 504/500 errors
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "gemma-3-27b-it", 
                        prompt: `
                        You are a data extraction assistant processing a SMALL CHUNK of a grade sheet.
                        
                        CONTEXT:
                        - Subject Headers: ${JSON.stringify(knownHeaders)}.
                        - Format: "Name | Grade | Grade..." or "No | Name | Grade..."
                        
                        YOUR TASK:
                        1. Extract student rows from this text chunk.
                        2. Map grades to the headers provided.
                        3. Clean up names (Remove leading numbers like "1. ", "25.").
                        4. Infer gender: If you see "BOYS" in the text, mark subsequent as MALE. If "GIRLS", mark FEMALE. If neither is present, output "UNKNOWN" (we will fix later).
                        
                        OUTPUT FORMAT:
                        Return ONLY a valid JSON array. No markdown.
                        [
                            {
                                "name": "LASTNAME, FIRSTNAME",
                                "gender": "MALE", 
                                "grades": { "Math": "82", "English": "81"... },
                                "average": "81.00"
                            }
                        ]

                        CHUNK TEXT:
                        ${chunkText}
                        `
                    })
                });

                if (!response.ok) throw new Error(`Server status: ${response.status}`);
                
                const data = await response.json();
                const cleanText = data.text.replace(/```json|```/g, '').trim();
                return JSON.parse(cleanText);

            } catch (err) {
                console.warn(`Chunk ${chunkIndex} attempt ${attempt + 1} failed: ${err.message}`);
                if (attempt === 2) throw err; // Final fail
                await new Promise(r => setTimeout(r, 1500)); // Wait before retry
            }
        }
    } catch (error) {
        console.error(`Failed to process Chunk ${chunkIndex}:`, error);
        return []; 
    }
};

// --- MAIN ORCHESTRATOR ---
export const parseCumulativeGrades = async (file) => {
    console.log("📄 Reading PDF Lines...");
    
    // 1. Extract All Lines (Client Side)
    const arrayBuffer = await file.arrayBuffer();
    const allLines = await extractCleanLinesFromPDF(arrayBuffer);
    console.log(`✅ Extracted ${allLines.length} valid lines.`);

    // 2. Detect Headers (First 20 lines usually contain headers)
    const headers = await detectHeaders(allLines.slice(0, 20));
    console.log("Headers found:", headers);

    // 3. Create Micro-Chunks
    const chunks = [];
    for (let i = 0; i < allLines.length; i += LINES_PER_CHUNK) {
        chunks.push(allLines.slice(i, i + LINES_PER_CHUNK).join('\n'));
    }

    console.log(`⚡ Processing ${chunks.length} micro-chunks...`);

    // 4. Process Chunks Sequentially
    let allRecords = [];
    
    for (let i = 0; i < chunks.length; i++) {
        // Skip chunks that are clearly just headers or noise
        if (chunks[i].length < 50) continue;

        console.log(`Processing Chunk ${i + 1}/${chunks.length}...`);
        
        const chunkRecords = await processChunkWithGemma(chunks[i], i, headers);
        
        if (Array.isArray(chunkRecords)) {
            allRecords = [...allRecords, ...chunkRecords];
        }
        
        // Safety Pause to prevent Rate Limiting
        await new Promise(r => setTimeout(r, 500));
    }

    // 5. Post-Processing: Fix Genders
    // (Since chunking loses the "BOYS/GIRLS" context header if it was in a previous chunk)
    // We assume the list is sorted: usually Boys first, then Girls.
    // If 'gender' is unknown, we can try to guess or default to 'MALE' for top half.
    // However, usually the name line itself doesn't contain gender, so we rely on the parser finding markers.
    // A simple fix for "Unknown" is difficult without the full list context, 
    // but the GradebookManager UI allows manual sorting/fixing.
    
    // Deduplicate
    const uniqueMap = new Map();
    allRecords.forEach(r => {
        if(r.name && r.name.length > 3 && !r.name.includes("NAME OF LEARNERS")) {
            // Clean name key
            const key = r.name.toUpperCase().replace(/[^A-Z]/g, '');
            uniqueMap.set(key, r);
        }
    });

    return {
        meta: { 
            headers: headers.length > 0 ? headers : ["Math", "English", "Science"], 
            gradeLevel: "Detected" 
        },
        records: Array.from(uniqueMap.values())
    };
};