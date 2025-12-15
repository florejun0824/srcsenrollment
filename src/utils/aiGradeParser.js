// src/utils/aiGradeParser.js
import { Capacitor } from '@capacitor/core';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
import Tesseract from 'tesseract.js';
import * as XLSX from 'xlsx';

// Initialize PDF Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// --- API CONFIGURATION ---
const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const isNative = Capacitor.isNativePlatform();
const API_URL = `${isNative ? PROD_API_URL : ''}/api/gemini`;

// --- PARSER SETTINGS ---
const EXCLUDED_TERMS = [
    'PARENT', 'TEACHER', 'ADVISER', 'CHECKED BY', 'ATTESTED', 'PRINCIPAL', 
    'DATE', 'LPT', 'MA-ELM', 'PHD', 'EDD', 'GUIDANCE', 'COORDINATOR', 
    'SIGNATURE', 'APPROVED', 'SUBMITTED', 'DEPARTMENT',
    'MEAN', 'MPS', 'TOTAL', 'MALE', 'FEMALE', 'QUARTER', 'GRADING PERIOD',
    'GRADE LEVEL', 'SECTION', 'SY:', 'SCHOOL'
];

const LINES_PER_CHUNK = 10; // Small batch size to prevent 504 Timeouts

// ============================================================================
// 1. EXCEL PARSER (Native & 100% Accurate)
// ============================================================================
const parseExcelFile = async (arrayBuffer) => {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON (Array of Arrays)
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // A. Find Header Row
    let headerRowIndex = -1;
    let headers = [];
    
    // Scan first 25 rows
    for (let i = 0; i < Math.min(25, rawData.length); i++) {
        const rowStr = (rawData[i] || []).join(' ').toUpperCase();
        // Look for typical subject keywords
        if (rowStr.includes('MATH') || rowStr.includes('FILIPINO') || rowStr.includes('ENGLISH') || rowStr.includes('SCIENCE')) {
            headerRowIndex = i;
            // Clean headers: remove empty cols and non-subject metadata
            headers = rawData[i].map(cell => (cell || '').toString().trim())
                .filter(h => h && !['NO', 'NO.', 'NAME', 'LEARNER', 'AVERAGE', 'REMARKS', 'GENDER'].includes(h.toUpperCase()));
            break;
        }
    }

    if (headerRowIndex === -1) {
        // Fallback: If no headers found, return default DepEd subjects
        console.warn("Excel headers not found. Using defaults.");
        headers = ["Filipino", "English", "Mathematics", "Science", "Aral Pan", "TLE", "MAPEH", "EsP"];
        // Try to guess start of data by looking for a number "1" in first column
        headerRowIndex = rawData.findIndex(r => r[0] == 1 || r[0] == '1');
    }

    // B. Extract Data
    const records = [];
    let currentGender = 'MALE'; // Default to Boys

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        // Check for Gender Markers
        const firstCol = (row[0] || '').toString().toUpperCase();
        if (firstCol.includes('GIRLS') || firstCol.includes('FEMALE')) {
            currentGender = 'FEMALE';
            continue;
        }

        // Detect Name (First non-numeric text column)
        let name = '';
        let nameIndex = -1;
        
        // Check Column B then A (Index 1 then 0)
        if (typeof row[1] === 'string' && row[1].length > 3) { name = row[1]; nameIndex = 1; }
        else if (typeof row[0] === 'string' && row[0].length > 3) { name = row[0]; nameIndex = 0; }

        if (!name || EXCLUDED_TERMS.some(x => name.toUpperCase().includes(x))) continue;

        // Map Grades
        const grades = {};
        let gradeColIndex = nameIndex + 1; // Start looking after name
        
        headers.forEach((subject) => {
            // Find next numeric value in the row
            while (gradeColIndex < row.length && (row[gradeColIndex] === undefined || row[gradeColIndex] === '' || isNaN(parseFloat(row[gradeColIndex])))) {
                gradeColIndex++;
            }
            
            if (gradeColIndex < row.length) {
                grades[subject] = row[gradeColIndex];
                gradeColIndex++;
            }
        });

        records.push({
            name: name.replace(/^\d+\.?\s*/, '').trim(), // Clean "1. Name"
            gender: currentGender,
            grades: grades,
            average: 0
        });
    }

    return {
        meta: { headers, gradeLevel: "Detected" },
        records
    };
};

// ============================================================================
// 2. PDF PARSER UTILITIES
// ============================================================================

// --- OCR ENGINE (Tesseract.js) ---
const performOCR = async (pdfPage) => {
    // Render PDF page to high-res canvas
    const viewport = pdfPage.getViewport({ scale: 2.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await pdfPage.render({ canvasContext: ctx, viewport: viewport }).promise;
    const imageBlob = canvas.toDataURL('image/png');

    // Run Tesseract
    const result = await Tesseract.recognize(imageBlob, 'eng', {
        logger: () => {} // Silence logs
    });

    // Clean up
    canvas.width = 0; 
    canvas.height = 0;

    return result.data.lines.map(line => line.text.trim());
};

// --- SPATIAL HEADER DETECTOR (Dynamic) ---
const detectHeadersSpatially = async (pdfDoc) => {
    try {
        const page = await pdfDoc.getPage(1);
        const textContent = await page.getTextContent();
        
        // If empty text, we can't do spatial detection (it's an image)
        if (textContent.items.length < 10) return null;

        // 1. Locate the "Grade Body" (Cluster of numbers 60-100)
        const gradeItems = textContent.items.filter(item => {
            const num = parseFloat(item.str);
            return !isNaN(num) && num >= 60 && num <= 100 && item.str.length <= 6;
        });

        if (gradeItems.length < 10) return null;

        // Find Top Edge of grades (Higher Y is higher on page in PDF coords)
        const maxGradeY = Math.max(...gradeItems.map(i => i.transform[5]));
        
        // 2. Identify Columns
        const colMap = {};
        gradeItems.forEach(i => {
            const x = Math.round(i.transform[4] / 10) * 10; // Cluster X within 10px
            if (!colMap[x]) colMap[x] = 0;
            colMap[x]++;
        });

        const validCols = Object.keys(colMap)
            .filter(x => colMap[x] > 5)
            .map(Number)
            .sort((a, b) => a - b);

        // 3. Find Headers ABOVE the Grade Body
        const detectedHeaders = [];
        const items = textContent.items;

        validCols.forEach(colX => {
            // Find text that is above grades, aligned with column, and not too far up
            const candidates = items.filter(item => {
                const itemY = item.transform[5];
                const itemX = item.transform[4];
                return (
                    itemY > maxGradeY && 
                    itemY < maxGradeY + 200 && 
                    Math.abs(itemX - colX) < 30
                );
            });

            if (candidates.length > 0) {
                // Sort by Y ascending (closest to grades first)
                candidates.sort((a, b) => a.transform[5] - b.transform[5]);
                
                const bestMatch = candidates.find(c => 
                    !EXCLUDED_TERMS.some(term => c.str.toUpperCase().includes(term)) &&
                    c.str.length > 2
                );

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

// --- HYBRID LINE EXTRACTOR (Text + OCR + Gender Tagging) ---
const extractPreTaggedLines = async (pdfDoc) => {
    const allLines = [];
    let currentGender = 'MALE'; 

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        let linesToProcess = [];

        // CHECK: Is this page an image? (Empty text layer)
        if (textContent.items.length < 5) {
            console.log(`⚠️ Page ${i} appears to be an image. Running OCR...`);
            linesToProcess = await performOCR(page);
        } else {
            // Standard Spatial Extraction
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

            // Strict Gender Switch
            if (upperLine.includes('GIRLS') || (upperLine.includes('FEMALE') && !upperLine.includes('MA-ELM'))) {
                currentGender = 'FEMALE';
                return; // Don't add the header itself
            }
            
            // Exclude Noise
            const isNoise = EXCLUDED_TERMS.some(term => upperLine.includes(term));
            
            // Heuristic: Must contain name-like data
            if (!isNoise && lineText.length > 5) {
                // PRE-TAGGING: Inject Gender into text
                allLines.push(`[GENDER:${currentGender}] ${lineText}`);
            }
        });
    }
    return allLines;
};

// --- MICRO-CHUNK WORKER (Sends text to Gemma) ---
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
                        
                        **HEADERS (Strict Mapping):** ${JSON.stringify(knownHeaders)}
                        
                        **TASK:**
                        1. Extract Name (remove numbers).
                        2. Use [GENDER] tag value.
                        3. Map grades strictly by position: 
                           - 1st number found -> ${knownHeaders[0]}
                           - 2nd number found -> ${knownHeaders[1]}
                        
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
                
                // Safety: Extract array
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

// ============================================================================
// 3. MAIN ORCHESTRATOR
// ============================================================================
export const parseCumulativeGrades = async (file) => {
    console.log(`📂 Processing file: ${file.name}`);
    const arrayBuffer = await file.arrayBuffer();

    // --- A. EXCEL ROUTE (Preferred) ---
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type.includes('spreadsheet')) {
        console.log("📊 Excel detected. Using Direct Parser.");
        return await parseExcelFile(arrayBuffer);
    }

    // --- B. PDF ROUTE ---
    console.log("📄 PDF detected. Initializing engine...");
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // 1. Headers
    console.log("📐 Calculating Headers...");
    let headers = await detectHeadersSpatially(pdfDoc);
    if (!headers) {
        console.log("⚠️ Spatial detection uncertain. Using Defaults.");
        headers = ["Filipino", "English", "Mathematics", "Science", "Aral Pan", "TLE", "MAPEH", "EsP"];
    }
    console.log("✅ Headers Locked:", headers);

    // 2. Extract Lines (Handles Text & OCR)
    const allLines = await extractPreTaggedLines(pdfDoc);
    console.log(`📝 Extracted ${allLines.length} lines.`);

    // 3. Create Micro-Chunks
    const chunks = [];
    for (let i = 0; i < allLines.length; i += LINES_PER_CHUNK) {
        chunks.push(allLines.slice(i, i + LINES_PER_CHUNK).join('\n'));
    }

    // 4. Process Chunks Sequentially
    let allRecords = [];
    for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].length < 20) continue; // Skip noise chunks
        
        console.log(`⚡ Processing Chunk ${i + 1}/${chunks.length}...`);
        const records = await processChunkWithGemma(chunks[i], i, headers);
        
        if (Array.isArray(records)) {
            allRecords = [...allRecords, ...records];
        }
        
        // Anti-Rate Limit Pause
        await new Promise(r => setTimeout(r, 300));
    }

    // 5. Post-Processing: Deduplicate
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