// src/pages/StudentPortal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Icons } from '../utils/Icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Filter, Calendar, BookOpen, GraduationCap, Clock, Pointer, ArrowLeft, FileText, CheckCircle, XCircle } from 'lucide-react';

// --- CUSTOM DROPDOWN COMPONENT (Updated for Compact Mobile) ---
const CustomDropdown = ({ label, options, value, onChange, icon: Icon, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full md:w-auto" ref={dropdownRef}>
            {/* Label hidden on very small screens to save vertical space, or keep tiny */}
            <label className="block text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1 truncate">
                {label}
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                // UPDATED: Reduced padding (px-2 py-2) and text size (text-[10px]) for mobile
                className={`w-full md:min-w-[180px] flex items-center justify-between gap-1 md:gap-3 bg-slate-900/80 border ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-white/10 hover:border-white/20'} rounded-xl px-2 py-2 md:px-4 md:py-3.5 text-[10px] md:text-sm font-bold text-slate-200 transition-all active:scale-[0.98] shadow-sm`}
            >
                <div className="flex items-center gap-1.5 truncate">
                    {Icon && <Icon className={`w-3 h-3 md:w-4 md:h-4 shrink-0 ${value ? 'text-indigo-400' : 'text-slate-500'}`} />}
                    <span className={`truncate ${!value ? 'text-slate-500 font-medium' : ''}`}>
                        {value || <span className="md:hidden">Select</span>} {/* Shorten placeholder on mobile */}
                        <span className="hidden md:inline">{!value && placeholder}</span>
                    </span>
                </div>
                <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[150%] md:w-full bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                        <button
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className="w-full text-left px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wide text-slate-500 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            - Clear -
                        </button>
                        {options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                                className={`w-full text-left px-3 py-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${value === opt ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StudentPortal = () => {
    const location = useLocation();
    
    // --- VIEW STATE ---
    const [viewMode, setViewMode] = useState(location.state?.viewMode || 'landing'); 
    
    // --- AUTH STATE ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // --- DATA STATE ---
    const [studentAccount, setStudentAccount] = useState(null); 
    const [grades, setGrades] = useState([]);
    const [filteredGrades, setFilteredGrades] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // --- FILTER STATE ---
    const [selectedGradeLevel, setSelectedGradeLevel] = useState(''); 
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedQuarter, setSelectedQuarter] = useState('');
    
    // OPTIONS
    const gradeLevelOptions = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
    
    const yearOptions = Array.from({ length: 10 }, (_, i) => {
        const start = 2025 + i;
        return `${start}-${start + 1}`;
    });

    const quarterOptions = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];

    const navigate = useNavigate();

    // --- STRICT FILTER LOGIC ---
    useEffect(() => {
        if (!selectedGradeLevel || !selectedYear || !selectedQuarter) {
            setFilteredGrades([]); 
            return;
        }

        const result = grades.filter(r => 
            r.gradeLevel === selectedGradeLevel && 
            r.schoolYear === selectedYear && 
            r.quarter === selectedQuarter
        );
        
        setFilteredGrades(result);
    }, [selectedGradeLevel, selectedYear, selectedQuarter, grades]);

    // --- HANDLERS ---
    const handleStudentLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const accountsRef = collection(db, "student_accounts");
            const q = query(
                accountsRef, 
                where("username", "==", username),
                where("password", "==", password)
            );
            
            const snap = await getDocs(q);

            if (snap.empty) {
                setError("Invalid username or password.");
            } else {
                const accountData = { id: snap.docs[0].id, ...snap.docs[0].data() };
                setStudentAccount(accountData);
                await fetchStudentGrades(accountData.studentName);
                setViewMode('portal');
            }
        } catch (err) {
            console.error(err);
            setError("System connection error. Please try again.");
        }
        setLoading(false);
    };

    const fetchStudentGrades = async (targetName) => {
        try {
            const standardizedName = targetName.toUpperCase().trim();
            const q = query(
                collection(db, "academic_records"), 
                where("studentName", "==", standardizedName)
            );
            
            const snap = await getDocs(q);
            const records = snap.docs.map(d => d.data());
            
            const sorted = records.sort((a,b) => b.schoolYear.localeCompare(a.schoolYear));
            setGrades(sorted);
        } catch (err) {
            console.error("Error fetching grades:", err);
        }
    };

    const handleLogout = () => {
        setStudentAccount(null);
        setGrades([]);
        setFilteredGrades([]);
        setUsername('');
        setPassword('');
        setSelectedGradeLevel('');
        setSelectedYear('');
        setSelectedQuarter('');
        setViewMode('landing');
    };

    // --- SELECTION CARD ---
    const SelectionCard = ({ title, desc, icon, color, onClick, buttonText }) => (
        <div 
            onClick={onClick}
            className={`group relative overflow-hidden rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-2 border border-white/5 cursor-pointer shadow-2xl ${color}`}
        >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-0 group-hover:opacity-5 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col h-full items-start text-left">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-5 shadow-inner border border-white/10">
                    {icon}
                </div>
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{title}</h2>
                <p className="text-white/70 text-sm font-medium leading-relaxed mb-8 max-w-sm">{desc}</p>
                <div className="mt-auto flex items-center gap-2 text-white font-bold text-[10px] uppercase tracking-widest bg-black/20 px-4 py-2.5 rounded-xl border border-white/10 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                    {buttonText} {Icons.arrowLeft && <span className="rotate-180 inline-block">→</span>}
                </div>
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    return (
        <div className="min-h-screen bg-[#020617] flex flex-col relative overflow-hidden font-sans text-slate-200">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-slate-950" />
                <img src="/2.png" alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950/90" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-6 w-full max-w-7xl mx-auto">
                
                {/* 1. LANDING */}
                {viewMode === 'landing' && (
                    <div className="w-full max-w-5xl animate-fade-in-up">
                        <div className="text-center mb-8 md:mb-12">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-2xl border border-white/10">
                                {Icons.document}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase mb-4">
                                Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Records</span>
                            </h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs md:text-sm">Select your portal to continue</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-2 md:px-4">
                            <SelectionCard 
                                title="Student View"
                                desc="Login with your username to check grades and academic history."
                                icon={Icons.users}
                                color="bg-gradient-to-br from-indigo-900 to-slate-900 hover:shadow-indigo-500/20"
                                buttonText="Student Login"
                                onClick={() => setViewMode('login')}
                            />
                            <SelectionCard 
                                title="Teacher Admin"
                                desc="Manage student accounts and academic grade records."
                                icon={Icons.dashboard}
                                color="bg-gradient-to-br from-slate-800 to-slate-950 hover:shadow-slate-500/20"
                                buttonText="Access Admin Tools"
                                onClick={() => setViewMode('teacher-select')} 
                            />
                        </div>
                        <div className="mt-12 md:mt-16 text-center">
                            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group">
                                {Icons.arrowLeft} <span>Back to Main Portal</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* 2. TEACHER SELECT */}
                {viewMode === 'teacher-select' && (
                    <div className="w-full max-w-5xl animate-fade-in-up">
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">Teacher Administration</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Choose a management tool</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 px-2 md:px-4">
                            <SelectionCard 
                                title="Accounts Manager"
                                desc="Create and manage student mock login credentials."
                                icon={Icons.users}
                                color="bg-gradient-to-br from-emerald-900 to-slate-900 hover:shadow-emerald-500/20"
                                buttonText="Manage Accounts"
                                onClick={() => navigate('/academic-accounts')} 
                            />
                            <SelectionCard 
                                title="Gradebook Manager"
                                desc="Upload Excel gradesheets, edit records, and publish quarterly grades."
                                icon={Icons.document}
                                color="bg-gradient-to-br from-blue-900 to-slate-900 hover:shadow-blue-500/20"
                                buttonText="Manage Grades"
                                onClick={() => navigate('/teacher-grades')}
                            />
                        </div>
                        <div className="mt-12 md:mt-16 text-center">
                            <button onClick={() => setViewMode('landing')} className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group">
                                {Icons.arrowLeft} <span>Back to Selection</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. STUDENT LOGIN */}
                {viewMode === 'login' && (
                    <div className="w-full max-w-md animate-fade-in-up px-2">
                        <div className="bg-slate-900/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/10">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-white uppercase">Learner Login</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Enter your account credentials</p>
                            </div>
                            <form onSubmit={handleStudentLogin} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1 mb-1 block">Username</label>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 text-sm" placeholder="ENTER USERNAME" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1 mb-1 block">Password</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600 text-sm" placeholder="ENTER PASSWORD" required />
                                </div>
                                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold p-3 rounded-xl text-center flex items-center justify-center gap-2">{Icons.alert} {error}</div>}
                                <button disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-indigo-500/20 transition-all hover:-translate-y-1 text-xs">
                                    {loading ? 'Authenticating...' : 'View My Grades'}
                                </button>
                            </form>
                            <button onClick={() => setViewMode('landing')} className="w-full mt-4 py-3 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Cancel</button>
                        </div>
                    </div>
                )}

                {/* 4. STUDENT PORTAL DASHBOARD */}
                {viewMode === 'portal' && studentAccount && (
                    <div className="w-full max-w-6xl animate-fade-in pb-20">
                        {/* NAV HEADER */}
                        <div className="flex items-center justify-between mb-4 md:mb-6 px-1">
                            <button 
                                onClick={handleLogout}
                                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all active:scale-95"
                            >
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                <span className="text-xs font-bold uppercase tracking-widest">Back to Menu</span>
                            </button>
                            <span className="hidden md:block text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                Student Digital Portal
                            </span>
                        </div>

                        {/* PROFILE CARD */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 bg-slate-900/50 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-xl">
                            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left w-full">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-3xl flex items-center justify-center text-3xl md:text-4xl font-black text-white shadow-2xl border border-white/10 shrink-0">
                                    {studentAccount.studentName ? studentAccount.studentName.charAt(0) : 'S'}
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none mb-3 break-words">
                                        {studentAccount.studentName}
                                    </h1>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                        <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            {studentAccount.username}
                                        </span>
                                        <span className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FILTER BAR (UPDATED: Grid on mobile for 1 row) */}
                        <div className="mb-6 grid grid-cols-3 md:flex md:flex-row items-end gap-2 px-1">
                            <CustomDropdown 
                                label="Grade Level"
                                options={gradeLevelOptions}
                                value={selectedGradeLevel}
                                onChange={setSelectedGradeLevel}
                                icon={GraduationCap}
                                placeholder="Grade"
                            />
                            <CustomDropdown 
                                label="School Year"
                                options={yearOptions}
                                value={selectedYear}
                                onChange={setSelectedYear}
                                icon={Calendar}
                                placeholder="Year"
                            />
                            <CustomDropdown 
                                label="Academic Quarter"
                                options={quarterOptions}
                                value={selectedQuarter}
                                onChange={setSelectedQuarter}
                                icon={Clock}
                                placeholder="Qtr"
                            />
                            
                            {(selectedGradeLevel || selectedYear || selectedQuarter) && (
                                <button 
                                    onClick={() => { setSelectedGradeLevel(''); setSelectedYear(''); setSelectedQuarter(''); }}
                                    // UPDATED: Spans all 3 cols on mobile, smaller height and text
                                    className="col-span-3 md:col-span-1 w-full md:w-auto h-8 md:h-[46px] px-6 rounded-xl border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <Filter className="w-3 h-3" /> Clear Filters
                                </button>
                            )}
                        </div>

                        {/* CONTENT DISPLAY */}
                        {!selectedGradeLevel || !selectedYear || !selectedQuarter ? (
                            <div className="text-center py-20 md:py-32 bg-slate-900/30 rounded-[2.5rem] border border-dashed border-white/5 mx-1 animate-fade-in-up">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Pointer className="w-8 h-8 text-indigo-400 animate-bounce" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">Select Academic Period</h3>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs px-4">
                                    Please select your Grade Level, School Year, and Quarter to view grades.
                                </p>
                            </div>
                        ) : filteredGrades.length === 0 ? (
                            <div className="text-center py-20 md:py-32 bg-slate-900/30 rounded-[2.5rem] border border-dashed border-white/5 mx-1 animate-fade-in">
                                <div className="text-4xl md:text-5xl mb-6 opacity-20 grayscale">📂</div>
                                <h3 className="text-white font-bold text-lg mb-2">No Records Found</h3>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs px-4">
                                    No records match {selectedGradeLevel} ({selectedYear}, {selectedQuarter}).
                                </p>
                            </div>
                        ) : (
                            // --- DOCUMENT VIEW ---
                            <div className="animate-fade-in">
                                {filteredGrades.map((record, idx) => (
                                    <div key={idx} className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl mb-8 relative">
                                        
                                        {/* DOCUMENT HEADER */}
                                        <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900/40 border-b border-white/10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Report Card</h3>
                                                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">
                                                        Official Grade Record
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-center md:items-end">
                                                <div className="text-sm font-bold text-white uppercase">{record.quarter}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    SY {record.schoolYear} • {record.gradeLevel} - {record.section}
                                                </div>
                                            </div>
                                        </div>

                                        {/* DOCUMENT TABLE BODY */}
                                        <div className="p-0 md:p-8">
                                            <div className="overflow-hidden md:rounded-xl border-t md:border border-white/10">
                                                
                                                {/* Table Header (Desktop) */}
                                                <div className="hidden md:flex bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest p-4 border-b border-white/5">
                                                    <div className="flex-1">Learning Area</div>
                                                    <div className="w-32 text-center">Final Grade</div>
                                                    <div className="w-32 text-center">Remarks</div>
                                                </div>

                                                {/* Rows */}
                                                <div className="divide-y divide-white/5">
                                                    {record.grades && Object.entries(record.grades).map(([subj, grade]) => {
                                                        const isPassing = parseFloat(grade) >= 75;
                                                        return (
                                                            <div key={subj} className="group flex flex-row md:items-center p-4 md:px-4 md:py-3 odd:bg-transparent even:bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                                                
                                                                {/* Subject Name */}
                                                                <div className="flex-1 flex items-center gap-3">
                                                                    <div className={`md:hidden w-1 h-8 rounded-full ${isPassing ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                                    <span className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-wide leading-tight py-1">
                                                                        {subj}
                                                                    </span>
                                                                </div>

                                                                {/* Grade & Remarks Wrapper */}
                                                                <div className="flex flex-col md:flex-row items-center md:items-center justify-center gap-2 md:gap-0 min-w-[90px] md:min-w-0">
                                                                    
                                                                    {/* Grade (UPDATED: Reduced from text-3xl to text-2xl) */}
                                                                    <div className="w-full md:w-32 text-center md:text-center">
                                                                        <span className={`text-2xl md:text-base font-black font-mono ${isPassing ? 'text-white' : 'text-red-400'}`}>
                                                                            {grade}
                                                                        </span>
                                                                        <span className="md:hidden text-[9px] text-slate-500 font-bold uppercase block -mt-1">Final</span>
                                                                    </div>

                                                                    {/* Remarks */}
                                                                    <div className="w-full md:w-32 flex justify-center md:justify-center">
                                                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isPassing ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                                            {isPassing ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                                            {isPassing ? 'Passed' : 'Failed'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* DOCUMENT FOOTER (Summary) */}
                                        <div className="bg-black/20 border-t border-white/10 p-6 md:p-8 flex justify-between items-center">
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                Based on DepEd Grading System
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">General Average</div>
                                                    <div className={`text-2xl md:text-3xl font-black leading-none ${record.generalAverage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {record.generalAverage || '—'}
                                                    </div>
                                                </div>
                                                <div className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center border-2 ${record.generalAverage >= 75 ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}>
                                                    {record.generalAverage >= 75 ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPortal;