// src/utils/aiGradeParser.js
import { Capacitor } from '@capacitor/core';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
import Tesseract from 'tesseract.js'; // NEW: OCR Library

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const isNative = Capacitor.isNativePlatform();
const API_URL = `${isNative ? PROD_API_URL : ''}/api/gemini`;

const EXCLUDED_TERMS = [
    'PARENT', 'TEACHER', 'ADVISER', 'CHECKED BY', 'ATTESTED', 'PRINCIPAL', 
    'DATE', 'LPT', 'MA-ELM', 'PHD', 'EDD', 'GUIDANCE', 'COORDINATOR', 
    'SIGNATURE', 'APPROVED', 'SUBMITTED', 'DEPARTMENT',
    'MEAN', 'MPS', 'TOTAL', 'MALE', 'FEMALE', 'QUARTER' 
];

const LINES_PER_CHUNK = 10; 

// --- 1. OCR ENGINE (For Image-Based PDFs) ---
const performOCR = async (pdfPage) => {
    // Render PDF page to high-res canvas
    const viewport = pdfPage.getViewport({ scale: 2.5 }); // High scale for better OCR
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await pdfPage.render({ canvasContext: ctx, viewport: viewport }).promise;
    const imageBlob = canvas.toDataURL('image/png');

    // Run Tesseract
    const result = await Tesseract.recognize(imageBlob, 'eng', {
        logger: m => {} // Silence logs
    });

    // Clean up to save memory
    canvas.width = 0;
    canvas.height = 0;

    return result.data.lines.map(line => {
        // Normalize OCR output to match our Spatial format
        // Tesseract doesn't give columns, so we just return the line text.
        // We might lose column strictness, but Gemma is smart enough to handle spaced numbers.
        return line.text.trim();
    });
};

// --- 2. SPATIAL HEADER DETECTOR ---
const detectHeadersSpatially = async (pdfDoc) => {
    try {
        const page = await pdfDoc.getPage(1);
        const textContent = await page.getTextContent();
        
        // If text content is empty, we can't use spatial detection on headers either
        if (textContent.items.length < 10) return null;

        const gradeItems = textContent.items.filter(item => {
            const num = parseFloat(item.str);
            return !isNaN(num) && num >= 60 && num <= 100 && item.str.length <= 6;
        });

        if (gradeItems.length < 10) return null; 

        const maxGradeY = Math.max(...gradeItems.map(i => i.transform[5]));
        const colMap = {};
        gradeItems.forEach(i => {
            const x = Math.round(i.transform[4] / 10) * 10;
            if (!colMap[x]) colMap[x] = 0;
            colMap[x]++;
        });

        const validCols = Object.keys(colMap).filter(x => colMap[x] > 5).map(Number).sort((a, b) => a - b);
        const detectedHeaders = [];
        const items = textContent.items;

        validCols.forEach(colX => {
            const candidates = items.filter(item => {
                const itemY = item.transform[5];
                const itemX = item.transform[4];
                return (itemY > maxGradeY && itemY < maxGradeY + 200 && Math.abs(itemX - colX) < 30);
            });

            if (candidates.length > 0) {
                candidates.sort((a, b) => a.transform[5] - b.transform[5]);
                const bestMatch = candidates.find(c => !EXCLUDED_TERMS.some(term => c.str.toUpperCase().includes(term)) && c.str.length > 2);
                if (bestMatch) {
                    let h = bestMatch.str.replace(/[^a-zA-Z\s]/g, '').trim(); 
                    if (h.length > 1) detectedHeaders.push(h);
                }
            }
        });

        const unique = [...new Set(detectedHeaders)];
        return unique.length >= 3 ? unique : null;

    } catch (e) {
        return null;
    }
};

