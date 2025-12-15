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

// --- 1. SPATIAL TEXT EXTRACTOR (RETURNS PAGES ARRAY) ---
const extractStructuredTextPages = async (arrayBuffer) => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group items by Y-coordinate (Row Detection)
        const rows = {};
        textContent.items.forEach(item => {
            const y = Math.round(item.transform[5] / 5) * 5; // Bucket Y values to 5px tolerance
            if (!rows[y]) rows[y] = [];
            rows[y].push({ x: item.transform[4], str: item.str.trim() });
        });

        // Sort Rows (Top to Bottom)
        const sortedY = Object.keys(rows).sort((a, b) => b - a);
        
        const pageLines = sortedY.map(y => {
            // Sort Columns (Left to Right)
            const rowItems = rows[y].sort((a, b) => a.x - b.x);
            return rowItems.map(item => item.str).join(' | '); // Pipe separator
        });

        // Add this page's text as a distinct chunk
        pages.push(pageLines.join('\n'));
    }
    
    return pages;
};

// --- 2. HEADER SCOUT (Look at Page 1 only) ---
const detectHeaders = async (firstPageText) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "gemma-3-27b-it", 
                prompt: `
                Analyze this Grade Sheet text.
                Identify the SUBJECT HEADERS (e.g. Filipino, English, Math, Science).
                Ignore "Name", "Average", "Section".
                
                Return strictly a JSON array of strings: ["Math", "English", "Filipino"]
                
                TEXT:
                ${firstPageText.substring(0, 1500)}
                `
            })
        });
        
        if (!response.ok) return [];
        const data = await response.json();
        const clean = data.text.replace(/```json|```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.warn("Header detection failed, defaulting to auto-inference.");
        return [];
    }
};

// --- 3. BATCH WORKER (Process One Page) ---
const processPageWithGemma = async (pageText, pageIndex, knownHeaders) => {
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
                        You are a data extraction assistant. 
                        
                        CONTEXT:
                        - This is Page ${pageIndex + 1} of a Grade Sheet.
                        - Columns are separated by '|'.
                        - The detected subject headers are: ${JSON.stringify(knownHeaders)}.
                        
                        YOUR TASK:
                        1. Extract student rows. Format: "LASTNAME, FIRSTNAME".
                        2. Map grades to the subject headers provided.
                        3. If you see "BOYS" or "GIRLS", use that to infer gender for subsequent names. Default to 'MALE' if unknown.
                        
                        IGNORE:
                        - Lines containing: ${EXCLUDED_TERMS.join(', ')}
                        - Headers, Footers, Signatures.

                        OUTPUT FORMAT:
                        Return ONLY a valid JSON array. No markdown.
                        [
                            {
                                "name": "ALILAIN, BRYAN D.",
                                "gender": "MALE",
                                "grades": { "Math": "82", "English": "81"... },
                                "average": "81.00"
                            }
                        ]

                        PAGE TEXT:
                        ${pageText}
                        `
                    })
                });

                if (!response.ok) throw new Error(`Server status: ${response.status}`);
                
                const data = await response.json();
                const cleanText = data.text.replace(/```json|```/g, '').trim();
                return JSON.parse(cleanText);

            } catch (err) {
                if (attempt === 2) throw err; // Throw on final fail
                console.warn(`Page ${pageIndex + 1} attempt ${attempt + 1} failed. Retrying...`);
                await new Promise(r => setTimeout(r, 2000)); // Wait 2s before retry
            }
        }
    } catch (error) {
        console.error(`Failed to process Page ${pageIndex + 1}:`, error);
        return []; // Return empty for this page to allow others to succeed
    }
};

// --- MAIN FUNCTION ---
export const parseCumulativeGrades = async (file) => {
    console.log("📄 Reading PDF Structure...");
    
    // 1. Extract Text Pages (Client Side - Fast)
    const arrayBuffer = await file.arrayBuffer();
    const textPages = await extractStructuredTextPages(arrayBuffer);
    
    console.log(`✅ Extracted ${textPages.length} pages of text.`);

    // 2. Detect Headers (Use Page 1)
    console.log("🕵️ Detecting headers from Page 1...");
    const headers = await detectHeaders(textPages[0]);
    console.log("Headers found:", headers);

    // 3. Batch Process Pages (Sequential to prevent Rate Limiting/Timeout)
    let allRecords = [];
    
    for (let i = 0; i < textPages.length; i++) {
        console.log(`⚡ Processing Page ${i + 1}/${textPages.length}...`);
        
        const pageRecords = await processPageWithGemma(textPages[i], i, headers);
        
        if (Array.isArray(pageRecords)) {
            allRecords = [...allRecords, ...pageRecords];
        }
        
        // Small breathing room between batches to prevent 429 Rate Limits
        await new Promise(r => setTimeout(r, 1000));
    }

    // 4. Post-Processing
    // Deduplicate by name just in case of overlap (rare with page splitting)
    const uniqueMap = new Map();
    allRecords.forEach(r => {
        if(r.name && r.name.length > 3) {
            uniqueMap.set(r.name.toUpperCase().replace(/[^A-Z]/g, ''), r);
        }
    });

    return {
        meta: { 
            headers: headers.length > 0 ? headers : ["Math", "English", "Science", "Filipino"], // Fallback
            gradeLevel: "Detected" 
        },
        records: Array.from(uniqueMap.values())
    };
};