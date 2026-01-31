// src/pages/StudentPortal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
    ChevronDown, 
    Filter, 
    Calendar, 
    BookOpen, 
    GraduationCap, 
    Clock, 
    Pointer, 
    ArrowLeft, 
    FileText, 
    CheckCircle, 
    XCircle, 
    User, 
    LayoutDashboard, 
    LogOut,
    ShieldCheck,
    LockKeyhole,
    Sparkles,
    WifiHigh,
    Fingerprint
} from 'lucide-react';

// --- COMPONENT: LIGHTWEIGHT AURORA BACKGROUND ---
// Optimized for performance using 'transform' and fixed opacity to reduce repaints.
const OptimizedAurora = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[100px]" />
        {/* Blob 1: Violet/Blue */}
        <div 
            className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-300/30 blur-[80px] mix-blend-multiply animate-blob-slow"
            style={{ willChange: 'transform' }}
        />
        {/* Blob 2: Fuchsia/Pink */}
        <div 
            className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-fuchsia-300/30 blur-[80px] mix-blend-multiply animate-blob-slower"
            style={{ willChange: 'transform', animationDelay: '2s' }}
        />
        {/* Blob 3: Cyan/Teal */}
        <div 
            className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-cyan-200/40 blur-[80px] mix-blend-multiply animate-blob-slow"
            style={{ willChange: 'transform', animationDelay: '4s' }}
        />
        <style>{`
            @keyframes blob-slow {
                0% { transform: translate(0px, 0px) scale(1); }
                33% { transform: translate(30px, -50px) scale(1.1); }
                66% { transform: translate(-20px, 20px) scale(0.9); }
                100% { transform: translate(0px, 0px) scale(1); }
            }
            .animate-blob-slow { animation: blob-slow 15s infinite ease-in-out; }
            .animate-blob-slower { animation: blob-slow 20s infinite ease-in-out; }
        `}</style>
    </div>
);

