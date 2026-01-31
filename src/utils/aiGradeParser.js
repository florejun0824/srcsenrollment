// src/utils/aiGradeParser.js
import readXlsxFile from 'read-excel-file';

/**
 * Parses the uploaded Excel file to extract student grades and metadata.
 * Prioritizes the "GRADESHEETS" tab and looks for "SUBJECT:" and "GRADE/SECTION" info.
 */
export const parseCumulativeGrades = async (file) => {
    try {
        // 1. Get the list of sheets to find "GRADESHEETS"
        const sheets = await readXlsxFile(file, { getSheets: true });
        
        // Find the specific tab, or fallback to the first one
        const targetSheet = sheets.find(s => s.name.toUpperCase().includes('GRADESHEET')) || sheets[0];
        
        // 2. Read the content of the target sheet
        const rows = await readXlsxFile(file, { sheet: targetSheet.name });

        if (!rows || rows.length === 0) {
            throw new Error("The selected sheet is empty.");
        }

        // --- META DATA EXTRACTION ---
        let detectedSubject = null;
        let detectedGradeSection = null;
        let headerRowIndex = -1;
        let quarterlyGradeColIndex = -1;
        let nameColIndex = -1;
        
        // Scan the first 25 rows for Metadata (Subject/Grade) and Header location
        for (let i = 0; i < Math.min(rows.length, 25); i++) {
            const rowStr = rows[i].map(cell => String(cell || '').toUpperCase()).join(' ');
            const cells = rows[i].map(c => String(c || '').trim());

            // A. Detect Subject
            if (!detectedSubject && rowStr.includes('SUBJECT')) {
                const subjIndex = cells.findIndex(c => c.toUpperCase().includes('SUBJECT:'));
                if (subjIndex !== -1) {
                    const cellContent = cells[subjIndex];
                    const split = cellContent.split(':');
                    if (split.length > 1 && split[1].trim().length > 1) {
                        detectedSubject = split[1].trim();
                    } else {
                        // Look ahead for subject name
                        for (let k = 1; k < 5; k++) {
                            if (cells[subjIndex + k] && cells[subjIndex + k].length > 2) {
                                detectedSubject = cells[subjIndex + k];
                                break;
                            }
                        }
                    }
                }
            }

            // B. Detect Grade & Section (NEW)
            if (!detectedGradeSection && (rowStr.includes('GRADE') || rowStr.includes('SECTION'))) {
                const labelIndex = cells.findIndex(c => 
                    c.toUpperCase().includes('GRADE') || c.toUpperCase().includes('SECTION')
                );
                
                if (labelIndex !== -1) {
                    // Look ahead up to 6 cells for the value (e.g., "12 - St. Mary")
                    for (let k = 1; k < 6; k++) {
                        const val = cells[labelIndex + k];
                        // Ensure found value is not empty and not just another label part
                        if (val && val.length > 1 && !val.toUpperCase().includes('GRADE') && !val.toUpperCase().includes('SECTION')) {
                            detectedGradeSection = val;
                            break;
                        }
                    }
                }
            }

            // C. Detect Header Row
            if (headerRowIndex === -1 && (rowStr.includes("LEARNERS") || rowStr.includes("QUARTERLY"))) {
                headerRowIndex = i;
                rows[i].forEach((cell, idx) => {
                    const val = String(cell || '').toUpperCase();
                    if (val.includes("NAME") || val.includes("LEARNER")) nameColIndex = idx;
                    if (val.includes("QUARTERLY") || val.includes("GRADE")) quarterlyGradeColIndex = idx; 
                });
            }
        }

        // --- RECORD EXTRACTION ---
        const records = [];
        let currentGender = 'MALE'; 
        
        const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 10; 

        for (let i = startRow; i < rows.length; i++) {
            const row = rows[i];
            
            // Detect Gender Section Headers
            if (row.some(c => String(c).toUpperCase() === 'MALE')) {
                currentGender = 'MALE';
                continue;
            }
            if (row.some(c => String(c).toUpperCase() === 'FEMALE')) {
                currentGender = 'FEMALE';
                continue;
            }

            // Get potential name
            const potentialName = nameColIndex !== -1 ? row[nameColIndex] : (row[1] || row[0]);
            
            // --- STRICT FILTERING ---
            let studentName = String(potentialName || '').trim();
            const upperName = studentName.toUpperCase();

            if (studentName.length < 3) continue;
            if (upperName.includes("HIGHEST POSSIBLE SCORE")) continue;
            if (upperName.includes("TOTAL")) continue;
            if (upperName.includes("INITIAL GRADE")) continue;
            if (!/[a-zA-Z]/.test(studentName)) continue; 

            // Cleanup leading numbers
            studentName = studentName.replace(/^\d+[\.\)\s]*\s*/, '');
            if (studentName.length < 2) continue;

            // --- GRADE EXTRACTION ---
            let grade = '';
            
            if (quarterlyGradeColIndex !== -1 && row[quarterlyGradeColIndex]) {
                grade = row[quarterlyGradeColIndex];
            } else {
                // Heuristic: Last valid number between 60-100
                const numericValues = row.map(c => parseFloat(c)).filter(n => !isNaN(n) && n > 50 && n <= 100);
                if (numericValues.length > 0) {
                    grade = numericValues[numericValues.length - 1];
                }
            }

            if (grade) {
                grade = Math.round(parseFloat(grade));
            }

            records.push({
                name: studentName,
                gender: currentGender,
                average: grade,
                grades: {
                    "Quarterly Grade": grade 
                }
            });
        }

        return {
            meta: {
                subject: detectedSubject,
                gradeSection: detectedGradeSection, // Now returning detected Grade/Section
                rawHeaders: rows.slice(0, 10) 
            },
            records
        };

    } catch (error) {
        console.error("Parser Error:", error);
        throw new Error("Failed to parse Excel file. Please ensure it is a valid Gradesheet.");
    }
};