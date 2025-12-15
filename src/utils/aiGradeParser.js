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
    'SIGNATURE', 'APPROVED', 'SUBMITTED', 'DEPARTMENT',
    'MEAN', 'MPS', 'TOTAL', 'MALE', 'FEMALE' 
];

const LINES_PER_CHUNK = 10; 

// --- 1. POWERFUL SPATIAL HEADER DETECTOR ---
// This uses pure geometry, not AI, to find headers.
const detectHeadersSpatially = async (pdfDoc) => {
    try {
        const page = await pdfDoc.getPage(1);
        const textContent = await page.getTextContent();
        
        // 1. Find "Grade-Like" Numbers to identify columns
        // We look for numbers between 65 and 100 that appear in the body
        const gradeItems = textContent.items.filter(item => {
            const num = parseFloat(item.str);
            return !isNaN(num) && num >= 65 && num <= 100 && item.transform[5] < 500; // Assuming header is above Y=500
        });

        if (gradeItems.length === 0) return []; // No grades found?

        // 2. Cluster X-Coordinates (Find Column Centers)
        const columnClusters = {};
        gradeItems.forEach(item => {
            const x = Math.round(item.transform[4] / 10) * 10; // Round X to nearest 10px to group columns
            if (!columnClusters[x]) columnClusters[x] = 0;
            columnClusters[x]++;
        });

        // Filter valid columns (must have at least 3 grades aligned vertically)
        const validColumnXs = Object.keys(columnClusters)
            .filter(x => columnClusters[x] > 3)
            .map(Number)
            .sort((a, b) => a - b); // Sort Left to Right

        // 3. Find Headers aligned with these X-Coords
        const headers = [];
        
        // We look at the top part of the page (Y > max grade Y)
        const headerItems = textContent.items.filter(item => item.transform[5] > 300); // Adjust Y threshold if needed

        validColumnXs.forEach(colX => {
            // Find the text item closest to this column's X
            // We give a tolerance of +/- 20px
            const match = headerItems.find(hItem => Math.abs(hItem.transform[4] - colX) < 25);
            
            if (match) {
                // Clean the header text (remove "7", punctuation)
                let cleanHeader = match.str.replace(/[^a-zA-Z\s]/g, '').trim();
                // If empty or just "A", might be part of "MAPEH: Arts", try to keep context
                if (cleanHeader.length < 2) cleanHeader = match.str; 
                headers.push(cleanHeader);
            } else {
                headers.push(`Subject_${colX}`); // Placeholder if visual match fails
            }
        });

        // Filter out obvious non-subjects or duplicates
        const uniqueHeaders = [...new Set(headers.filter(h => h.length > 2 && !h.includes("QUARTER")))];
        
        // Safety Fallback: If spatial fails (returns 0 or 1), use default list
        if (uniqueHeaders.length < 4) return null;

        return uniqueHeaders;

    } catch (error) {
        console.warn("Spatial header detection failed:", error);
        return null;
    }
};

// --- 2. TEXT EXTRACTOR WITH DETERMINISTIC GENDER ---
const extractPreTaggedLines = async (pdfDoc) => {
    const allLines = [];
    let currentGender = 'MALE'; // Start assuming Boys

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group by Y (Rows)
        const rows = {};
        textContent.items.forEach(item => {
            const y = Math.round(item.transform[5] / 4) * 4; 
            if (!rows[y]) rows[y] = [];
            rows[y].push({ x: item.transform[4], str: item.str.trim() });
        });

        // Sort Rows (Top to Bottom)
        const sortedY = Object.keys(rows).sort((a, b) => b - a);
        
        sortedY.forEach(y => {
            const rowItems = rows[y].sort((a, b) => a.x - b.x);
            const lineText = rowItems.map(item => item.str).join(' | '); 
            const upperLine = lineText.toUpperCase();

            // --- STRICT GENDER SWITCH ---
            // If the row contains ONLY "GIRLS" or "FEMALE" (ignoring "MA-ELM" suffix in signatures)
            // Or if "GIRLS" appears as a distinct column
            const isGenderHeader = rowItems.some(item => 
                (item.str.toUpperCase() === 'GIRLS' || item.str.toUpperCase() === 'FEMALE')
            );

            if (isGenderHeader) {
                currentGender = 'FEMALE';
                return; // Don't add the header itself to data
            }
            
            // Exclude Noise
            const isNoise = EXCLUDED_TERMS.some(term => upperLine.includes(term));
            
            // Add Data
            if (!isNoise && lineText.length > 5) {
                allLines.push(`[GENDER:${currentGender}] ${lineText}`);
            }
        });
    }
    
    return allLines;
};