// --- COMPONENT: CINEMATIC SYSTEM CONNECTOR ---
const SystemConnector = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    
    useEffect(() => {
        const steps = [
            setTimeout(() => setStep(1), 600),  // "Handshaking..."
            setTimeout(() => setStep(2), 1400), // "Verifying Credentials..."
            setTimeout(() => setStep(3), 2200), // "Access Granted"
            setTimeout(onComplete, 2800)        // Finish
        ];
        return () => steps.forEach(clearTimeout);
    }, [onComplete]);

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-sm p-8 text-center">
                <div className="relative w-20 h-20 mx-auto mb-8">
                    {/* Ripple Effect */}
                    <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                    <div className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl border border-indigo-100">
                        {step < 3 ? (
                            <WifiHigh className="w-8 h-8 text-indigo-600 animate-pulse" />
                        ) : (
                            <CheckCircle className="w-10 h-10 text-emerald-500 animate-scale-in" />
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        {step === 0 && "Initiating Secure Handshake..."}
                        {step === 1 && "Encrypting Session..."}
                        {step === 2 && "Verifying Student Identity..."}
                        {step === 3 && "Access Granted"}
                    </h2>
                    
                    {/* Progress Bar */}
                    <div className="h-1.5 w-64 mx-auto bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-indigo-600 transition-all duration-700 ease-out rounded-full"
                            style={{ width: step === 0 ? '10%' : step === 1 ? '45%' : step === 2 ? '80%' : '100%' }}
                        />
                    </div>
                    
                    <p className="text-xs font-mono text-slate-400">
                        Gateway: 192.168.SECURE • Port: 443
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- CUSTOM DROPDOWN (Unchanged logic, just keeping it here) ---
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
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                {label}
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full md:min-w-[180px] flex items-center justify-between gap-3 bg-white/80 backdrop-blur-sm border ${isOpen ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'} rounded-xl px-3 py-2.5 md:px-4 md:py-3 text-sm font-medium text-slate-700 transition-all shadow-sm`}
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon className={`w-4 h-4 shrink-0 ${value ? 'text-indigo-600' : 'text-slate-400'}`} />}
                    <span className={`truncate ${!value ? 'text-slate-400' : 'text-slate-900 font-semibold'}`}>
                        {value || <span className="md:hidden">Select</span>}
                        <span className="hidden md:inline">{!value && placeholder}</span>
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full md:w-[120%] bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] animate-fade-in-up p-1">
                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                        <button
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold uppercase text-slate-400 hover:bg-slate-50 transition-colors"
                        >
                            - Clear -
                        </button>
                        {options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${value === opt ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
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
    const navigate = useNavigate();
    
    // --- VIEW STATE ---
    const [viewMode, setViewMode] = useState(location.state?.viewMode || 'landing'); 
    
    // --- AUTH STATE ---
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isConnecting, setIsConnecting] = useState(false); // Controls the cinematic loader
    
    // --- DATA STATE ---
    const [studentAccount, setStudentAccount] = useState(null); 
    const [grades, setGrades] = useState([]);
    const [filteredGrades, setFilteredGrades] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Controls the API wait state

    // --- FILTER STATE ---
    const [selectedGradeLevel, setSelectedGradeLevel] = useState(''); 
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedQuarter, setSelectedQuarter] = useState('');
    
    const gradeLevelOptions = ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
    const yearOptions = Array.from({ length: 10 }, (_, i) => {
        const start = 2025 + i;
        return `${start}-${start + 1}`;
    });
    const quarterOptions = ["1st Quarter", "2nd Quarter", "3rd Quarter", "4th Quarter"];

    // --- STRICT FILTER LOGIC ---
    useEffect(() => {
        if (!selectedGradeLevel || !selectedYear || !selectedQuarter) {
            setFilteredGrades([]); 
            return;
        }

        const result = grades.filter(r => {
            const dbGrade = r.gradeLevel ? r.gradeLevel.toString().replace(/\D/g, '') : ''; 
            const selectGrade = selectedGradeLevel.replace(/\D/g, ''); 
            
            return dbGrade === selectGrade && 
                   r.schoolYear === selectedYear && 
                   r.quarter === selectedQuarter;
        });
        
        setFilteredGrades(result);
    }, [selectedGradeLevel, selectedYear, selectedQuarter, grades]);

    // --- HANDLERS ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Check Firebase first
            const accountsRef = collection(db, "student_accounts");
            const q = query(
                accountsRef, 
                where("username", "==", username),
                where("password", "==", password)
            );
            
            const snap = await getDocs(q);

            if (snap.empty) {
                setError("Invalid username or password.");
                setLoading(false);
            } else {
                // Credentials are good! Trigger cinematic sequence
                setIsConnecting(true); // Shows the SystemConnector component
                
                // Prepare data in background
                const accountData = { id: snap.docs[0].id, ...snap.docs[0].data() };
                setStudentAccount(accountData);
                await fetchStudentGrades(accountData.studentName);
                
                // Note: We don't setViewMode('portal') here yet. 
                // The SystemConnector's onComplete callback handles that.
            }
        } catch (err) {
            console.error(err);
            setError("System connection error. Please try again.");
            setLoading(false);
        }
    };

    const handleConnectionComplete = () => {
        setIsConnecting(false);
        setLoading(false);
        setViewMode('portal');
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

    // --- MAIN RENDER ---
    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-600 relative overflow-hidden">
            
            {/* 0. LIGHTWEIGHT AURORA */}
            <OptimizedAurora />

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-7xl mx-auto">
                
                {/* 1. LANDING PAGE - DISTINCT LIGHT CARDS */}
                {viewMode === 'landing' && (
                    <div className="w-full max-w-5xl animate-fade-in-up">
                        <div className="text-center mb-10 md:mb-16">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-[2rem] shadow-xl shadow-indigo-200/50 mb-6 text-indigo-600 border border-indigo-50 relative group cursor-default">
                                <BookOpen strokeWidth={2} className="w-8 h-8 relative z-10" />
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4">
                                Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Portal</span>
                            </h1>
                            <p className="text-slate-500 font-medium text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                                Secure access to student records, grading systems, and administrative tools.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-2 md:px-8">
                            
                            {/* STUDENT CARD - Indigo/Violet Theme (Glassy) */}
                            <div 
                                onClick={() => setViewMode('login')}
                                className="group relative overflow-hidden bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 border border-white shadow-xl shadow-indigo-100/40 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-200/50"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-indigo-200/60 transition-colors duration-500"></div>
                                
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-indigo-600 border border-indigo-50 group-hover:scale-110 transition-transform duration-300">
                                        <GraduationCap className="w-7 h-7" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Access</h2>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                        Check your grades, view academic progress, and access your student profile.
                                    </p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-sm font-bold text-indigo-600 group-hover:underline decoration-2 underline-offset-4">Login to Portal</span>
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                            <ArrowLeft className="w-4 h-4 rotate-180" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* FACULTY CARD - Emerald/Teal Theme (Light, Crisp, Distinct) */}
                            {/* Changed from Dark Theme to Light Theme as requested */}
                            <div 
                                onClick={() => navigate('/teacher-dashboard')}
                                className="group relative overflow-hidden bg-white/70 backdrop-blur-md rounded-[2.5rem] p-8 border border-emerald-50 shadow-xl shadow-emerald-100/40 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-200/50"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-emerald-200/60 transition-colors duration-500"></div>
                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-100/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-emerald-600 border border-emerald-50 group-hover:scale-110 transition-transform duration-300">
                                        <LayoutDashboard className="w-7 h-7" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Faculty & Admin</h2>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                        Manage student accounts, input grades, and oversee academic records.
                                    </p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-sm font-bold text-emerald-600 group-hover:underline decoration-2 underline-offset-4">Open Dashboard</span>
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                            <ArrowLeft className="w-4 h-4 rotate-180" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-12 text-center">
                            <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest">
                                <ArrowLeft className="w-3 h-3" /> Back to Home
                            </Link>
                        </div>
                    </div>
                )}

                {/* 2. STUDENT LOGIN - REFINED & CINEMATIC */}
                {viewMode === 'login' && (
                    <div className="w-full max-w-sm animate-fade-in-up px-2 relative">
                        
                        {/* THE CINEMATIC LOADER COMPONENT (Overlay) */}
                        {isConnecting && <SystemConnector onComplete={handleConnectionComplete} />}

                        {/* Floating Card Design */}
                        <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-200/50 overflow-hidden border border-white">
                            
                            {/* Decorative Header */}
                            <div className="pt-10 pb-6 text-center bg-gradient-to-b from-slate-50 to-transparent">
                                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                    <Fingerprint strokeWidth={1.5} className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    Secure Student Portal
                                </p>
                            </div>
                            
                            <div className="px-8 pb-10">
                                <form onSubmit={handleLoginSubmit} className="space-y-4">
                                    
                                    {/* USERNAME FIELD */}
                                    <div className="group relative">
                                        <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-bold text-indigo-500 uppercase tracking-wider transition-all opacity-0 group-focus-within:opacity-100 group-focus-within:top-[-8px] z-10">
                                            Student ID
                                        </label>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={username} 
                                            onChange={e => setUsername(e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-4 text-slate-900 font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                                            placeholder="Enter Student ID" 
                                            required 
                                        />
                                    </div>

                                    {/* PASSWORD FIELD */}
                                    <div className="group relative">
                                        <label className="absolute -top-2 left-4 px-2 bg-white text-[10px] font-bold text-indigo-500 uppercase tracking-wider transition-all opacity-0 group-focus-within:opacity-100 group-focus-within:top-[-8px] z-10">
                                            Password
                                        </label>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <input 
                                            type="password" 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-4 text-slate-900 font-semibold outline-none transition-all placeholder:text-slate-400 placeholder:text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                                            placeholder="Enter Password" 
                                            required 
                                        />
                                    </div>
                                    
                                    {error && (
                                        <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-xl flex items-center justify-center gap-2 border border-red-100 animate-shake">
                                            <XCircle className="w-4 h-4 shrink-0" /> {error}
                                        </div>
                                    )}
                                    
                                    <button 
                                        disabled={loading} 
                                        className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Verifying...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Access Portal</span>
                                                <ArrowLeft className="w-4 h-4 rotate-180" />
                                            </>
                                        )}
                                    </button>
                                </form>
                                
                                <div className="mt-6 text-center">
                                    <button 
                                        onClick={() => setViewMode('landing')} 
                                        className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors"
                                    >
                                        Return to Selection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. STUDENT PORTAL DASHBOARD (Existing Dashboard Logic) */}
                {viewMode === 'portal' && studentAccount && (
                    <div className="w-full max-w-6xl animate-fade-in pb-20">
                        {/* HEADER */}
                        <header className="flex items-center justify-between mb-8 px-2">
                            <button 
                                onClick={handleLogout}
                                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Log Out</span>
                            </button>
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">System Online</span>
                            </div>
                        </header>

                        {/* STUDENT PROFILE */}
                        <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-6 md:p-10 border border-white shadow-xl shadow-indigo-100/50 mb-8 relative overflow-hidden z-10">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-60"></div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[2rem] flex items-center justify-center text-4xl md:text-6xl font-black text-white shadow-lg shrink-0 ring-4 ring-white">
                                    {studentAccount.studentName ? studentAccount.studentName.charAt(0) : 'S'}
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100">
                                        <Sparkles className="w-3 h-3 text-indigo-500" />
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Student Account</span>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tight mb-2">
                                        {studentAccount.studentName}
                                    </h1>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                                            <User className="w-3 h-3" />
                                            ID: {studentAccount.username}
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-100">
                                            <CheckCircle className="w-3 h-3" />
                                            Status: Enrolled
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FILTERS */}
                        <div className="relative z-30 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-lg mb-8 overflow-visible">
                            <div className="grid grid-cols-3 md:flex md:flex-row items-end gap-3">
                                <CustomDropdown 
                                    label="Grade Level"
                                    options={gradeLevelOptions}
                                    value={selectedGradeLevel}
                                    onChange={setSelectedGradeLevel}
                                    icon={GraduationCap}
                                    placeholder="Level"
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
                                    placeholder="Quarter"
                                />
                                
                                {(selectedGradeLevel || selectedYear || selectedQuarter) && (
                                    <button 
                                        onClick={() => { setSelectedGradeLevel(''); setSelectedYear(''); setSelectedQuarter(''); }}
                                        className="col-span-3 md:col-span-1 h-[42px] md:h-[46px] px-4 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 md:mt-0"
                                    >
                                        <Filter className="w-3 h-3" /> <span className="md:hidden lg:inline">Reset</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="relative z-0">
                            {!selectedGradeLevel || !selectedYear || !selectedQuarter ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-slate-300 text-center animate-fade-in-up">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                        <Pointer className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-slate-900 font-bold text-xl">Select Academic Period</h3>
                                    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                                        Choose your Grade Level, Year, and Quarter above to view your report card.
                                    </p>
                                </div>
                            ) : filteredGrades.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-slate-300 text-center animate-fade-in">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 grayscale opacity-50">
                                        <BookOpen className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-slate-900 font-bold text-xl">No Records Found</h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        We couldn't find a report card for {selectedGradeLevel} ({selectedQuarter}).
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-fade-in">
                                    {filteredGrades.map((record, idx) => (
                                        <div key={idx} className="bg-white/90 backdrop-blur-sm rounded-[2.5rem] shadow-xl border border-white overflow-hidden ring-1 ring-slate-100">
                                            
                                            {/* REPORT HEADER */}
                                            <div className="bg-slate-50/50 border-b border-slate-200 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                                                <div className="flex items-center gap-5 text-center md:text-left">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                                        <FileText className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-900 uppercase">Report Card</h3>
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                                                            Official Grade Release
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-center md:items-end bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                                                    <div className="text-sm font-bold text-indigo-600 uppercase">{record.quarter}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                                        SY {record.schoolYear} • {record.gradeLevel} - {record.section}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* GRADES TABLE */}
                                            <div className="p-0 md:p-8">
                                                <div className="overflow-hidden md:rounded-3xl md:border border-slate-200 bg-white">
                                                    <div className="hidden md:flex bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider p-4 border-b border-slate-200">
                                                        <div className="flex-1 pl-4">Subject / Learning Area</div>
                                                        <div className="w-32 text-center">Grade</div>
                                                        <div className="w-32 text-center">Status</div>
                                                    </div>

                                                    <div className="divide-y divide-slate-100">
                                                        {record.grades && Object.entries(record.grades).map(([subj, grade]) => {
                                                            const isPassing = parseFloat(grade) >= 75;
                                                            return (
                                                                <div key={subj} className="group flex flex-row items-center p-5 md:px-6 md:py-5 hover:bg-slate-50 transition-colors">
                                                                    <div className="flex-1 flex items-center gap-4">
                                                                        <div className={`md:hidden w-1.5 h-10 rounded-full ${isPassing ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                                                                        <span className="text-sm md:text-sm font-bold text-slate-700 uppercase leading-snug">
                                                                            {subj}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-col md:flex-row items-center gap-1 md:gap-0 min-w-[80px] md:min-w-0">
                                                                        <div className="w-full md:w-32 text-center">
                                                                            <span className={`text-xl md:text-base font-black font-mono ${isPassing ? 'text-slate-800' : 'text-red-500'}`}>
                                                                                {grade}
                                                                            </span>
                                                                        </div>
                                                                        <div className="w-full md:w-32 flex justify-center">
                                                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${isPassing ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
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

                                            {/* SUMMARY FOOTER */}
                                            <div className="bg-slate-50/50 border-t border-slate-200 p-6 md:p-8 flex justify-between items-center">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
                                                    Based on DepEd Grading System K-12
                                                </div>
                                                <div className="flex items-center gap-6 w-full md:w-auto justify-end">
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">General Average</div>
                                                        <div className={`text-4xl font-black leading-none ${record.generalAverage >= 75 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {record.generalAverage || '—'}
                                                        </div>
                                                    </div>
                                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${record.generalAverage >= 75 ? 'border-emerald-100 text-emerald-500 bg-white shadow-lg shadow-emerald-100' : 'border-red-100 text-red-500 bg-white shadow-lg shadow-red-100'}`}>
                                                        {record.generalAverage >= 75 ? <CheckCircle className="w-8 h-8" weight="fill" /> : <XCircle className="w-8 h-8" weight="fill" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPortal;