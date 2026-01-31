// src/components/admin/GenerateAccountsModal.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, writeBatch, doc, getDocs, query } from 'firebase/firestore';
import * as XLSX from 'xlsx'; 
import { FileUp, X, Check, Loader2, RefreshCw, AlertCircle, Users, Layers, GraduationCap, ChevronDown } from 'lucide-react';

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
    'SUBJECT', 'TRACK', 'STRAND', 'HIGHEST POSSIBLE SCORE', 'INITIAL GRADE',
    "LEARNER'S NAME", "LEARNERS NAME", "NAME OF LEARNER" // Added specific exclusions
];

// --- HELPER: STRICT NAME VALIDATOR ---
const isValidStudentName = (nameStr) => {
    if (!nameStr || nameStr.length < 2) return false;
    const upper = nameStr.toUpperCase().trim();
    
    // 1. Check against Stop/Skip Terms
    if (STOP_TERMS.some(t => upper.includes(t))) return false;
    if (EXCLUDED_TERMS.some(t => upper === t || upper.includes(t))) return false; 
    
    // 2. Formatting Checks
    if (upper.includes(':')) return false; 
    if (!/[a-zA-Z]/.test(upper)) return false; // Must contain at least one letter

    return true;
};

// --- HELPER: GENERATE CUSTOM USERNAME ---
const generateCredentials = (fullName) => {
    // 1. Clean Name (Remove leading numbers/dots)
    const clean = fullName.replace(/^[\d.\s]+/, '').toUpperCase().trim();
    
    // 2. Split Name
    const parts = clean.split(',');
    let surname = '';
    let rest = '';

    if (parts.length > 1) {
        surname = parts[0].trim();
        rest = parts[1].trim();
    } else {
        const spaceParts = clean.split(' ');
        surname = spaceParts[0];
        rest = spaceParts.slice(1).join(' ');
    }

    // 3. Build Username
    const prefix = 'srcs';
    const surnameClean = surname.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const firstInitial = rest.charAt(0).toLowerCase();
    
    // Attempt Middle Initial
    const restParts = rest.split(/\s+/);
    let middleInitial = '';
    if (restParts.length > 1) {
        const lastPart = restParts[restParts.length - 1].replace('.', '');
        if (lastPart.length === 1) middleInitial = lastPart.toLowerCase();
    }

    const username = `${prefix}${surnameClean}${firstInitial}${middleInitial}`;

    // 4. Random Password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 8; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));

    return { username, password, cleanName: clean };
};

const GenerateAccountsModal = ({ onClose, onSuccess }) => {
    // --- STATE ---
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Section & Grade State
    const [allSections, setAllSections] = useState([]);
    const [gradeLevelOptions, setGradeLevelOptions] = useState([]);
    const [filteredSections, setFilteredSections] = useState([]);
    
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    // --- FETCH SECTIONS (Mimicking GradebookManager) ---
    useEffect(() => {
        const fetchSections = async () => {
            try {
                const q = query(collection(db, "sections"));
                const snap = await getDocs(q);
                const sectionsData = snap.docs.map(d => ({ 
                    id: d.id, 
                    sectionName: d.data().name || "Unnamed Section", 
                    gradeLevel: d.data().gradeLevel || "No Grade"
                }));
                setAllSections(sectionsData);
                
                // Extract and Sort Unique Grades
                const uniqueGrades = [...new Set(sectionsData.map(s => s.gradeLevel))].sort((a, b) => {
                    const numA = parseInt(a.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.replace(/\D/g, '')) || 0;
                    return numA - numB;
                });
                setGradeLevelOptions(uniqueGrades);
            } catch (error) {
                console.error("Error fetching sections:", error);
            }
        };
        fetchSections();
    }, []);

    // --- FILTER SECTIONS WHEN GRADE CHANGES ---
    useEffect(() => {
        if (selectedGrade) {
            const relevantSections = allSections
                .filter(s => s.gradeLevel === selectedGrade)
                .sort((a, b) => (a.sectionName || "").localeCompare(b.sectionName || ""));
            setFilteredSections(relevantSections);
            
            // Reset section if it doesn't belong to the new grade
            if (!relevantSections.some(s => s.sectionName === selectedSection)) {
                setSelectedSection('');
            }
        } else {
            setFilteredSections([]);
            setSelectedSection('');
        }
    }, [selectedGrade, allSections]);

    // --- SMART PARSER LOGIC ---
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
            
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }); 
            const generated = [];

            let headerRowIndex = -1;
            let nameColIndex = -1;

            for (let i = 0; i < Math.min(data.length, 25); i++) {
                const row = data[i];
                if (!row) continue;
                const rowStr = row.map(c => String(c || '').toUpperCase()).join(' ');
                
                if (rowStr.includes('NAME') || rowStr.includes('LEARNER') || rowStr.includes('STUDENT')) {
                    headerRowIndex = i;
                    row.forEach((cell, idx) => {
                        const val = String(cell || '').toUpperCase();
                        if (val.includes('NAME') || val.includes('LEARNER') || val.includes('STUDENT')) {
                            nameColIndex = idx;
                        }
                    });
                    break;
                }
            }

            const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 10;
            const targetCol = nameColIndex !== -1 ? nameColIndex : 1; 

            for (let i = startRow; i < data.length; i++) {
                const row = data[i];
                if (!row) continue;

                let rawName = row[targetCol];
                if (!rawName && targetCol === 1) rawName = row[0]; 

                if (typeof rawName !== 'string') continue;

                let cleanName = rawName.replace(/^\d+[\.\)\s]*\s*/, '').trim();

                if (isValidStudentName(cleanName)) {
                    const creds = generateCredentials(cleanName);
                    generated.push({
                        studentName: creds.cleanName,
                        username: creds.username,
                        password: creds.password
                    });
                }
            }

            setPreviewData(generated);
            setIsProcessing(false);
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleRegeneratePasswords = () => {
        setIsProcessing(true);
        const updated = previewData.map(item => {
            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
            let newPass = "";
            for (let i = 0; i < 8; i++) newPass += chars.charAt(Math.floor(Math.random() * chars.length));
            return { ...item, password: newPass };
        });
        setPreviewData(updated);
        setIsProcessing(false);
    };

    const handleSave = async () => {
        if (previewData.length === 0) return;
        
        // --- Validation ---
        if (!selectedGrade || !selectedSection) {
            alert("Please select a Grade Level and Section before creating accounts.");
            return;
        }

        setIsSaving(true);

        try {
            const batch = writeBatch(db);
            const collectionRef = collection(db, "student_accounts");

            previewData.forEach(item => {
                const newDocRef = doc(collectionRef); 
                batch.set(newDocRef, {
                    ...item,
                    createdAt: new Date(),
                    // Save the selected Grade and Section
                    gradeLevel: selectedGrade,
                    section: selectedSection
                });
            });

            await batch.commit();
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Error saving accounts: " + error.message);
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in font-sans">
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative">
                
                {/* Aurora Effect inside Modal */}
                <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[400px] h-[400px] bg-emerald-200/40 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <div className="relative z-10 p-6 border-b border-slate-200/60 flex justify-between items-center bg-white/40">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <FileUp className="w-5 h-5" />
                            </span>
                            Import Accounts
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1 ml-1">
                            Generate from Excel Class List
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="relative z-10 p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-6">
                    
                    {/* --- 1. CONFIGURATION SECTION (Always Visible) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/50 p-5 rounded-2xl border border-white shadow-sm">
                         {/* Grade Selector */}
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" /> Grade Level
                            </label>
                            <div className="relative group">
                                <select 
                                    value={selectedGrade} 
                                    onChange={(e) => setSelectedGrade(e.target.value)} 
                                    className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-bold text-xs appearance-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="">-- Select Grade --</option>
                                    {gradeLevelOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                            </div>
                        </div>

                        {/* Section Selector */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                                <Layers className="w-3 h-3" /> Section
                            </label>
                            <div className="relative group">
                                <select 
                                    value={selectedSection} 
                                    onChange={(e) => setSelectedSection(e.target.value)} 
                                    disabled={!selectedGrade}
                                    className="w-full bg-slate-50 hover:bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-bold text-xs appearance-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                                >
                                    <option value="">-- Select Section --</option>
                                    {filteredSections.map(s => <option key={s.id} value={s.sectionName}>{s.sectionName}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {!file ? (
                        // UPLOAD STATE
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="border-2 border-dashed border-slate-300 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center hover:bg-indigo-50/30 hover:border-indigo-300 transition-all group cursor-pointer bg-white/50">
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm">
                                    <FileUp className="w-10 h-10 text-indigo-500" />
                                </div>
                                <h3 className="text-slate-800 font-bold text-xl mb-2">Upload Class List</h3>
                                <p className="text-slate-500 text-sm max-w-sm mb-8 leading-relaxed font-medium">
                                    Drag & drop your Excel file here. The system will detect names and filter out headers like "LEARNER'S NAME".
                                </p>
                                <label className="relative overflow-hidden group/btn bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2">
                                    <span className="relative z-10 flex items-center gap-2">Choose Excel File</span>
                                    <input type="file" onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                                </label>
                            </div>
                        </div>
                    ) : (
                        // PREVIEW STATE
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/60 p-5 rounded-2xl border border-slate-100">
                                <div>
                                    <h3 className="text-slate-800 font-bold text-lg flex items-center gap-2">
                                        <Users className="w-5 h-5 text-indigo-500" />
                                        Preview Generated Data
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        Found <strong className="text-indigo-600">{previewData.length}</strong> students in <strong>{file.name}</strong>
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button 
                                        onClick={handleRegeneratePasswords}
                                        className="flex-1 md:flex-none text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-2 bg-indigo-50 px-4 py-2.5 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-all"
                                    >
                                        <RefreshCw className="w-3 h-3" /> New Passwords
                                    </button>
                                    <button onClick={() => setFile(null)} className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-2.5 underline">
                                        Change File
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white/80 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto max-h-[300px] custom-scrollbar">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10">
                                            <tr>
                                                <th className="p-4 border-b border-slate-200">#</th>
                                                <th className="p-4 border-b border-slate-200">Student Name</th>
                                                <th className="p-4 border-b border-slate-200 text-indigo-600">Username</th>
                                                <th className="p-4 border-b border-slate-200 text-emerald-600">Password</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold">
                                            {previewData.slice(0, 100).map((row, i) => (
                                                <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                                    <td className="p-4 text-slate-400 font-mono text-[10px]">{i + 1}</td>
                                                    <td className="p-4 text-slate-800">{row.studentName}</td>
                                                    <td className="p-4">
                                                        <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                                            {row.username}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                            {row.password}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {previewData.length === 0 && (
                                    <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                        <p>No valid student names found.</p>
                                        <p className="text-[10px] mt-1">Ensure names are formatted as "Lastname, Firstname"</p>
                                    </div>
                                )}
                            </div>
                            {previewData.length > 100 && (
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                                    Showing first 100 records only
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {file && (
                    <div className="p-6 border-t border-slate-200/60 bg-white/60 backdrop-blur-md flex justify-end gap-3 rounded-b-[2rem]">
                        <button 
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={isSaving || previewData.length === 0}
                            className="px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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