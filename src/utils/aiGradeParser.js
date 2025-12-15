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
    'MALE', 'FEMALE', 'TOTAL' // Markers we handle manually
];

// --- TEXT EXTRACTION ENGINE (SPATIAL) ---
// This mimics your Lesson Generator's text extraction but adds logic 
// to keep table rows together based on Y-coordinates.
const extractStructuredTextFromPDF = async (arrayBuffer) => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullDocumentText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // 1. Group text items by Y-coordinate (Row Detection)
        // Items within 5px vertical difference are considered the same row
        const rows = {};
        textContent.items.forEach(item => {
            const y = Math.round(item.transform[5] / 5) * 5; // Bucket Y values
            if (!rows[y]) rows[y] = [];
            rows[y].push({ x: item.transform[4], str: item.str.trim() });
        });

        // 2. Sort Rows (Top to Bottom) and Columns (Left to Right)
        // PDF coordinates start from Bottom-Left, so higher Y is higher on page.
        const sortedY = Object.keys(rows).sort((a, b) => b - a);
        
        const pageLines = sortedY.map(y => {
            // Sort items in this row by X coordinate (Left to Right)
            const rowItems = rows[y].sort((a, b) => a.x - b.x);
            // Join with a pipe '|' to simulate table cells
            return rowItems.map(item => item.str).join(' | ');
        });

        fullDocumentText += `--- PAGE ${i} ---\n` + pageLines.join('\n') + "\n\n";
    }
    
    return fullDocumentText;
};

// --- GEMMA WORKER ---
const processWithGemma = async (structuredText) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma-3-27b-it", // Using Gemma as requested
                prompt: `
                You are a data extraction assistant. I will provide text extracted from a PDF Grade Sheet.
                The text is formatted with '|' separators to indicate table columns.

                **YOUR TASK:**
                1. Identify student rows. A student row typically looks like: "1. LASTNAME, FIRSTNAME | 85 | 88 | 90...".
                2. Extract the STUDENT NAME and ALL GRADES found in that row.
                3. Map the grades to subject headers if you can find them (e.g. Math, Filipino). If headers are unclear, just label keys as "Sub1", "Sub2", etc.
                4. Detect "BOYS" and "GIRLS" sections. Assign a "gender" field ('MALE' or 'FEMALE') to each student based on which section they appear under. Default to 'MALE' if unsure.
                
                **IGNORE THESE LINES:**
                - Lines containing: ${EXCLUDED_TERMS.join(', ')}
                - Headers, Footers, Signatures.

                **JSON OUTPUT FORMAT (STRICT):**
                Return ONLY a valid JSON array. Do not include markdown formatting like \`\`\`json.
                [
                    {
                        "name": "ALILAIN, BRYAN D.",
                        "gender": "MALE",
                        "grades": { "Math": "82", "Filipino": "78", "English": "81" ... },
                        "average": "81.00"
                    },
                    ...
                ]

                **SOURCE TEXT:**
                ${structuredText}
                `
            })
        });

        if (!response.ok) throw new Error(`AI Error: ${response.status}`);
        
        const data = await response.json();
        // Clean markdown if Gemma adds it
        const cleanText = data.text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);

    } catch (error) {
        console.error("Gemma parsing failed:", error);
        throw new Error("Failed to process grades with AI.");
    }
};

// --- MAIN FUNCTION ---
export const parseCumulativeGrades = async (file) => {
    console.log("📄 Reading PDF Text (Spatial Mode)...");
    
    // 1. Client-Side Text Extraction (No Vision)
    const arrayBuffer = await file.arrayBuffer();
    const structuredText = await extractStructuredTextFromPDF(arrayBuffer);
    
    console.log("🤖 Sending Text to Gemma...");
    
    // 2. Send Text to Gemma
    // We send the whole text at once because Gemma has a large context window (8k/128k)
    // and text is much smaller than images.
    const records = await processWithGemma(structuredText);

    // 3. Post-Processing (Headers)
    // Extract unique subject keys from the first few records to build headers
    const headersSet = new Set();
    records.slice(0, 5).forEach(r => Object.keys(r.grades).forEach(k => headersSet.add(k)));

    return {
        meta: { 
            headers: Array.from(headersSet),
            gradeLevel: "Detected from Context" 
        },
        records: records
    };
};