// --- 3. HYBRID TEXT EXTRACTOR (TEXT + OCR) ---
const extractPreTaggedLines = async (pdfDoc) => {
    const allLines = [];
    let currentGender = 'MALE'; 

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        let linesToProcess = [];

        // CHECK: Is this page an image? (Empty text layer)
        if (textContent.items.length < 5) {
            console.log(`⚠️ Page ${i} appears to be an image. Running OCR... (This may take a moment)`);
            linesToProcess = await performOCR(page);
        } else {
            // Standard Spatial Extraction (Faster)
            const rows = {};
            textContent.items.forEach(item => {
                const y = Math.round(item.transform[5] / 4) * 4; 
                if (!rows[y]) rows[y] = [];
                rows[y].push({ x: item.transform[4], str: item.str.trim() });
            });
            const sortedY = Object.keys(rows).sort((a, b) => b - a);
            linesToProcess = sortedY.map(y => {
                const rowItems = rows[y].sort((a, b) => a.x - b.x);
                return rowItems.map(item => item.str).join(' | '); 
            });
        }

        // Process Lines
        linesToProcess.forEach(lineText => {
            const upperLine = lineText.toUpperCase();

            // Gender Switch
            if (upperLine.includes('GIRLS') || (upperLine.includes('FEMALE') && !upperLine.includes('MA-ELM'))) {
                currentGender = 'FEMALE';
                return;
            }
            
            // Exclude Noise
            const isNoise = EXCLUDED_TERMS.some(term => upperLine.includes(term));
            
            // Heuristic: Must contain a name-like structure or numbers
            if (!isNoise && lineText.length > 5) {
                allLines.push(`[GENDER:${currentGender}] ${lineText}`);
            }
        });
    }
    return allLines;
};

// --- 4. MICRO-CHUNK WORKER ---
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
                        Strict Data Extraction.
                        
                        **INPUT:**
                        "[GENDER:MALE] 1. LASTNAME, FIRSTNAME | Grade1 | Grade2..."
                        
                        **HEADERS:** ${JSON.stringify(knownHeaders)}
                        
                        **TASK:**
                        1. Extract Name (remove numbers).
                        2. Use [GENDER] tag.
                        3. Map numbers to headers sequentially.
                        
                        **OUTPUT:**
                        JSON Array ONLY.
                        [{"name":"...", "gender":"...", "grades":{...}, "average":"..."}]

                        **TEXT:**
                        ${chunkText}
                        `
                    })
                });

                if (!response.ok) throw new Error(`Status ${response.status}`);
                const data = await response.json();
                let clean = data.text.replace(/```json|```/g, '').trim();
                const s = clean.indexOf('['); const e = clean.lastIndexOf(']');
                if (s !== -1 && e !== -1) clean = clean.substring(s, e + 1);
                return JSON.parse(clean);

            } catch (err) {
                if (attempt === 2) throw err;
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    } catch (e) {
        console.error(`Chunk ${chunkIndex} error:`, e);
        return [];
    }
};

// --- MAIN ---
export const parseCumulativeGrades = async (file) => {
    console.log("📄 Reading PDF...");
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // 1. Headers
    console.log("📐 Calculating Headers...");
    let headers = await detectHeadersSpatially(pdfDoc);
    if (!headers) {
        console.log("Using Default Headers (OCR/Fallback)");
        headers = ["Filipino", "English", "Mathematics", "Science", "Aral Pan", "TLE", "MAPEH", "EsP"];
    }
    console.log("✅ Headers:", headers);

    // 2. Extract Lines (Text OR OCR)
    const allLines = await extractPreTaggedLines(pdfDoc);
    console.log(`📝 Extracted ${allLines.length} lines.`);

    // 3. Process
    const chunks = [];
    for (let i = 0; i < allLines.length; i += LINES_PER_CHUNK) {
        chunks.push(allLines.slice(i, i + LINES_PER_CHUNK).join('\n'));
    }

    let allRecords = [];
    for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].length < 20) continue;
        console.log(`Processing Chunk ${i + 1}/${chunks.length}...`);
        const records = await processChunkWithGemma(chunks[i], i, headers);
        if (Array.isArray(records)) allRecords = [...allRecords, ...records];
        await new Promise(r => setTimeout(r, 300));
    }

    // 4. Deduplicate
    const uniqueMap = new Map();
    allRecords.forEach(r => {
        if(r.name && r.name.length > 3) {
            const key = r.name.toUpperCase().replace(/[^A-Z]/g, '');
            if (!uniqueMap.has(key)) uniqueMap.set(key, r);
        }
    });

    return {
        meta: { headers, gradeLevel: "Detected" },
        records: Array.from(uniqueMap.values())
    };
};