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
    const [enrolledStudents, setEnrolledStudents] = useState([]); 

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
    
    // --- UPLOAD STATE ---
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    
    // --- DYNAMIC HEADERS STATE ---
    const [detectedHeaders, setDetectedHeaders] = useState([]);

    // --- 1. INITIALIZATION ---
    useEffect(() => {
        const init = async () => {
            const years = [];
            const startYear = 2025;
            for (let i = 0; i < 10; i++) {
                years.push(`${startYear + i}-${startYear + i + 1}`);
            }
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

    // --- 3. FILTER LOGIC ---
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

    // --- 4. LOAD CLASS LIST & GRADES ---
    useEffect(() => {
        const loadData = async () => {
            if (!user || !filters.gradeLevel) return;
            
            setLoading(true);
            try {
                const enrollQ = query(collection(db, "enrollments"), where("gradeLevel", "==", filters.gradeLevel));
                const enrollSnap = await getDocs(enrollQ);
                const students = enrollSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                setEnrolledStudents(students);

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

        // --- INTELLIGENT HEADER MERGE (FIX FOR RESHUFFLING) ---
        setDetectedHeaders(currentHeaders => {
            const dbSubjects = new Set();
            data.forEach(r => {
                if(r.grades) Object.keys(r.grades).forEach(k => dbSubjects.add(k));
            });

            // If we have no current headers (first load), use what the DB gave us
            if (currentHeaders.length === 0) {
                return Array.from(dbSubjects);
            }

            // If we DO have headers (from a file upload or previous view), preserve their order!
            // Only append truly new subjects found in DB that aren't already on screen.
            const newHeaderList = [...currentHeaders];
            dbSubjects.forEach(sub => {
                if (!newHeaderList.includes(sub)) {
                    newHeaderList.push(sub);
                }
            });
            
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

    // --- FILE PROCESSING (DELAYED) ---
    
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            e.target.value = ''; // Reset input so same file can be selected again if needed
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    const handleProcessFile = async () => {
        if (!selectedFile) return;
        setUploading(true);
        
        try {
            const { meta, records: extractedRecords } = await parseCumulativeGrades(selectedFile);
            
            // USE FILE HEADERS (This establishes the "Correct" order)
            if (meta.headers && meta.headers.length > 0) {
                setDetectedHeaders(meta.headers);
            } else {
                const subjects = new Set();
                extractedRecords.forEach(r => Object.keys(r.grades).forEach(k => subjects.add(k)));
                setDetectedHeaders(Array.from(subjects));
            }

            const processedRecords = extractedRecords.map(rec => {
                // Name Cleaning & Matching
                const parsedNameClean = rec.name.toUpperCase().replace(/[^A-Z]/g, '');
                
                const match = enrolledStudents.find(enrolled => {
                    const last = enrolled.lastName.toUpperCase().replace(/[^A-Z]/g, '');
                    const first = enrolled.firstName.toUpperCase().replace(/[^A-Z]/g, '');
                    return parsedNameClean.includes(last) && parsedNameClean.includes(first);
                });

                // Name Formatting (Standardize to DB format if matched)
                let formattedName = rec.name.toUpperCase();
                if (match) {
                    const mi = match.middleName ? `${match.middleName.charAt(0)}.` : '';
                    formattedName = `${match.lastName}, ${match.firstName} ${mi}`.toUpperCase().trim();
                }

                return {
                    studentId: match ? match.id : null, 
                    studentName: formattedName, 
                    gender: rec.gender || 'MALE',
                    grades: rec.grades,
                    generalAverage: (rec.average !== undefined && rec.average !== null) ? rec.average : 0,
                    isUnlinked: !match, 
                    status: 'Unsaved'
                };
            });

            sortAndSetRecords(processedRecords);
            setIsEditing(true);
            setSelectedFile(null); // Clear pending file

        } catch (error) {
            alert("AI Processing Failed: " + error.message);
        }
        
        setUploading(false);
    };

    const handleSaveChanges = async () => {
        if (!confirm(`You are about to save ${records.length} records.\n\nTarget: ${filters.gradeLevel} - ${filters.section}\n\nProceed?`)) return;

        setLoading(true);
        try {
            const batch = writeBatch(db);
            let savedCount = 0;

            records.forEach(rec => {
                const safeName = rec.studentName.replace(/[^a-zA-Z0-9]/g, '');
                const sId = rec.studentId || `UNLINKED_${safeName}`;
                const docId = `${sId}_${filters.schoolYear}_${filters.quarter.replace(/\s/g, '')}`;
                const docRef = doc(db, "academic_records", docId);
                
                const safeAverage = (rec.generalAverage === undefined || isNaN(rec.generalAverage)) ? 0 : rec.generalAverage;

                batch.set(docRef, {
                    studentId: sId,
                    studentName: rec.studentName,
                    gender: rec.gender || 'MALE',
                    gradeLevel: filters.gradeLevel,
                    section: filters.section,
                    quarter: filters.quarter,
                    schoolYear: filters.schoolYear,
                    grades: rec.grades || {}, 
                    generalAverage: safeAverage,
                    isUnlinked: rec.isUnlinked || false,
                    updatedAt: new Date()
                });
                savedCount++;
            });

            await batch.commit();
            alert(`Saved ${savedCount} records!`);
            setIsEditing(false);
            
            // Re-fetch to sync IDs, but logic in fetchGrades now preserves header order
            fetchGrades(); 
        } catch (error) {
            console.error(error);
            alert("Error saving: " + error.message);
        }
        setLoading(false);
    };

    // --- DELETION HANDLERS ---
    const handleDeleteAll = async () => {
        if (!confirm("Delete ALL displayed records? This cannot be undone.")) return;
        setLoading(true);
        try {
            const batch = writeBatch(db);
            let count = 0;
            records.forEach(r => {
                if (r.id) { batch.delete(doc(db, "academic_records", r.id)); count++; }
            });
            if (count > 0) await batch.commit();
            setRecords([]); 
            alert("Records deleted.");
        } catch (e) { alert("Error: " + e.message); }
        setLoading(false);
    };

    const handleDeleteRecord = async (index) => {
        const record = records[index];
        if (!confirm(`Delete ${record.studentName}?`)) return;
        setLoading(true);
        try {
            if (record.id) await deleteDoc(doc(db, "academic_records", record.id));
            const updated = [...records];
            updated.splice(index, 1);
            setRecords(updated);
        } catch (e) { alert("Error deleting record."); }
        setLoading(false);
    };

    const handleGradeChange = (index, subject, value) => {
        const updated = [...records];
        if (!updated[index].grades) updated[index].grades = {};
        updated[index].grades[subject] = value;
        setRecords(updated);
    };

    // --- UI HELPERS ---
    const ProcessingOverlay = () => (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
            <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col items-center relative overflow-hidden">
                <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Processing Gradesheet</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Please wait...</p>
            </div>
        </div>
    );

    // --- RENDER ---
    if (authLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">Loading...</div>;

    if (!user) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative">
                <div className="absolute inset-0 bg-[url('/2.png')] bg-cover opacity-20 pointer-events-none"></div>
                <div className="bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/10 relative z-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">{Icons.lock}</div>
                        <h1 className="text-2xl font-black text-white uppercase">Teacher Access</h1>
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

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans relative">
            {uploading && <ProcessingOverlay />}

            <div className="bg-slate-900/50 border-b border-white/5 px-8 py-4 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">{Icons.document}</div>
                    <div>
                        <h1 className="text-lg font-black text-white uppercase tracking-tight">Gradebook Manager</h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.email}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="px-5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">Log Out</button>
            </div>

            <div className="p-8 pb-32 max-w-[95%] mx-auto">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/10 mb-8 flex flex-wrap gap-4 items-end">
                    
                    {/* FILTERS */}
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">School Year</label>
                        <select value={filters.schoolYear} onChange={e => setFilters({...filters, schoolYear: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-blue-500 appearance-none cursor-pointer">
                            {yearOptions.map(yr => <option key={yr} value={yr} className="bg-slate-900">{yr}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Quarter</label>
                        <select value={filters.quarter} onChange={e => setFilters({...filters, quarter: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-blue-500 appearance-none cursor-pointer">
                            {['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'].map(q => <option key={q} value={q} className="bg-slate-900">{q}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Grade Level</label>
                        <select value={filters.gradeLevel} onChange={e => setFilters({...filters, gradeLevel: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-blue-500 appearance-none cursor-pointer">
                            {gradeLevelOptions.map(gl => <option key={gl} value={gl} className="bg-slate-900">{gl}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Section</label>
                        <select value={filters.section} onChange={e => setFilters({...filters, section: e.target.value})} disabled={!filters.gradeLevel} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-blue-500 appearance-none cursor-pointer disabled:opacity-50">
                            {filteredSections.map(s => <option key={s.id} value={s.sectionName} className="bg-slate-900">{s.sectionName}</option>)}
                            {filteredSections.length === 0 && <option value="" className="bg-slate-900">No sections found</option>}
                        </select>
                    </div>

                    {/* UPLOAD CONTROLS */}
                    <div className="flex items-center gap-2">
                        {!selectedFile ? (
                            <label className="relative cursor-pointer group">
                                <input type="file" onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" disabled={uploading} />
                                <div className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20 border border-blue-500">
                                    {Icons.upload} Upload Gradesheet
                                </div>
                            </label>
                        ) : (
                            <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-white/10 animate-fade-in">
                                <div className="px-3 text-[10px] font-bold text-slate-300 uppercase tracking-wider max-w-[150px] truncate">
                                    {selectedFile.name}
                                </div>
                                <button onClick={handleProcessFile} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold uppercase text-[10px] transition-colors shadow-lg">
                                    Start Processing
                                </button>
                                <button onClick={handleRemoveFile} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg transition-colors border border-red-500/20" title="Cancel Upload">
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h3 className="font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                                {records.length} Student Records
                            </h3>
                            {records.length > 0 && (
                                <button onClick={handleDeleteAll} className="bg-red-900/20 hover:bg-red-900/40 text-red-400 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-red-500/20 transition-all flex items-center gap-2">
                                    {Icons.trash} Delete All
                                </button>
                            )}
                        </div>
                        {records.length > 0 && (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditing(!isEditing)} className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5">
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
                                <tr className="bg-slate-950 text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-md">
                                    <th className="p-5 sticky left-0 bg-slate-950 z-10 border-r border-white/5 w-[250px]">Student Name</th>
                                    
                                    {detectedHeaders.map(sub => (
                                        <th key={sub} className="p-4 text-center border-l border-white/5 min-w-[80px] hover:text-white transition-colors cursor-default">{sub}</th>
                                    ))}
                                    
                                    <th className="p-4 text-center border-l border-white/5 text-teal-400 bg-teal-900/10">Avg</th>
                                    <th className="p-4 text-center border-l border-white/5 text-red-400 bg-red-900/10">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs font-bold text-slate-300">
                                {records.map((rec, rowIndex) => {
                                    const showBoysHeader = (rec.gender === 'MALE' && rowIndex === 0) || (rec.gender === 'MALE' && records[rowIndex-1]?.gender !== 'MALE');
                                    const showGirlsHeader = (rec.gender === 'FEMALE' && rowIndex === 0) || (rec.gender === 'FEMALE' && records[rowIndex-1]?.gender !== 'FEMALE');
                                    const colSpan = 3 + detectedHeaders.length;

                                    return (
                                        <React.Fragment key={rowIndex}>
                                            {showBoysHeader && (
                                                <tr className="bg-blue-950/40 border-y border-blue-500/20">
                                                    <td colSpan={colSpan} className="p-3 pl-5 text-xs font-black text-blue-300 uppercase tracking-[0.2em] sticky left-0">BOYS</td>
                                                </tr>
                                            )}
                                            {showGirlsHeader && (
                                                <tr className="bg-pink-950/40 border-y border-pink-500/20 mt-4">
                                                    <td colSpan={colSpan} className="p-3 pl-5 text-xs font-black text-pink-300 uppercase tracking-[0.2em] sticky left-0">GIRLS</td>
                                                </tr>
                                            )}

                                            <tr className="hover:bg-slate-800/50 transition-colors group">
                                                <td className="p-4 sticky left-0 bg-[#020617] group-hover:bg-[#1e293b] border-r border-white/5 text-white uppercase tracking-wide">
                                                    {rec.studentName}
                                                    {rec.isUnlinked && <span className="ml-2 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">UNLINKED</span>}
                                                </td>
                                                
                                                {detectedHeaders.map(sub => (
                                                    <td key={sub} className="p-2 text-center border-l border-white/5">
                                                        {isEditing ? (
                                                            <input type="number" value={rec.grades[sub] || ''} onChange={(e) => handleGradeChange(rowIndex, sub, e.target.value)} className="w-12 bg-black/30 border border-white/10 rounded text-center text-white focus:border-blue-500 outline-none text-xs py-1"/>
                                                        ) : (
                                                            <span className={rec.grades[sub] < 75 ? 'text-red-400 font-black' : 'text-slate-300'}>{rec.grades[sub] || '-'}</span>
                                                        )}
                                                    </td>
                                                ))}
                                                
                                                <td className="p-4 text-center font-black text-teal-400 border-l border-white/5 bg-teal-900/5">{rec.generalAverage}</td>
                                                <td className="p-4 text-center border-l border-white/5 bg-red-900/5">
                                                    <button onClick={() => handleDeleteRecord(rowIndex)} className="text-slate-500 hover:text-red-400 transition-colors">{Icons.trash || '🗑️'}</button>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan={15} className="p-20 text-center text-slate-500 opacity-50 font-bold uppercase tracking-widest">No records available</td>
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