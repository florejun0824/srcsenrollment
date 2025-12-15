// src/pages/GradebookManager.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore'; 
import { parseCumulativeGrades } from '../utils/aiGradeParser';
import { Icons } from '../utils/Icons';
import { useNavigate, Link } from 'react-router-dom';

const GradebookManager = () => {
    // --- AUTH STATE ---
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(true);

    const navigate = useNavigate();

    // --- DATA OPTIONS STATE ---
    const [yearOptions, setYearOptions] = useState([]);
    const [allSections, setAllSections] = useState([]);
    const [gradeLevelOptions, setGradeLevelOptions] = useState([]);
    const [filteredSections, setFilteredSections] = useState([]);
    
    // --- VALIDATION DATA ---
    const [enrolledStudents, setEnrolledStudents] = useState([]); // The Official Class List

    // --- GRADEBOOK STATE ---
    const [filters, setFilters] = useState({
        schoolYear: '2025-2026',
        quarter: '1st Quarter',
        gradeLevel: '', 
        section: ''     
    });
    
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // --- DYNAMIC HEADERS STATE ---
    const [detectedHeaders, setDetectedHeaders] = useState([]);

    // --- 1. INITIALIZATION (Load Options) ---
    useEffect(() => {
        const init = async () => {
            // Generate School Years
            const years = [];
            const startYear = 2025;
            for (let i = 0; i < 10; i++) {
                years.push(`${startYear + i}-${startYear + i + 1}`);
            }
            setYearOptions(years);

            // Fetch Sections from Firestore
            try {
                const q = query(collection(db, "sections"));
                const snap = await getDocs(q);
                
                const sectionsData = snap.docs.map(d => ({ 
                    id: d.id, 
                    sectionName: d.data().name || "Unnamed Section", 
                    gradeLevel: d.data().gradeLevel || "No Grade"
                }));
                
                setAllSections(sectionsData);

                // Sort Grade Levels numerically
                const uniqueGrades = [...new Set(sectionsData.map(s => s.gradeLevel))].sort((a, b) => {
                    const numA = parseInt(a.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.replace(/\D/g, '')) || 0;
                    return numA - numB;
                });
                
                setGradeLevelOptions(uniqueGrades);

                // Set Default Filters
                if (uniqueGrades.length > 0) {
                    const defaultGrade = uniqueGrades[0];
                    const defaultSec = sectionsData.find(s => s.gradeLevel === defaultGrade)?.sectionName || '';
                    setFilters(prev => ({ ...prev, gradeLevel: defaultGrade, section: defaultSec }));
                }

            } catch (error) {
                console.error("Error loading sections:", error);
            }
        };
        init();
    }, []);

    // --- 2. AUTH CHECK ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- 3. FILTER LOGIC (Update Sections when Grade Changes) ---
    useEffect(() => {
        if (filters.gradeLevel) {
            const relevantSections = allSections
                .filter(s => s.gradeLevel === filters.gradeLevel)
                .sort((a, b) => (a.sectionName || "").localeCompare(b.sectionName || ""));
            
            setFilteredSections(relevantSections);

            const currentSectionValid = relevantSections.some(s => s.sectionName === filters.section);
            if (!currentSectionValid) {
                setFilters(prev => ({ ...prev, section: relevantSections[0]?.sectionName || '' }));
            }
        }
    }, [filters.gradeLevel, allSections]);

    // --- 4. LOAD CLASS LIST & GRADES (When Filters Change) ---
    useEffect(() => {
        const loadData = async () => {
            if (!user || !filters.gradeLevel) return;
            
            setLoading(true);
            try {
                // A. Load Official Class List (for Validation)
                // Note: We match primarily by Grade Level to catch section transfers/typos
                const enrollQ = query(collection(db, "enrollments"), where("gradeLevel", "==", filters.gradeLevel));
                const enrollSnap = await getDocs(enrollQ);
                const students = enrollSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setEnrolledStudents(students);

                // B. Load Existing Grades if Section is selected
                if (filters.section) {
                    await fetchGrades();
                }
            } catch (error) {
                console.error("Error loading data:", error);
            }
            setLoading(false);
        };
        
        loadData();
    }, [filters.gradeLevel, filters.section, filters.schoolYear, filters.quarter, user]);


    // --- HANDLERS ---

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert("Login Failed: " + error.message);
        }
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

        // Extract headers from loaded data
        const subjects = new Set();
        data.forEach(r => {
            if(r.grades) Object.keys(r.grades).forEach(k => subjects.add(k));
        });
        if(subjects.size > 0) setDetectedHeaders(Array.from(subjects));
    };

    const sortAndSetRecords = (data) => {
        // Sort: Boys first, then Girls, then Alphabetical
        data.sort((a, b) => {
            const genderA = (a.gender || 'MALE').toUpperCase();
            const genderB = (b.gender || 'MALE').toUpperCase();
            
            if (genderA !== genderB) return genderA === 'MALE' ? -1 : 1;
            return (a.studentName || "").localeCompare(b.studentName || "");
        });
        setRecords(data);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploading(true);
        
        try {
            // 1. Process File
            const { meta, records: extractedRecords } = await parseCumulativeGrades(file);
            
            // 2. Set Headers
            if (meta.headers && meta.headers.length > 0) {
                setDetectedHeaders(meta.headers);
            } else {
                const subjects = new Set();
                extractedRecords.forEach(r => Object.keys(r.grades).forEach(k => subjects.add(k)));
                setDetectedHeaders(Array.from(subjects));
            }

            // 3. STRICT MATCHING LOGIC
            const matchedRecords = [];
            let missingCount = 0;

            extractedRecords.forEach(aiRecord => {
                // Clean AI Name
                const aiNameClean = aiRecord.name.replace(/[^A-Z]/g, '');
                
                // Find in Enrolled List (Fuzzy Match Last Name)
                const match = enrolledStudents.find(enrolled => {
                    const enrolledNameClean = `${enrolled.lastName}${enrolled.firstName}`.toUpperCase().replace(/[^A-Z]/g, '');
                    const enrolledLastName = enrolled.lastName.toUpperCase().replace(/[^A-Z]/g, '');
                    return aiNameClean.includes(enrolledLastName);
                });

                if (match) {
                    matchedRecords.push({
                        studentId: match.id,
                        studentName: `${match.lastName}, ${match.firstName}`, // Force Official Name
                        gender: aiRecord.gender || 'MALE',
                        grades: aiRecord.grades,
                        generalAverage: aiRecord.generalAverage,
                        status: 'Unsaved'
                    });
                } else {
                    missingCount++;
                }
            });

            if (matchedRecords.length === 0) {
                alert("No students matched the enrollment list! Please check if the file matches the selected Grade Level.");
            } else if (missingCount > 0) {
                alert(`Processed file. ${matchedRecords.length} matched, ${missingCount} ignored (not in class list).`);
            }

            sortAndSetRecords(matchedRecords);
            setIsEditing(true);

        } catch (error) {
            alert("AI Processing Failed: " + error.message);
        }
        
        setUploading(false);
        e.target.value = ''; // Reset input
    };

    const handleSaveChanges = async () => {
        if (!confirm(`You are about to save ${records.length} records to the database.\n\nTarget: ${filters.gradeLevel} - ${filters.section}\nQuarter: ${filters.quarter}\n\nProceed?`)) return;

        setLoading(true);
        try {
            const batch = writeBatch(db);
            let matchedCount = 0;

            records.forEach(rec => {
                if (rec.studentId) {
                    matchedCount++;
                    // Create Unique ID: STUDENT_ID + SY + QUARTER
                    const docId = `${rec.studentId}_${filters.schoolYear}_${filters.quarter.replace(/\s/g, '')}`;
                    const docRef = doc(db, "academic_records", docId);
                    
                    batch.set(docRef, {
                        studentId: rec.studentId,
                        studentName: rec.studentName,
                        gender: rec.gender || 'MALE',
                        gradeLevel: filters.gradeLevel,
                        section: filters.section,
                        quarter: filters.quarter,
                        schoolYear: filters.schoolYear,
                        grades: rec.grades,
                        generalAverage: rec.generalAverage,
                        updatedAt: new Date()
                    });
                }
            });

            await batch.commit();
            alert(`Successfully Saved ${matchedCount} Student Records!`);
            setIsEditing(false);
            fetchGrades(); 
        } catch (error) {
            console.error(error);
            alert("Error saving records: " + error.message);
        }
        setLoading(false);
    };

    const handleDeleteAll = async () => {
        if (records.length === 0) return;
        if (!confirm(`⚠️ WARNING: You are about to delete ALL ${records.length} displayed records.\n\nThis cannot be undone. Are you sure?`)) return;
        
        setLoading(true);
        try {
            const batch = writeBatch(db);
            let dbDeleteCount = 0;
            
            records.forEach(r => {
                if (r.id) { // Only delete if it exists in DB
                    batch.delete(doc(db, "academic_records", r.id));
                    dbDeleteCount++;
                }
            });

            if (dbDeleteCount > 0) await batch.commit();
            
            setRecords([]); // Clear UI
            alert("All records deleted.");
        } catch (e) { 
            alert("Delete failed: " + e.message); 
        }
        setLoading(false);
    };

    const handleDeleteRecord = async (index) => {
        const record = records[index];
        if (!confirm(`Delete ${record.studentName}?`)) return;

        setLoading(true);
        try {
            if (record.id) {
                await deleteDoc(doc(db, "academic_records", record.id));
            }
            
            const updated = [...records];
            updated.splice(index, 1);
            setRecords(updated);
            
        } catch (error) {
            alert("Failed to delete record.");
        }
        setLoading(false);
    };

    const handleGradeChange = (index, subject, value) => {
        const updated = [...records];
        updated[index].grades[subject] = value;
        setRecords(updated);
    };

    // --- COMPONENT: PROCESSING OVERLAY ---
    const ProcessingOverlay = () => (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
            <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center max-w-sm w-full relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full -ml-10 -mb-10 pointer-events-none"></div>
                
                {/* Animated Spinner */}
                <div className="relative mb-8">
                    <div className="w-20 h-20 border-4 border-slate-800 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-blue-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">
                        ✨
                    </div>
                </div>

                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Analyzing Gradesheet</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-6 leading-relaxed">
                    Reading PDF Text, Extracting Subjects, and Matching Names...
                </p>

                {/* Indeterminate Progress Bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-[shimmer_1s_infinite_linear]"></div>
                </div>
            </div>
            
            <p className="mt-8 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                Please do not close this window
            </p>
        </div>
    );

    // --- RENDER: LOGIN ---
    if (authLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Loading...</div>;

    if (!user) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative">
                <div className="absolute inset-0 bg-[url('/2.png')] bg-cover opacity-20 pointer-events-none"></div>
                <div className="bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/10 relative z-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                            {Icons.lock}
                        </div>
                        <h1 className="text-2xl font-black text-white uppercase">Teacher Access</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Gradebook Management</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-3 text-white font-bold outline-none focus:border-blue-500" required />
                        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-3 text-white font-bold outline-none focus:border-blue-500" required />
                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all">Login</button>
                    </form>
                    <Link to="/student-portal" className="block text-center mt-6 text-[10px] font-bold text-slate-500 uppercase hover:text-white">Cancel & Return</Link>
                </div>
            </div>
        );
    }

    // --- RENDER: DASHBOARD ---
    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans relative">
            
            {/* RENDER OVERLAY IF UPLOADING */}
            {uploading && <ProcessingOverlay />}

            <div className="bg-slate-900/50 border-b border-white/5 px-8 py-4 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        {Icons.document}
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white uppercase tracking-tight">Gradebook Manager</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logged in as {user.email}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white uppercase tracking-widest transition-all border border-white/10">
                    Log Out
                </button>
            </div>

            <div className="p-8 pb-32 max-w-[95%] mx-auto">
                {/* FILTERS BAR */}
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 mb-8 flex flex-wrap gap-4 items-end">
                    
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">School Year</label>
                        <select 
                            value={filters.schoolYear}
                            onChange={e => setFilters({...filters, schoolYear: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-blue-500 appearance-none cursor-pointer"
                        >
                            {yearOptions.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Quarter</label>
                        <select 
                            value={filters.quarter}
                            onChange={e => setFilters({...filters, quarter: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-blue-500 appearance-none cursor-pointer"
                        >
                            <option value="1st Quarter">1st Quarter</option>
                            <option value="2nd Quarter">2nd Quarter</option>
                            <option value="3rd Quarter">3rd Quarter</option>
                            <option value="4th Quarter">4th Quarter</option>
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Grade Level</label>
                        <select 
                            value={filters.gradeLevel}
                            onChange={e => setFilters({...filters, gradeLevel: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-blue-500 appearance-none cursor-pointer"
                        >
                            {gradeLevelOptions.map(gl => <option key={gl} value={gl}>{gl}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Section</label>
                        <select 
                            value={filters.section}
                            onChange={e => setFilters({...filters, section: e.target.value})}
                            disabled={!filters.gradeLevel}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-blue-500 appearance-none cursor-pointer disabled:opacity-50"
                        >
                            {filteredSections.map(s => <option key={s.id} value={s.sectionName}>{s.sectionName}</option>)}
                            {filteredSections.length === 0 && <option value="">No sections found</option>}
                        </select>
                    </div>

                    <div className="relative">
                        <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,application/pdf" disabled={uploading} />
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20">
                            {Icons.upload} Upload Gradesheet
                        </button>
                    </div>
                </div>

                {/* GRADE GRID */}
                <div className="bg-slate-900/80 backdrop-blur rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-white uppercase tracking-widest">
                                {records.length} Student Records
                            </h3>
                            {records.length > 0 && (
                                <button 
                                    onClick={handleDeleteAll}
                                    className="bg-red-900/20 hover:bg-red-900/40 text-red-400 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-red-500/20 transition-all flex items-center gap-2"
                                >
                                    {Icons.trash} Delete All
                                </button>
                            )}
                        </div>
                        {records.length > 0 && (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditing(!isEditing)} className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2 rounded-lg border border-white/10">
                                    {isEditing ? 'Cancel Edit' : 'Edit Records'}
                                </button>
                                {isEditing && (
                                    <button onClick={handleSaveChanges} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-lg shadow-lg">
                                        Save Changes
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="overflow-x-auto custom-scrollbar">
                         <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <th className="p-4 sticky left-0 bg-[#0f172a] z-10 border-r border-white/10">Student Name</th>
                                    
                                    {detectedHeaders.map(sub => (
                                        <th key={sub} className="p-4 text-center border-l border-white/5">{sub}</th>
                                    ))}
                                    
                                    <th className="p-4 text-center border-l border-white/5 text-emerald-500">Avg</th>
                                    <th className="p-4 text-center border-l border-white/5 text-red-500">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs font-bold text-slate-300">
                                {records.map((rec, rowIndex) => {
                                    // --- ROW SEPARATOR LOGIC ---
                                    const showBoysHeader = (rec.gender === 'MALE' && rowIndex === 0) || (rec.gender === 'MALE' && records[rowIndex-1]?.gender !== 'MALE');
                                    const showGirlsHeader = (rec.gender === 'FEMALE' && rowIndex === 0) || (rec.gender === 'FEMALE' && records[rowIndex-1]?.gender !== 'FEMALE');
                                    const colSpan = 3 + detectedHeaders.length;

                                    return (
                                        <React.Fragment key={rowIndex}>
                                            {/* SEPARATOR ROWS */}
                                            {showBoysHeader && (
                                                <tr className="bg-blue-900/30 border-y border-white/10">
                                                    <td colSpan={colSpan} className="p-3 pl-4 text-xs font-black text-blue-200 uppercase tracking-[0.2em] sticky left-0">
                                                        BOYS
                                                    </td>
                                                </tr>
                                            )}
                                            {showGirlsHeader && (
                                                <tr className="bg-pink-900/30 border-y border-white/10 mt-4">
                                                    <td colSpan={colSpan} className="p-3 pl-4 text-xs font-black text-pink-200 uppercase tracking-[0.2em] sticky left-0">
                                                        GIRLS
                                                    </td>
                                                </tr>
                                            )}

                                            {/* DATA ROW */}
                                            <tr className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 sticky left-0 bg-[#0f172a] group-hover:bg-[#1e293b] border-r border-white/10 text-white uppercase">
                                                    {rec.studentName}
                                                </td>
                                                
                                                {detectedHeaders.map(sub => (
                                                    <td key={sub} className="p-2 text-center border-l border-white/5">
                                                        {isEditing ? (
                                                            <input 
                                                                type="number" 
                                                                value={rec.grades[sub] || ''} 
                                                                onChange={(e) => handleGradeChange(rowIndex, sub, e.target.value)}
                                                                className="w-12 bg-black/30 border border-white/10 rounded text-center text-white focus:border-blue-500 outline-none"
                                                            />
                                                        ) : (
                                                            <span className={rec.grades[sub] < 75 ? 'text-red-400' : 'text-slate-300'}>
                                                                {rec.grades[sub] || '-'}
                                                            </span>
                                                        )}
                                                    </td>
                                                ))}
                                                
                                                <td className="p-4 text-center font-black text-emerald-400 border-l border-white/5">
                                                    {rec.generalAverage}
                                                </td>
                                                <td className="p-4 text-center border-l border-white/5">
                                                    <button 
                                                        onClick={() => handleDeleteRecord(rowIndex)}
                                                        className="text-slate-600 hover:text-red-500 transition-colors"
                                                        title="Delete Record"
                                                    >
                                                        {Icons.trash || <span>🗑️</span>}
                                                    </button>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan={15} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                                            No records found for this selection.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GradebookManager;