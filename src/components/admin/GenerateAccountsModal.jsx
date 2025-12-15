// src/components/admin/GenerateAccountsModal.jsx
import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx'; 
import { FileUp, X, Check, Loader2, RefreshCw } from 'lucide-react';

// --- CONFIGURATION ---
const STOP_TERMS = [
    'CLASS ADVISER', 'ADVISER', 'CHECKED BY', 'PREPARED BY', 'ATTESTED', 
    'PRINCIPAL', 'SCHOOL HEAD', 'DIRECTOR', 'SIGNATURE', 'DATE CHECKED',
    'SU-AY', 'HIMAMAYLAN', 'NEGROS OCCIDENTAL', 'CUMULATIVE GRADE SHEET'
];

const EXCLUDED_TERMS = [
    'PARENT', 'TEACHER', 'LPT', 'MA-ELM', 'PHD', 'EDD', 'GUIDANCE', 
    'COORDINATOR', 'DEPARTMENT', 'MEAN', 'MPS', 'TOTAL', 
    'MALE', 'FEMALE', 'QUARTER', 'GRADING PERIOD', 'GRADE LEVEL', 
    'SECTION', 'SY:', 'SCHOOL', 'FAMILY', 'GIVEN', 'MIDDLE', 
    'INITIAL', 'NAME OF LEARNERS', 'NO.', 'BOYS', 'GIRLS', 'LEARNER',
    'SUBJECT', 'TRACK', 'STRAND'
];

// --- HELPER: STRICT NAME VALIDATOR ---
const isValidStudentName = (nameStr) => {
    if (!nameStr || nameStr.length < 3) return false;
    const upper = nameStr.toUpperCase().trim();
    
    // 1. Check against Stop/Skip Terms
    if (STOP_TERMS.some(t => upper.includes(t))) return false;
    if (EXCLUDED_TERMS.some(t => upper.includes(t))) return false;
    
    // 2. Formatting Checks
    if (upper.includes('(') || upper.includes(')')) return false; 
    if (upper.includes(':')) return false; 

    // 3. Must start with a letter (after cleaning numbers like "1. ")
    const clean = nameStr.replace(/^[\d.\s]+/, ''); 
    if (!/^[a-zA-Z]/.test(clean)) return false;

    return true;
};

// --- HELPER: GENERATE CUSTOM USERNAME ---
// Format: srcs + surname + first_initial + middle_initial
// Example: "ABAS, CHESCA D." -> srcsabascd
const generateCredentials = (fullName) => {
    // 1. Clean and Parse Name
    // Remove numbers, trim, uppercase
    const clean = fullName.replace(/^[\d.\s]+/, '').toUpperCase().trim();
    
    // Split by comma to separate Surname from First/Middle
    // Format assumed: "LASTNAME, FIRSTNAME MI."
    const parts = clean.split(',');
    
    let surname = '';
    let rest = '';

    if (parts.length > 1) {
        surname = parts[0].trim();
        rest = parts[1].trim();
    } else {
        // Fallback if no comma: Assume last word is surname? 
        // Or better, assume first word is surname for safety in lists like "Abas Chesca"
        const spaceParts = clean.split(' ');
        surname = spaceParts[0];
        rest = spaceParts.slice(1).join(' ');
    }

    // 2. Build Username Parts
    // Prefix
    const prefix = 'srcs';
    
    // Surname: Remove spaces (DELA CRUZ -> delacruz)
    const surnameClean = surname.replace(/\s+/g, '').toLowerCase();
    
    // First Initial
    const firstInitial = rest.charAt(0).toLowerCase();

    // Middle Initial: Look for the last part of "rest" usually
    // Logic: If "CHESCA D.", splits to ["CHESCA", "D."] -> Take 'd'
    // If "CHESCA", splits to ["CHESCA"] -> No middle initial
    const restParts = rest.split(/\s+/);
    let middleInitial = '';
    
    if (restParts.length > 1) {
        // Check if the last part looks like an initial (1 char or 1 char + dot)
        const lastPart = restParts[restParts.length - 1].replace('.', '');
        if (lastPart.length === 1) {
            middleInitial = lastPart.toLowerCase();
        }
    }

    // Combine
    const username = `${prefix}${surnameClean}${firstInitial}${middleInitial}`;

    // 3. Generate Random Password (8 chars)
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return { username, password, cleanName: clean };
};

