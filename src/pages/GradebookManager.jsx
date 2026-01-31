// src/pages/GradebookManager.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase'; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore'; 
import { parseCumulativeGrades } from '../utils/aiGradeParser';
import { Icons } from '../utils/Icons';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, Save, Trash2, X, Upload, Edit, ArrowLeft, BookOpen, Check, Filter, ChevronDown, UserPlus, AlertCircle, FileUp, Loader2, AlertTriangle } from 'lucide-react';

// --- CONSTANTS ---
const EXCLUDED_SUBJECTS = [
    'RELIGIOUS EDUCATION', 'CHRISTIAN SOCIAL LIVING', 'REL ED', 'CSL', 
    'HOMEROOM GUIDANCE', 'CLE', 'VE', 'RHGP'
];

const GradebookManager = () => {
    // --- AUTH & STATE ---
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(true);

    const navigate = useNavigate();

    // --- DATA STATE ---
    const [yearOptions, setYearOptions] = useState([]);
    const [allSections, setAllSections] = useState([]);
    const [gradeLevelOptions, setGradeLevelOptions] = useState([]);
    const [filteredSections, setFilteredSections] = useState([]);
    const [enrolledStudents, setEnrolledStudents] = useState([]); 
    
    const [filters, setFilters] = useState({
        schoolYear: '2025-2026',
        quarter: '1st Quarter',
        gradeLevel: '', 
        section: ''     
    });

    const [records, setRecords] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [detectedHeaders, setDetectedHeaders] = useState([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
    const [manualSubjectName, setManualSubjectName] = useState('');

    // --- OPTIMIZATION: STATE TRACKING ---
    const lastSavedState = useRef({}); 

    // --- MODAL STATES ---
    const [loadingState, setLoadingState] = useState({ show: false, message: '' });
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', type: 'neutral', onConfirm: null });
    const [subjectPrompt, setSubjectPrompt] = useState({ show: false, rawData: null, meta: null });

    // --- HELPER: CALCULATE AVERAGE ---
    const calculateRowAverage = (grades) => {
        if (!grades) return 0;
        let total = 0;
        let count = 0;

        Object.entries(grades).forEach(([subject, score]) => {
            const cleanSubject = subject.toUpperCase();
            const cleanScore = parseFloat(score);
            const isExcluded = EXCLUDED_SUBJECTS.some(ex => cleanSubject.includes(ex));

            if (!isExcluded && !isNaN(cleanScore) && cleanScore > 0) {
                total += cleanScore;
                count++;
            }
        });

        return count === 0 ? 0 : Math.round(total / count);
    };

    // --- EFFECTS ---
    useEffect(() => {
        const init = async () => {
            const years = [];
            const startYear = 2025;
            for (let i = 0; i < 10; i++) years.push(`${startYear + i}-${startYear + i + 1}`);
            setYearOptions(years);

            try {
                const q = query(collection(db, "sections"));
                const snap = await getDocs(q);
                const sectionsData = snap.docs.map(d => ({ 
                    id: d.id, 
                    sectionName: d.data().name || "Unnamed Section", 
                    gradeLevel: d.data().gradeLevel || "No Grade"
                }));
                setAllSections(sectionsData);
                const uniqueGrades = [...new Set(sectionsData.map(s => s.gradeLevel))].sort((a, b) => {
                    const numA = parseInt(a.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.replace(/\D/g, '')) || 0;
                    return numA - numB;
                });
                setGradeLevelOptions(uniqueGrades);
            } catch (error) { console.error(error); }
        };
        init();
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (filters.gradeLevel) {
            const relevantSections = allSections
                .filter(s => s.gradeLevel === filters.gradeLevel)
                .sort((a, b) => (a.sectionName || "").localeCompare(b.sectionName || ""));
            setFilteredSections(relevantSections);
            if (!relevantSections.some(s => s.sectionName === filters.section)) {
                setFilters(prev => ({ ...prev, section: '' }));
            }
        } else {
            setFilteredSections([]);
            setFilters(prev => ({ ...prev, section: '' }));
        }
    }, [filters.gradeLevel, allSections]);

    useEffect(() => {
        const loadData = async () => {
            if (!user || !filters.gradeLevel || !filters.section) {
                setRecords([]); return;
            }
            setLoadingState({ show: true, message: 'Loading Class Record...' });
            try {
                const enrollQ = query(
                    collection(db, "enrollments"), 
                    where("gradeLevel", "==", filters.gradeLevel),
                    where("section", "==", filters.section)
                );
                const enrollSnap = await getDocs(enrollQ);
                setEnrolledStudents(enrollSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                await fetchGrades();
            } catch (error) { console.error(error); }
            setLoadingState({ show: false, message: '' });
        };
        loadData();
    }, [filters.gradeLevel, filters.section, filters.schoolYear, filters.quarter, user]);

    // --- HANDLERS ---
    const handleLogin = async (e) => {
        e.preventDefault();
        try { await signInWithEmailAndPassword(auth, email, password); } 
        catch (error) { alert("Login Failed: " + error.message); }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/student-portal');
    };

    const fetchGrades = async () => {
        const q = query(
            collection(db, "academic_records"), 
            where("schoolYear", "==", filters.schoolYear), 
            where("quarter", "==", filters.quarter), 
            where("gradeLevel", "==", filters.gradeLevel), 
            where("section", "==", filters.section)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        sortAndSetRecords(data);
        
        const snapshot = {};
        data.forEach(r => {
            snapshot[r.id] = JSON.stringify({
                name: r.studentName,
                gender: r.gender,
                grades: r.grades
            });
        });
        lastSavedState.current = snapshot;

        setDetectedHeaders(currentHeaders => {
            const dbSubjects = new Set();
            data.forEach(r => { if(r.grades) Object.keys(r.grades).forEach(k => dbSubjects.add(k)); });
            if (currentHeaders.length === 0) return Array.from(dbSubjects);
            const newHeaderList = [...currentHeaders];
            dbSubjects.forEach(sub => { if (!newHeaderList.includes(sub)) newHeaderList.push(sub); });
            return newHeaderList;
        });
    };

    const sortAndSetRecords = (data) => {
        data.sort((a, b) => {
            const genderA = (a.gender || 'MALE').toUpperCase();
            const genderB = (b.gender || 'MALE').toUpperCase();
            if (genderA !== genderB) return genderA === 'MALE' ? -1 : 1;
            return (a.studentName || "").localeCompare(b.studentName || "");
        });
        setRecords(data);
    };

    const handleAddRow = (index) => {
        const newRecord = {
            studentName: '',
            gender: records[index]?.gender || 'MALE',
            grades: {},
            generalAverage: 0,
            isUnlinked: true,
            status: 'New'
        };
        const updatedRecords = [...records];
        if (index === -1) updatedRecords.unshift(newRecord);
        else updatedRecords.splice(index + 1, 0, newRecord);
        setRecords(updatedRecords);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) { setSelectedFile(file); e.target.value = ''; }
    };

    const handleProcessFile = async () => {
        if (!selectedFile) return;
        setLoadingState({ show: true, message: 'Analyzing Gradesheet...' });
        
        try {
            const { meta, records: extractedRecords } = await parseCumulativeGrades(selectedFile);
            
            if (meta.gradeSection) {
                const fileInfo = meta.gradeSection.toUpperCase().replace(/[^A-Z0-9]/g, '');
                const currentGrade = filters.gradeLevel.toUpperCase().replace(/[^A-Z0-9]/g, '');
                const currentSection = filters.section.toUpperCase().replace(/[^A-Z0-9]/g, '');
                
                const matchesGrade = fileInfo.includes(currentGrade);
                const matchesSection = fileInfo.includes(currentSection);

                if (!matchesGrade || !matchesSection) {
                    setLoadingState({ show: false, message: '' });
                    setConfirmModal({
                        show: true,
                        title: 'File Mismatch Detected',
                        message: `Warning: The uploaded file appears to be for "${meta.gradeSection}", but you have selected "Grade ${filters.gradeLevel} - ${filters.section}". Please upload the correct file.`,
                        type: 'danger',
                        onConfirm: () => setConfirmModal({ ...confirmModal, show: false }) 
                    });
                    return; 
                }
            }

            let detectedSubject = null;
            if (meta && meta.subject) detectedSubject = meta.subject;
            else if (meta && meta.rawHeaders) {
                 const rawString = JSON.stringify(meta.rawHeaders).toUpperCase();
                 const subjectMatch = rawString.match(/SUBJECT:\s*([A-Z0-9\s\.-]+)/);
                 if (subjectMatch && subjectMatch[1]) detectedSubject = subjectMatch[1].trim().replace(/,+$/, ''); 
            }

            if (detectedSubject) {
                finalizeProcessing(detectedSubject, extractedRecords);
            } else {
                setLoadingState({ show: false, message: '' }); 
                setSubjectPrompt({ show: true, rawData: extractedRecords, meta });
            }
        } catch (error) { 
            setLoadingState({ show: false, message: '' });
            alert("AI Processing Failed: " + error.message); 
        }
    };

    const finalizeProcessing = (subjectName, extractedRecords) => {
        setDetectedHeaders(prev => { if (prev.includes(subjectName)) return prev; return [...prev, subjectName]; });
        const processedRecords = extractedRecords.map(rec => {
            const parsedNameClean = rec.name.toUpperCase().replace(/[^A-Z]/g, '');
            const match = enrolledStudents.find(enrolled => {
                const last = enrolled.lastName.toUpperCase().replace(/[^A-Z]/g, '');
                const first = enrolled.firstName.toUpperCase().replace(/[^A-Z]/g, '');
                return parsedNameClean.includes(last) && parsedNameClean.includes(first);
            });

            let formattedName = rec.name.toUpperCase();
            if (match) {
                const mi = match.middleName ? `${match.middleName.charAt(0)}.` : '';
                formattedName = `${match.lastName}, ${match.firstName} ${mi}`.toUpperCase().trim();
            }
            
            const currentGrades = rec.grades || {};
            let finalGradeValue = '';
            if (currentGrades['Quarterly Grade']) finalGradeValue = currentGrades['Quarterly Grade'];
            else if (currentGrades['Grade']) finalGradeValue = currentGrades['Grade'];
            else {
                const values = Object.values(currentGrades).filter(v => v !== '' && !isNaN(v));
                if (values.length > 0) finalGradeValue = values[values.length - 1];
            }

            const mappedGrades = {};
            mappedGrades[subjectName] = finalGradeValue;

            return {
                studentId: match ? match.id : null, 
                studentName: formattedName, 
                gender: rec.gender || 'MALE',
                grades: mappedGrades, 
                generalAverage: 0, 
                isUnlinked: !match
            };
        });

        let mergedRecords = [];
        if (records.length > 0) {
            mergedRecords = [...records];
            processedRecords.forEach(newRec => {
                const existingIndex = mergedRecords.findIndex(r => r.studentName === newRec.studentName);
                if (existingIndex >= 0) {
                    const existingGrades = { ...mergedRecords[existingIndex].grades };
                    existingGrades[subjectName] = newRec.grades[subjectName];
                    mergedRecords[existingIndex].grades = existingGrades;
                    mergedRecords[existingIndex].generalAverage = calculateRowAverage(existingGrades);
                } else {
                    newRec.generalAverage = calculateRowAverage(newRec.grades);
                    mergedRecords.push(newRec);
                }
            });
        } else {
            mergedRecords = processedRecords.map(r => ({ ...r, generalAverage: calculateRowAverage(r.grades) }));
        }
        sortAndSetRecords(mergedRecords);
        setIsEditing(true);
        setSelectedFile(null); 
        setLoadingState({ show: false, message: '' });
    };

    const performSave = async () => {
        setConfirmModal({ ...confirmModal, show: false });
        setLoadingState({ show: true, message: 'Saving Records...' });
        
        try {
            const batch = writeBatch(db);
            let changesCount = 0;

            records.forEach(rec => {
                const safeName = (rec.studentName || 'UNKNOWN').replace(/[^a-zA-Z0-9]/g, '');
                const sId = rec.studentId || `MANUAL_${safeName}_${Date.now()}`; 
                const docId = rec.id || `${sId}_${filters.schoolYear}_${filters.quarter.replace(/\s/g, '')}`;
                const finalAverage = calculateRowAverage(rec.grades);

                const payload = {
                    studentId: sId,
                    studentName: rec.studentName.toUpperCase(), 
                    gender: rec.gender || 'MALE',
                    gradeLevel: filters.gradeLevel,
                    section: filters.section,
                    quarter: filters.quarter,
                    schoolYear: filters.schoolYear,
                    grades: rec.grades || {}, 
                    generalAverage: finalAverage,
                    isUnlinked: rec.isUnlinked || false,
                    updatedAt: new Date()
                };

                const currentSignature = JSON.stringify({
                    name: payload.studentName,
                    gender: payload.gender,
                    grades: payload.grades
                });

                const originalSignature = rec.id ? lastSavedState.current[rec.id] : null;

                if (currentSignature !== originalSignature) {
                    batch.set(doc(db, "academic_records", docId), payload);
                    changesCount++;
                }
            });

            if (changesCount > 0) {
                await batch.commit();
                alert(`Successfully saved ${changesCount} updated records.`);
            } else {
                alert("No changes detected. Nothing to save.");
            }

            setIsEditing(false);
            fetchGrades(); 
        } catch (error) { alert("Error saving: " + error.message); }
        setLoadingState({ show: false, message: '' });
    };

    const handleSaveChanges = () => {
        setConfirmModal({
            show: true,
            title: 'Save Changes?',
            message: `You are about to save changes to ${filters.gradeLevel} - ${filters.section}. Only modified records will be written to the database.`,
            type: 'confirm',
            onConfirm: performSave
        });
    };

    const confirmDeleteAll = () => {
        setConfirmModal({
            show: true,
            title: 'Delete All Records?',
            message: 'This will permanently remove ALL student records currently displayed on this table. This action cannot be undone.',
            type: 'danger',
            onConfirm: performDeleteAll
        });
    };

    const performDeleteAll = async () => {
        setConfirmModal({ ...confirmModal, show: false });
        setLoadingState({ show: true, message: 'Deleting Records...' });
        try {
            const batch = writeBatch(db);
            let count = 0;
            records.forEach(r => { if (r.id) { batch.delete(doc(db, "academic_records", r.id)); count++; } });
            if (count > 0) await batch.commit();
            setRecords([]); 
        } catch (e) { alert("Error: " + e.message); }
        setLoadingState({ show: false, message: '' });
    };

    const confirmDeleteRecord = (index) => {
        const record = records[index];
        if (!record.id) {
            const updated = [...records];
            updated.splice(index, 1);
            setRecords(updated);
            return;
        }

        setConfirmModal({
            show: true,
            title: 'Delete Student?',
            message: `Are you sure you want to remove ${record.studentName} from this gradebook?`,
            type: 'danger',
            onConfirm: () => performDeleteRecord(index)
        });
    };

    const performDeleteRecord = async (index) => {
        setConfirmModal({ ...confirmModal, show: false });
        const record = records[index];
        if (record.id) {
            setLoadingState({ show: true, message: 'Removing Student...' });
            try { await deleteDoc(doc(db, "academic_records", record.id)); } 
            catch (e) { alert("Error deleting."); setLoadingState({ show: false, message: '' }); return; }
        }
        const updated = [...records];
        updated.splice(index, 1);
        setRecords(updated);
        setLoadingState({ show: false, message: '' });
    };

    const handleGradeChange = (index, subject, value) => {
        const updated = [...records];
        if (!updated[index].grades) updated[index].grades = {};
        updated[index].grades[subject] = value;
        updated[index].generalAverage = calculateRowAverage(updated[index].grades);
        setRecords(updated);
    };

    const handleNameChange = (index, value) => {
        const updated = [...records];
        updated[index].studentName = value;
        setRecords(updated);
    };

    // --- SUB-COMPONENTS ---
    const LoadingOverlay = () => {
        if (!loadingState.show) return null;
        return (
            <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="bg-white p-8 rounded-3xl border border-indigo-100 shadow-2xl flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">{loadingState.message}</h3>
                </div>
            </div>
        );
    };

    const ActionModal = () => {
        if (!confirmModal.show) return null;
        const isDanger = confirmModal.type === 'danger';
        return (
            <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-sm relative animate-in zoom-in-95 duration-200 border border-white/20">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${isDanger ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
                        {isDanger ? <AlertTriangle className="w-7 h-7" /> : <Check className="w-7 h-7" />}
                    </div>
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{confirmModal.message}</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setConfirmModal({...confirmModal, show: false})} className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                            {isDanger ? 'Close' : 'Cancel'}
                        </button>
                        {!isDanger || confirmModal.title !== 'File Mismatch Detected' ? (
                            <button onClick={confirmModal.onConfirm} className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all active:scale-95 ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
                                Confirm
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };

    const SubjectInputModal = () => (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-2xl w-full max-w-md relative animate-in zoom-in-95 duration-200 border border-white/20">
                <button onClick={() => setSubjectPrompt({show: false, rawData: null})} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                </button>
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <BookOpen className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Identify Subject</h3>
                    <p className="text-sm text-slate-500 mt-1">We need your help mapping this file.</p>
                </div>
                <div className="space-y-4">
                    <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Subject Name</label>
                        <input 
                            type="text" 
                            value={manualSubjectName}
                            onChange={(e) => setManualSubjectName(e.target.value)}
                            placeholder="e.g. PRACTICAL RESEARCH 2"
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all uppercase placeholder:normal-case"
                            autoFocus
                        />
                    </div>
                    <button onClick={() => {if(manualSubjectName.trim()) { setLoadingState({show:true, message:'Processing...'}); finalizeProcessing(manualSubjectName.toUpperCase(), subjectPrompt.rawData); setSubjectPrompt({show:false, rawData:null}); setManualSubjectName(''); }}} 
                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 active:scale-95">
                        <Check className="w-5 h-5" /> Confirm Subject
                    </button>
                </div>
            </div>
        </div>
    );

    const UploadSection = () => (
        <div className="w-full md:w-auto">
            {!selectedFile ? (
                <label className="cursor-pointer group block">
                    <input type="file" onChange={handleFileSelect} className="hidden" accept=".xlsx,.xls,.pdf" />
                    <div className="bg-white hover:bg-slate-50 border border-indigo-100 hover:border-indigo-300 text-indigo-600 px-4 py-3 md:px-6 md:py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm hover:shadow-md">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                            <Upload className="w-4 h-4" /> 
                        </div>
                        <span className="uppercase tracking-wide">Upload Gradesheet</span>
                    </div>
                </label>
            ) : (
                <div className="flex items-center gap-2 bg-indigo-50/50 p-2 pr-3 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-50">
                        <FileUp className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col flex-1 min-w-[120px] mr-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">File Ready</span>
                        <span className="text-xs font-bold text-indigo-900 truncate max-w-[150px]">{selectedFile.name}</span>
                    </div>
                    
                    <button onClick={handleProcessFile} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2 font-bold text-[10px] uppercase tracking-wide">
                        <Check className="w-3.5 h-3.5" /> Process File
                    </button>
                    
                    <button onClick={() => setSelectedFile(null)} className="bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 p-2.5 rounded-xl border border-slate-100 transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );

    // --- MAIN RENDER ---
    if (authLoading) return <div className="min-h-screen bg-indigo-50 flex items-center justify-center text-indigo-400 animate-pulse font-bold tracking-widest uppercase text-xs">Loading Application...</div>;

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white w-full max-w-md relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <div className="text-center mb-10 mt-4">
                        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-indigo-500/30 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                            {Icons.lock}
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">Teacher Portal</h1>
                        <p className="text-sm font-medium text-slate-500 mt-2">Secure Gradebook Access</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                             <input type="email" placeholder="Email Address" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all" required />
                        </div>
                        <div className="space-y-2">
                            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-bold placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all" required />
                        </div>
                        <button className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                            Sign In
                        </button>
                    </form>
                    <Link to="/student-portal" className="block text-center mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Return to Student Portal</Link>
                </div>
            </div>
        );
    }

    return (
        // INCREASED PADDING BOTTOM TO pb-52 to allow scrolling past the floating bar
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-600 pb-52 md:pb-10 relative overflow-x-hidden">
            <div className="fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10 pointer-events-none"></div>
            <div className="fixed -top-40 -right-40 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl -z-10 pointer-events-none"></div>

            <LoadingOverlay />
            <ActionModal />
            {subjectPrompt.show && <SubjectInputModal />}

            <header className="bg-white/80 backdrop-blur-lg border-b border-indigo-50 sticky top-0 z-40 px-4 py-3 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                {Icons.document}
                            </div>
                            <div className="hidden md:block">
                                <h1 className="text-lg font-bold text-slate-800 leading-tight">Gradebook</h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Manager v2.2</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`md:hidden p-2.5 rounded-xl transition-all border ${mobileMenuOpen ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-white border-slate-200 text-slate-600'}`}>
                            <Filter className="w-5 h-5" />
                         </button>
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="md:hidden mb-6 flex flex-col gap-4">
                     <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                             <div>
                                 <h2 className="text-sm font-bold text-slate-800">Quick Actions</h2>
                                 <p className="text-[10px] text-slate-400">Manage your files here</p>
                             </div>
                        </div>
                        <UploadSection />
                     </div>
                </div>

                <div className={`bg-white rounded-[2rem] border border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-5 md:p-8 mb-8 transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: 'School Year', val: filters.schoolYear, key: 'schoolYear', opts: yearOptions.map(y=>({val:y, txt:y})) },
                            { label: 'Quarter', val: filters.quarter, key: 'quarter', opts: ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'].map(q=>({val:q, txt:q})) },
                            { label: 'Grade Level', val: filters.gradeLevel, key: 'gradeLevel', opts: [{val:'',txt:'Select Grade'}, ...gradeLevelOptions.map(g=>({val:g, txt:g}))] },
                            { label: 'Section', val: filters.section, key: 'section', disabled: !filters.gradeLevel, opts: [{val:'',txt:filters.gradeLevel?'Select Section':'--'}, ...filteredSections.map(s=>({val:s.sectionName, txt:s.sectionName}))] }
                        ].map((field, i) => (
                            <div key={i} className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">{field.label}</label>
                                <div className="relative group">
                                    <select 
                                        value={field.val} 
                                        onChange={e => setFilters({...filters, [field.key]: e.target.value})} 
                                        disabled={field.disabled}
                                        className="w-full bg-slate-50 hover:bg-white border border-slate-200 group-hover:border-indigo-300 rounded-2xl px-5 py-3.5 text-slate-700 font-bold text-sm appearance-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                                    >
                                        {field.opts.map(o => <option key={o.val} value={o.val}>{o.txt}</option>)}
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-4 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-6 items-center justify-between">
                         <div className="hidden md:block">
                            <UploadSection />
                         </div>

                        {records.length > 0 && (
                            <div className="hidden md:flex gap-3">
                                <button onClick={() => setIsEditing(!isEditing)} className={`px-6 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 ${isEditing ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30'}`}>
                                    {isEditing ? <X className="w-4 h-4"/> : <Edit className="w-4 h-4" />} {isEditing ? 'Stop Editing' : 'Edit Records'}
                                </button>
                                {isEditing && (
                                    <button onClick={handleSaveChanges} className="px-6 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95">
                                        <Save className="w-4 h-4" /> Save Changes
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {records.length === 0 && (
                    <div className="text-center py-24 bg-white/40 backdrop-blur-sm border-2 border-dashed border-indigo-100 rounded-[2.5rem] mx-4 md:mx-0">
                        <div className="w-24 h-24 bg-white text-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-100 border border-white">
                            <BookOpen className="w-10 h-10" />
                        </div>
                        <h3 className="text-slate-600 font-bold uppercase tracking-widest text-sm">No Records Found</h3>
                        <p className="text-slate-400 text-sm mt-2 font-medium">Select a grade & section or upload a file above</p>
                    </div>
                )}

                {records.length > 0 && (
                    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-0">
                        <div className="flex flex-col md:flex-row justify-between items-center px-2">
                             <div className="flex items-center gap-3 mb-4 md:mb-0">
                                <span className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> {records.length} Students
                                </span>
                                {filters.gradeLevel && <span className="text-xs font-bold text-slate-400 hidden sm:inline">{filters.gradeLevel} - {filters.section}</span>}
                             </div>
                            <button onClick={confirmDeleteAll} className="text-[10px] font-bold text-slate-400 hover:text-red-500 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> Clear Table
                            </button>
                        </div>

                        <div className="hidden md:block bg-white rounded-[2rem] border border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden ring-1 ring-slate-100">
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-indigo-50/80 border-b border-indigo-100">
                                            <th className="p-5 pl-8 text-[11px] font-black text-indigo-900 uppercase tracking-widest sticky left-0 bg-indigo-50/90 backdrop-blur z-10 min-w-[300px]">Student Name</th>
                                            {detectedHeaders.map(sub => {
                                                 const isExcluded = EXCLUDED_SUBJECTS.some(ex => sub.includes(ex));
                                                 return (
                                                    <th key={sub} className={`p-4 text-center border-l border-indigo-100 min-w-[120px] text-[11px] font-black uppercase tracking-wider ${isExcluded ? 'text-slate-400' : 'text-indigo-800'}`}>
                                                        {sub}
                                                    </th>
                                                 )
                                            })}
                                            <th className="p-4 text-center border-l border-indigo-100 text-[11px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-100/50">Avg</th>
                                            <th className="p-4 text-center border-l border-indigo-100 w-[60px]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {records.map((rec, idx) => {
                                            const showHeader = (idx === 0) || (records[idx-1].gender !== rec.gender);
                                            const isExcluded = (sub) => EXCLUDED_SUBJECTS.some(ex => sub.includes(ex));

                                            return (
                                                <React.Fragment key={idx}>
                                                    {showHeader && (
                                                        <tr className={rec.gender === 'MALE' ? 'bg-blue-200 text-blue-900' : 'bg-pink-200 text-pink-900'}>
                                                            <td colSpan={100} className="p-3 pl-8 text-xs font-black uppercase tracking-widest border-y border-white/20">
                                                                {rec.gender}s
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr className="hover:bg-indigo-50/30 transition-colors group">
                                                        <td className="p-4 pl-8 sticky left-0 bg-white group-hover:bg-indigo-50/30 border-r border-slate-100/50 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.02)]">
                                                            {isEditing ? (
                                                                <input value={rec.studentName} onChange={e => handleNameChange(idx, e.target.value)} className="w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none transition-all shadow-sm" />
                                                            ) : (
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-2 h-2 rounded-full shadow-sm ${rec.gender === 'MALE' ? 'bg-blue-400 shadow-blue-200' : 'bg-pink-400 shadow-pink-200'}`}></div>
                                                                    <span className="text-xs font-bold text-slate-600">{rec.studentName}</span>
                                                                    {rec.isUnlinked && <AlertCircle className="w-4 h-4 text-amber-400" title="Unlinked Record"/>}
                                                                </div>
                                                            )}
                                                        </td>
                                                        {detectedHeaders.map(sub => (
                                                            <td key={sub} className={`p-2 text-center border-l border-slate-50 ${isExcluded(sub) ? 'bg-slate-50/30' : ''}`}>
                                                                {isEditing ? (
                                                                    <input type="number" value={rec.grades[sub] || ''} onChange={(e) => handleGradeChange(idx, sub, e.target.value)} 
                                                                        className={`w-16 text-center border rounded-xl py-2 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-50 transition-all mx-auto block shadow-sm ${isExcluded(sub) ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-700 focus:border-indigo-400'}`}/>
                                                                ) : (
                                                                    <span className={`text-xs font-bold ${isExcluded(sub) ? 'text-slate-300' : (rec.grades[sub] < 75 ? 'text-red-500 bg-red-50 px-2 py-1 rounded-md' : 'text-slate-600')}`}>
                                                                        {rec.grades[sub] || '-'}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        ))}
                                                        <td className="p-4 text-center font-black text-sm text-indigo-600 bg-indigo-50/20 border-l border-slate-100">
                                                            {rec.generalAverage || '-'}
                                                        </td>
                                                        <td className="p-4 text-center border-l border-slate-100">
                                                            <button onClick={() => confirmDeleteRecord(idx)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            )
                                        })}
                                        {isEditing && (
                                            <tr>
                                                <td colSpan={100} className="p-4">
                                                    <button onClick={() => handleAddRow(records.length - 1)} className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-2xl flex items-center justify-center gap-2 text-indigo-400 font-bold text-xs uppercase hover:bg-indigo-50 hover:border-indigo-300 transition-all">
                                                        <PlusCircle className="w-4 h-4" /> Add Student Row
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="md:hidden space-y-4">
                            {records.map((rec, idx) => (
                                <div key={idx} className="bg-white/80 backdrop-blur rounded-[2rem] p-5 border border-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${rec.gender === 'MALE' ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
                                    
                                    <div className="flex justify-between items-start mb-5 pl-4">
                                        <div className="flex-1 mr-4">
                                            {isEditing ? (
                                                <input value={rec.studentName} onChange={e => handleNameChange(idx, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500" placeholder="Student Name" />
                                            ) : (
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{rec.studentName}</h4>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${rec.gender === 'MALE' ? 'bg-blue-50 text-blue-400' : 'bg-pink-50 text-pink-400'}`}>{rec.gender}</span>
                                                        {rec.isUnlinked && <span className="text-[9px] font-bold bg-amber-50 text-amber-500 px-2 py-1 rounded-md">Unlinked</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm">
                                            <span className="text-xl font-black text-indigo-600">{rec.generalAverage}</span>
                                            <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest">AVG</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 pl-4">
                                        {detectedHeaders.map(sub => {
                                             const isExcluded = EXCLUDED_SUBJECTS.some(ex => sub.includes(ex));
                                             return (
                                                <div key={sub} className={`p-3 rounded-2xl border transition-all ${isExcluded ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-sm'}`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[80%]">{sub}</span>
                                                        {isExcluded && <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>}
                                                    </div>
                                                    {isEditing ? (
                                                        <input type="number" value={rec.grades[sub] || ''} onChange={(e) => handleGradeChange(idx, sub, e.target.value)} 
                                                            className={`w-full text-center border rounded-xl py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 transition-all ${isExcluded ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 focus:bg-white text-slate-800 focus:border-indigo-500'}`} placeholder="-"/>
                                                    ) : (
                                                        <div className={`text-center font-bold text-lg ${rec.grades[sub] < 75 ? 'text-red-500' : 'text-slate-700'} ${isExcluded ? 'opacity-50' : ''}`}>
                                                            {rec.grades[sub] || '-'}
                                                        </div>
                                                    )}
                                                </div>
                                             )
                                        })}
                                    </div>

                                    <div className="flex justify-end mt-5 pt-4 border-t border-slate-50 pl-4">
                                        <button onClick={() => confirmDeleteRecord(idx)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5">
                                            <Trash2 className="w-3.5 h-3.5" /> Remove Student
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* UPDATED MOBILE ACTION BAR - FLOATING PANEL */}
            <div className={`fixed bottom-20 left-4 right-4 bg-white/90 backdrop-blur-xl border border-indigo-50/50 p-3 rounded-[2rem] shadow-2xl md:hidden transition-all duration-300 z-40 ${isEditing || records.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
                {isEditing ? (
                    <div className="flex gap-4">
                        <button onClick={() => handleAddRow(-1)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <UserPlus className="w-4 h-4" /> Add Student
                        </button>
                        <button onClick={handleSaveChanges} className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-95 transition-all">
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-4">
                         <button onClick={() => setMobileMenuOpen(true)} className="flex-1 bg-white border border-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                            <Filter className="w-4 h-4" /> Filters
                        </button>
                        <button onClick={() => setIsEditing(true)} className="flex-[2] bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">
                            <Edit className="w-4 h-4" /> Edit Gradebook
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GradebookManager;