// src/utils/aiGradeParser.js
import { Capacitor } from '@capacitor/core';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const isNative = Capacitor.isNativePlatform();
const API_URL = `${isNative ? PROD_API_URL : ''}/api/gemini`;

// --- CONFIGURATION ---
// Terms to ignore so the AI doesn't think they are students
const EXCLUDED_TERMS = [
    'PARENT', 'TEACHER', 'ADVISER', 'CHECKED BY', 'ATTESTED', 'PRINCIPAL', 
    'DATE', 'LPT', 'MA-ELM', 'PHD', 'EDD', 'GUIDANCE', 'COORDINATOR', 
    'SIGNATURE', 'APPROVED', 'SUBMITTED', 'NAME OF LEARNERS', 'DEPARTMENT',
    'MEAN', 'MPS', 'TOTAL', 'MALE', 'FEMALE' // specific gender headers handled manually
];

// Chunk size: 10 lines is safe for 504 timeouts
const LINES_PER_CHUNK = 10; 

// --- 1. SPATIAL EXTRACTOR WITH PRE-TAGGING ---
const extractPreTaggedLines = async (arrayBuffer) => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const allLines = [];
    let currentGender = 'MALE'; // Default to Boys (Top of list)

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // 1. Group by Y-Coordinate (Row Detection)
        const rows = {};
        textContent.items.forEach(item => {
            // Round Y to nearest 4px to group slightly misaligned items
            const y = Math.round(item.transform[5] / 4) * 4; 
            if (!rows[y]) rows[y] = [];
            rows[y].push({ x: item.transform[4], str: item.str.trim() });
        });

        // 2. Sort Rows (Top to Bottom)
        const sortedY = Object.keys(rows).sort((a, b) => b - a);
        
        // 3. Process Rows Sequentially
        sortedY.forEach(y => {
            // Sort items Left-to-Right
            const rowItems = rows[y].sort((a, b) => a.x - b.x);
            // Join with pipe '|' to preserve column structure
            const lineText = rowItems.map(item => item.str).join(' | '); 
            const upperLine = lineText.toUpperCase();

            // --- DETERMINISTIC GENDER SWITCH ---
            // If we hit the "GIRLS" header, switch mode.
            if (upperLine.includes('GIRLS') && !upperLine.includes('ALILAIN')) { // Safety check against names containing 'GIRLS'
                currentGender = 'FEMALE';
            }
            
            // Filter noise
            const isNoise = EXCLUDED_TERMS.some(term => upperLine.includes(term));
            
            // Only add likely data rows
            if (!isNoise && lineText.length > 5) {
                // PRE-TAGGING: We inject the gender into the text itself!
                // The AI doesn't guess; it just reads this tag.
                allLines.push(`[GENDER:${currentGender}] ${lineText}`);
            }
        });
    }
    
    return allLines;
};

// --- 2. HEADER SCOUT ---
const detectHeaders = async (firstLines) => {
    try {
        // Remove the [GENDER:X] tags for header detection to reduce noise
        const cleanLines = firstLines.map(l => l.replace(/\[GENDER:\w+\]\s*/, ''));
        const textSample = cleanLines.join('\n');
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma-3-27b-it", 
                prompt: `
                Analyze these grade sheet lines.
                Identify the SUBJECT HEADERS (e.g. Filipino, English, Math, Science).
                The headers are usually in the first few lines.
                Ignore "Name", "Average", "Section".
                
                **CRITICAL:** Return the subjects in the EXACT order they appear from Left to Right.
                
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
        // Fallback headers if detection fails
        return ["Filipino", "English", "Math", "Science", "Aral Pan", "TLE", "MAPEH", "EsP"]; 
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
                        You are a strict data parser.
                        
                        **INPUT FORMAT:**
                        Each line looks like: "[GENDER:MALE] 1. LASTNAME, FIRSTNAME | Grade1 | Grade2 | Grade3..."
                        
                        **COLUMN MAPPING (STRICT):**
                        The grades following the name correspond STRICTLY to these subjects in order:
                        ${JSON.stringify(knownHeaders)}
                        
                        **YOUR TASK:**
                        1. Extract the Name (Remove leading numbers).
                        2. Read the [GENDER:...] tag explicitly. Do NOT guess gender. Use the tag provided.
                        3. Map the numbers to the subjects based on the order above.
                        4. If a number is missing/blank, put null.
                        
                        **OUTPUT FORMAT:**
                        Return ONLY a valid JSON array. No markdown.
                        [
                            {
                                "name": "ALILAIN, BRYAN D.",
                                "gender": "MALE", 
                                "grades": { "${knownHeaders[0]}": "82", "${knownHeaders[1]}": "78" ... },
                                "average": "81.00"
                            }
                        ]

                        **CHUNK TEXT:**
                        ${chunkText}
                        `
                    })
                });

                if (!response.ok) throw new Error(`Server status: ${response.status}`);
                
                const data = await response.json();
                // Sanitize response
                let cleanText = data.text.replace(/```json|```/g, '').trim();
                // Sometimes AI adds comments, ensure we only get the array
                const arrayStart = cleanText.indexOf('[');
                const arrayEnd = cleanText.lastIndexOf(']');
                if (arrayStart !== -1 && arrayEnd !== -1) {
                    cleanText = cleanText.substring(arrayStart, arrayEnd + 1);
                }
                
                return JSON.parse(cleanText);

            } catch (err) {
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
    console.log("📄 Reading PDF & Pre-Tagging...");
    
    // 1. Extract & Tag Lines (Deterministic Logic)
    const arrayBuffer = await file.arrayBuffer();
    const allLines = await extractPreTaggedLines(arrayBuffer);
    console.log(`✅ Extracted ${allLines.length} valid lines.`);

    // 2. Detect Headers (First 30 lines)
    const headers = await detectHeaders(allLines.slice(0, 30));
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
        // Skip obvious junk chunks
        if (chunks[i].length < 20) continue;

        console.log(`Processing Chunk ${i + 1}/${chunks.length}...`);
        
        const chunkRecords = await processChunkWithGemma(chunks[i], i, headers);
        
        if (Array.isArray(chunkRecords)) {
            allRecords = [...allRecords, ...chunkRecords];
        }
        
        // Safety Pause
        await new Promise(r => setTimeout(r, 300));
    }

    // 5. Post-Processing: Deduplicate
    const uniqueMap = new Map();
    allRecords.forEach(r => {
        if(r.name && r.name.length > 3) {
            // Clean name key
            const key = r.name.toUpperCase().replace(/[^A-Z]/g, '');
            // Only add if not exists (prefer first occurrence)
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, r);
            }
        }
    });

    return {
        meta: { 
            headers: headers,
            gradeLevel: "Detected" 
        },
        records: Array.from(uniqueMap.values())
    };
};