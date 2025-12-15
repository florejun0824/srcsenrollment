// src/pages/GradebookManager.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore'; // Removed unused imports
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

    // --- INITIALIZATION ---
    useEffect(() => {
        const init = async () => {
            // 1. Generate School Years
            const years = [];
            const startYear = 2025;
            for (let i = 0; i < 10; i++) {
                years.push(`${startYear + i}-${startYear + i + 1}`);
            }
            setYearOptions(years);

            // 2. Fetch Sections from Firestore
            try {
                const q = query(collection(db, "sections"));
                const snap = await getDocs(q);
                
                // --- FIX: Read 'name' instead of 'sectionName' ---
                const sectionsData = snap.docs.map(d => ({ 
                    id: d.id, 
                    sectionName: d.data().name || "Unnamed Section", // <--- CHANGED HERE
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

    // --- FILTER LOGIC ---
    useEffect(() => {
        if (filters.gradeLevel) {
            const relevantSections = allSections
                .filter(s => s.gradeLevel === filters.gradeLevel)
                .sort((a, b) => (a.sectionName || "").localeCompare(b.sectionName || ""));
            
            setFilteredSections(relevantSections);

            const currentSectionValid = relevantSections.some(s => s.sectionName === filters.section);
            if (!currentSectionValid && relevantSections.length > 0) {
                setFilters(prev => ({ ...prev, section: relevantSections[0].sectionName }));
            } else if (relevantSections.length === 0) {
                setFilters(prev => ({ ...prev, section: '' }));
            }
        }
    }, [filters.gradeLevel, allSections]);

    // --- AUTH CHECK & FETCH ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
            if (currentUser && filters.gradeLevel && filters.section) {
                fetchGrades();
            }
        });
        return () => unsubscribe();
    }, [filters.schoolYear, filters.quarter, filters.gradeLevel, filters.section]); 

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
        if (!filters.gradeLevel || !filters.section) return;

        setLoading(true);
        try {
            const q = query(
                collection(db, "academic_records"),
                where("schoolYear", "==", filters.schoolYear),
                where("quarter", "==", filters.quarter),
                where("gradeLevel", "==", filters.gradeLevel),
                where("section", "==", filters.section)
            );
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            setRecords(data.sort((a,b) => (a.studentName || "").localeCompare(b.studentName || "")));
        } catch (error) {
            console.error("Fetch Error:", error);
            // Don't alert here to avoid spamming the user on load
        }
        setLoading(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const { meta, records: extractedRecords } = await parseCumulativeGrades(file);
            
            let newFilters = { ...filters };
            let filterChanged = false;

            if (meta.gradeLevel) {
                const match = gradeLevelOptions.find(opt => opt.toLowerCase() === meta.gradeLevel.toLowerCase());
                if (match) {
                    newFilters.gradeLevel = match;
                    filterChanged = true;
                }
            }
            
            if (filterChanged) {
                 if (confirm(`AI Detected Grade Level: ${meta.gradeLevel}. Switch view?`)) {
                    setFilters(newFilters);
                 }
            }

            const drafts = extractedRecords.map(r => ({
                studentName: r.name,
                grades: r.grades,
                generalAverage: r.average,
                status: 'Unsaved' 
            }));
            setRecords(drafts);
            setIsEditing(true);
        } catch (error) {
            alert(error.message);
        }
        setUploading(false);
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        try {
            const batch = writeBatch(db);
            const enrollQ = query(
                collection(db, "enrollments"), 
                where("gradeLevel", "==", filters.gradeLevel)
            );
            const enrollSnap = await getDocs(enrollQ);
            const students = enrollSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            let matchedCount = 0;

            records.forEach(rec => {
                const searchName = rec.studentName.split(',')[0].trim().toUpperCase();
                const studentMatch = students.find(s => 
                    s.lastName && searchName.includes(s.lastName.toUpperCase())
                );

                if (studentMatch) {
                    matchedCount++;
                    const docId = `${studentMatch.id}_${filters.schoolYear}_${filters.quarter.replace(' ', '')}`;
                    const docRef = doc(db, "academic_records", docId);
                    batch.set(docRef, {
                        ...rec,
                        studentId: studentMatch.id,
                        studentName: `${studentMatch.lastName}, ${studentMatch.firstName}`,
                        gradeLevel: filters.gradeLevel,
                        section: filters.section,
                        quarter: filters.quarter,
                        schoolYear: filters.schoolYear,
                        updatedAt: new Date()
                    });
                }
            });
            await batch.commit();
            alert(`Saved ${matchedCount} records successfully!`);
            setIsEditing(false);
            fetchGrades();
        } catch (error) {
            console.error(error);
            alert("Error saving records: " + error.message);
        }
        setLoading(false);
    };

    const handleGradeChange = (index, subject, value) => {
        const updated = [...records];
        updated[index].grades[subject] = value;
        setRecords(updated);
    };

    const allSubjects = Array.from(new Set(records.flatMap(r => Object.keys(r.grades || {}))));

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
        <div className="min-h-screen bg-[#020617] text-slate-300 font-sans">
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
                            {uploading ? <span className="animate-spin">⏳</span> : Icons.upload} 
                            {uploading ? 'Analyzing...' : 'Upload Gradesheet'}
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900/80 backdrop-blur rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="font-bold text-white uppercase tracking-widest">
                            {records.length} Student Records • <span className="text-slate-500">{filters.gradeLevel} - {filters.section}</span>
                        </h3>
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
                                    {allSubjects.map(sub => <th key={sub} className="p-4 text-center border-l border-white/5">{sub}</th>)}
                                    <th className="p-4 text-center border-l border-white/5 text-emerald-500">Avg</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs font-bold text-slate-300">
                                {records.map((rec, rowIndex) => (
                                    <tr key={rowIndex} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 sticky left-0 bg-[#0f172a] group-hover:bg-[#1e293b] border-r border-white/10 text-white uppercase">
                                            {rec.studentName}
                                        </td>
                                        {allSubjects.map(sub => (
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
                                    </tr>
                                ))}
                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">
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