// --- 3. MICRO-CHUNK WORKER ---
const processChunkWithGemma = async (chunkText, chunkIndex, knownHeaders) => {
    try {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: "gemma-3-27b-it", 
                        prompt: `
                        You are a strict data parser.
                        
                        **INPUT:**
                        "[GENDER:MALE] 1. LASTNAME, FIRSTNAME | Grade1 | Grade2..."
                        
                        **COLUMN MAP (1st number -> 1st Subject):**
                        ${JSON.stringify(knownHeaders)}
                        
                        **TASK:**
                        1. Extract Name (remove numbers).
                        2. Use [GENDER] tag.
                        3. Map grades strictly by position. The first number found is ${knownHeaders[0]}, the second is ${knownHeaders[1]}, etc.
                        
                        **OUTPUT:**
                        JSON Array ONLY. No markdown.
                        [{"name": "...", "gender": "...", "grades": {...}, "average": "..."}]

                        **TEXT:**
                        ${chunkText}
                        `
                    })
                });

                if (!response.ok) throw new Error(`Status ${response.status}`);
                const data = await response.json();
                let clean = data.text.replace(/```json|```/g, '').trim();
                const start = clean.indexOf('[');
                const end = clean.lastIndexOf(']');
                if (start !== -1) clean = clean.substring(start, end + 1);
                return JSON.parse(clean);

            } catch (err) {
                if (attempt === 2) throw err;
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    } catch (e) {
        console.error(`Chunk ${chunkIndex} error:`, e);
        return [];
    }
};

// --- MAIN ORCHESTRATOR ---
export const parseCumulativeGrades = async (file) => {
    console.log("📄 Reading PDF...");
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // 1. SPATIAL HEADER DETECTION (The "Powerful" Way)
    console.log("📐 Calculating Geometry...");
    let headers = await detectHeadersSpatially(pdfDoc);
    
    if (!headers) {
        console.log("⚠️ Spatial detection uncertain, falling back to defaults.");
        // Standard DepEd Order Fallback
        headers = ["Filipino", "English", "Mathematics", "Science", "Aral Pan", "TLE", "MAPEH", "EsP"];
    }
    console.log("✅ Headers Locked:", headers);

    // 2. EXTRACT TEXT & GENDER
    const allLines = await extractPreTaggedLines(pdfDoc);
    console.log(`📝 Extracted ${allLines.length} student lines.`);

    // 3. CHUNK & PROCESS
    const chunks = [];
    for (let i = 0; i < allLines.length; i += LINES_PER_CHUNK) {
        chunks.push(allLines.slice(i, i + LINES_PER_CHUNK).join('\n'));
    }

    let allRecords = [];
    for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].length < 20) continue;
        console.log(`⚡ Processing Chunk ${i + 1}/${chunks.length}...`);
        
        const records = await processChunkWithGemma(chunks[i], i, headers);
        if (Array.isArray(records)) allRecords = [...allRecords, ...records];
        
        await new Promise(r => setTimeout(r, 300));
    }

    // 4. DEDUPLICATE
    const uniqueMap = new Map();
    allRecords.forEach(r => {
        if(r.name && r.name.length > 3) {
            const key = r.name.toUpperCase().replace(/[^A-Z]/g, '');
            if (!uniqueMap.has(key)) uniqueMap.set(key, r);
        }
    });

    return {
        meta: { headers: headers, gradeLevel: "Detected" },
        records: Array.from(uniqueMap.values())
    };
};