const GenerateAccountsModal = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- 1. SMART PARSER ---
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const arrayBuffer = evt.target.result;
            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            
            // Access Row Metadata to detect Hidden Rows
            const rowMeta = ws['!rows'] || [];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }); 

            const generated = [];
            
            data.forEach((row, rowIndex) => {
                // 1. Skip if row is empty or undefined
                if (!row || row.length === 0) return;

                // 2. Skip Hidden Rows (Excel Metadata)
                if (rowMeta[rowIndex] && (rowMeta[rowIndex].hidden || rowMeta[rowIndex].hpx === 0)) {
                    return;
                }

                // 3. Find Name Candidate
                let potentialName = '';
                // Check Col 0
                if (typeof row[0] === 'string' && row[0].length > 3) potentialName = row[0];
                // Check Col 1 (if Col 0 is number like "1.")
                else if (typeof row[1] === 'string' && row[1].length > 3) potentialName = row[1];

                // 4. Validate Name
                if (isValidStudentName(potentialName)) {
                    const creds = generateCredentials(potentialName);
                    
                    generated.push({
                        studentName: creds.cleanName,
                        username: creds.username,
                        password: creds.password
                    });
                }
            });

            setPreviewData(generated);
            setIsProcessing(false);
        };
        reader.readAsArrayBuffer(selectedFile); // Use ArrayBuffer for robust reading
    };

    // --- 2. RE-ROLL (Only Passwords) ---
    const handleRegeneratePasswords = () => {
        setIsProcessing(true);
        const updated = previewData.map(item => {
            const newPass = Math.random().toString(36).slice(-8);
            return { ...item, password: newPass };
        });
        setPreviewData(updated);
        setIsProcessing(false);
    };

    // --- 3. SAVE ---
    const handleSave = async () => {
        if (previewData.length === 0) return;
        setIsSaving(true);

        try {
            const batch = writeBatch(db);
            const collectionRef = collection(db, "student_accounts");

            previewData.forEach(item => {
                const newDocRef = doc(collectionRef); 
                batch.set(newDocRef, {
                    ...item,
                    createdAt: new Date()
                });
            });

            await batch.commit();
            alert(`Successfully created ${previewData.length} accounts!`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error saving accounts: " + error.message);
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <FileUp className="w-5 h-5 text-indigo-400" />
                            Generate Accounts
                        </h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Format: srcs + surname + initials (e.g. srcsabascd)
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    
                    {!file ? (
                        // UPLOAD STATE
                        <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors group">
                            <div className="w-20 h-20 bg-indigo-600/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <FileUp className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Upload Gradebook or Class List</h3>
                            <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed">
                                Upload your Excel file. Hidden rows and headers (e.g., "CUMULATIVE GRADE SHEET") will be ignored.
                            </p>
                            <label className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center gap-2">
                                Choose Excel File
                                <input type="file" onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                            </label>
                        </div>
                    ) : (
                        // PREVIEW STATE
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="text-white font-bold">Preview Credentials</h3>
                                    <p className="text-xs text-slate-500">
                                        Parsed {previewData.length} students from <strong>{file.name}</strong>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleRegeneratePasswords}
                                        className="text-xs font-bold text-indigo-400 hover:text-white flex items-center gap-1 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all"
                                    >
                                        <RefreshCw className="w-3 h-3" /> New Passwords
                                    </button>
                                    <button onClick={() => setFile(null)} className="text-xs text-slate-500 hover:text-white underline px-2">
                                        Change File
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/30 rounded-xl border border-white/5 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-white/5 text-slate-400 font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="p-4">Student Name</th>
                                                <th className="p-4 text-indigo-300">Generated Username</th>
                                                <th className="p-4 text-emerald-300">Password</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
                                            {previewData.slice(0, 100).map((row, i) => (
                                                <tr key={i} className="hover:bg-white/[0.02]">
                                                    <td className="p-4 text-white">{row.studentName}</td>
                                                    <td className="p-4 font-mono text-indigo-400 bg-indigo-500/5">{row.username}</td>
                                                    <td className="p-4 font-mono text-emerald-400 bg-emerald-500/5">{row.password}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {previewData.length === 0 && (
                                    <div className="p-8 text-center text-slate-500">
                                        No valid names found. Please ensure the file has a "Lastname, Firstname" format.
                                    </div>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 italic text-center">
                                {previewData.length > 100 ? `Showing first 100 of ${previewData.length} records.` : `All ${previewData.length} records shown.`}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {file && (
                    <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-400 hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || previewData.length === 0}
                            className="px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {isSaving ? 'Creating...' : 'Confirm & Create'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenerateAccountsModal;