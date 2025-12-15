// src/utils/aiGradeParser.js
import { Capacitor } from '@capacitor/core';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
import Tesseract from 'tesseract.js';
import * as XLSX from 'xlsx';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const PROD_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const isNative = Capacitor.isNativePlatform();
const API_URL = `${isNative ? PROD_API_URL : ''}/api/gemini`;

// --- STOP TOKENS (Stop parsing immediately if seen) ---
const STOP_TERMS = [
    'CLASS ADVISER', 'ADVISER', 'CHECKED BY', 'PREPARED BY', 'ATTESTED', 
    'PRINCIPAL', 'SCHOOL HEAD', 'DIRECTOR', 'SIGNATURE', 'DATE CHECKED'
];

// --- SKIP TERMS (Skip this row, but keep parsing) ---
const EXCLUDED_TERMS = [
    'PARENT', 'TEACHER', 'LPT', 'MA-ELM', 'PHD', 'EDD', 'GUIDANCE', 
    'COORDINATOR', 'DEPARTMENT', 'MEAN', 'MPS', 'TOTAL', 
    'MALE', 'FEMALE', 'QUARTER', 'GRADING PERIOD', 'GRADE LEVEL', 
    'SECTION', 'SY:', 'SCHOOL', 'FAMILY', 'GIVEN', 'MIDDLE', 
    'INITIAL', 'NAME OF LEARNERS', 'NO.', 'BOYS', 'GIRLS', 'LEARNER'
];

const LINES_PER_CHUNK = 10; 

// --- HELPER: ROUNDING ---
const parseAndRound = (val) => {
    if (!val) return 0;
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    return Math.round(num);
};

// --- HELPER: STRICT NAME VALIDATOR ---
const isValidStudentName = (nameStr) => {
    if (!nameStr || nameStr.length < 3) return false;
    const upper = nameStr.toUpperCase();

    // 1. Must contain a comma (Standard: "LAST, FIRST")
    if (!upper.includes(',')) return false;

    // 2. Must NOT be a stop/exclude term
    if (STOP_TERMS.some(t => upper.includes(t))) return false;
    if (EXCLUDED_TERMS.some(t => upper.includes(t))) return false;

    // 3. Must NOT contain parentheses
    if (upper.includes('(') || upper.includes(')')) return false;

    // 4. Must start with a letter (after cleaning numbers)
    const clean = nameStr.replace(/^[\d.\s]+/, ''); 
    if (!/^[a-zA-Z]/.test(clean)) return false;

    return true;
};

// ============================================================================
// 1. EXCEL PARSER (Native)
// ============================================================================
const parseExcelFile = async (arrayBuffer) => {
    // Read with cellStyles: true to ensure we get hidden row metadata
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellStyles: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get Row Metadata (Hidden Status)
    const rowMeta = worksheet['!rows'] || [];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // A. Find Header Row
    let headerRowIndex = -1;
    let headers = [];
    
    for (let i = 0; i < Math.min(25, rawData.length); i++) {
        // Skip hidden rows in header search
        if (rowMeta[i] && (rowMeta[i].hidden || rowMeta[i].hpx === 0)) continue;

        const rowStr = (rawData[i] || []).join(' ').toUpperCase();
        if (rowStr.includes('MATH') || rowStr.includes('FILIPINO') || rowStr.includes('ENGLISH') || rowStr.includes('SCIENCE')) {
            headerRowIndex = i;
            headers = rawData[i].map(cell => (cell || '').toString().trim())
                .filter(h => h && !['NO', 'NO.', 'NAME', 'LEARNER', 'AVERAGE', 'REMARKS', 'GENDER', 'FINAL'].includes(h.toUpperCase()));
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.warn("Excel headers not found. Using defaults.");
        headers = ["Filipino", "English", "Mathematics", "Science", "Aral Pan", "TLE", "MAPEH", "EsP"];
        headerRowIndex = 5;
    }

    // B. Extract Data
    const records = [];
    let currentGender = 'MALE'; 

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        // 1. STRICT HIDDEN ROW CHECK
        // Check if row is explicitly hidden OR has zero height
        if (rowMeta[i] && (rowMeta[i].hidden || rowMeta[i].hpx === 0)) {
            continue; 
        }

        const row = rawData[i];
        if (!row || row.length === 0) continue;

        // Check first column for Markers or Stop Tokens
        const firstCol = (row[0] || '').toString().toUpperCase();
        
        // 🛑 STOP CONDITION: If we hit "Adviser", "Principal", etc., STOP parsing entirely.
        if (STOP_TERMS.some(term => firstCol.includes(term))) {
            break; 
        }

        // Gender Switch
        if (firstCol.includes('GIRLS') || firstCol.includes('FEMALE')) {
            currentGender = 'FEMALE';
            continue;
        }

        // 2. Identify Name
        let name = '';
        let nameIndex = -1;
        if (typeof row[1] === 'string' && row[1].length > 3) { name = row[1]; nameIndex = 1; }
        else if (typeof row[0] === 'string' && row[0].length > 3) { name = row[0]; nameIndex = 0; }

        // Clean name (Remove "1. ", "25.")
        const cleanName = name.replace(/^\d+[\.\s]+/, '').trim();

        // 3. STRICT VALIDATION
        if (!isValidStudentName(cleanName)) continue;

        // 4. Map Grades
        const grades = {};
        let gradeColIndex = nameIndex + 1;
        
        headers.forEach((subject) => {
            while (gradeColIndex < row.length && (row[gradeColIndex] === undefined || row[gradeColIndex] === '' || isNaN(parseFloat(row[gradeColIndex])))) {
                gradeColIndex++;
            }
            if (gradeColIndex < row.length) {
                grades[subject] = row[gradeColIndex];
                gradeColIndex++;
            }
        });

        // 5. Average
        let average = 0;
        while (gradeColIndex < row.length) {
            const val = parseFloat(row[gradeColIndex]);
            if (!isNaN(val)) {
                average = val;
                break;
            }
            gradeColIndex++;
        }

        records.push({
            name: cleanName,
            gender: currentGender,
            grades: grades,
            average: parseAndRound(average)
        });
    }

    return { meta: { headers, gradeLevel: "Detected" }, records };
};

// ============================================================================
// 2. PDF PARSER UTILITIES
// ============================================================================

const performOCR = async (pdfPage) => {
    const viewport = pdfPage.getViewport({ scale: 2.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await pdfPage.render({ canvasContext: ctx, viewport: viewport }).promise;
    const imageBlob = canvas.toDataURL('image/png');
    const result = await Tesseract.recognize(imageBlob, 'eng', { logger: () => {} });
    canvas.width = 0; canvas.height = 0;

    return result.data.lines.map(line => line.text.trim());
};

const detectHeadersSpatially = async (pdfDoc) => {
    try {
        const page = await pdfDoc.getPage(1);
        const textContent = await page.getTextContent();
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
    } catch (e) { return null; }
};

const extractPreTaggedLines = async (pdfDoc) => {
    const allLines = [];
    let currentGender = 'MALE'; 

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        let linesToProcess = [];

        if (textContent.items.length < 5) {
            linesToProcess = await performOCR(page);
        } else {
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

        linesToProcess.forEach(lineText => {
            const upperLine = lineText.toUpperCase();

            // Gender Switch
            if (upperLine.includes('GIRLS') || (upperLine.includes('FEMALE') && !upperLine.includes('MA-ELM'))) {
                currentGender = 'FEMALE';
                return; 
            }
            
            // Check STOP tokens in PDF lines too
            if (STOP_TERMS.some(t => upperLine.includes(t))) return;

            // Extract Name Part
            const parts = lineText.split('|');
            const potentialName = parts[0].trim().replace(/^\d+[\.\s]+/, '');

            // Strict Validation
            if (isValidStudentName(potentialName)) {
                allLines.push(`[GENDER:${currentGender}] ${lineText}`);
            }
        });
    }
    return allLines;
};

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
                        INPUT: "[GENDER:MALE] 1. LASTNAME, FIRSTNAME | Grade1 | Grade2..."
                        HEADERS: ${JSON.stringify(knownHeaders)}
                        TASK:
                        1. Extract Name (remove numbers).
                        2. Use [GENDER] tag value.
                        3. Map grades strictly by position.
                        4. Last number is Average.
                        OUTPUT: JSON Array ONLY.
                        [{"name":"...", "gender":"...", "grades":{...}, "average":"..."}]
                        TEXT:
                        ${chunkText}
                        `
                    })
                });

                if (!response.ok) throw new Error(`Status ${response.status}`);
                const data = await response.json();
                let clean = data.text.replace(/```json|```/g, '').trim();
                const s = clean.indexOf('['); const e = clean.lastIndexOf(']');
                if (s !== -1 && e !== -1) clean = clean.substring(s, e + 1);
                
                const parsed = JSON.parse(clean);
                return parsed.map(p => ({
                    ...p,
                    average: parseAndRound(p.average)
                }));

            } catch (err) {
                if (attempt === 2) throw err;
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    } catch (e) {
        return [];
    }
};

// ============================================================================
// 3. MAIN ORCHESTRATOR
// ============================================================================
export const parseCumulativeGrades = async (file) => {
    console.log(`📂 Processing file: ${file.name}`);
    const arrayBuffer = await file.arrayBuffer();

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type.includes('spreadsheet')) {
        console.log("📊 Excel detected. Using Direct Parser.");
        return await parseExcelFile(arrayBuffer);
    }

    console.log("📄 PDF detected. Initializing engine...");
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    console.log("📐 Calculating Headers...");
    let headers = await detectHeadersSpatially(pdfDoc);
    if (!headers) {
        headers = ["Filipino", "English", "Mathematics", "Science", "Aral Pan", "TLE", "MAPEH", "EsP"];
    }

    const allLines = await extractPreTaggedLines(pdfDoc);
    
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