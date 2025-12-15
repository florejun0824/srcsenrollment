// src/pages/StudentPortal.jsx
import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Icons } from '../utils/Icons';
import { Link, useNavigate } from 'react-router-dom';

const StudentPortal = () => {
    // 'landing' | 'login' | 'portal' | 'teacher-select'
    const [viewMode, setViewMode] = useState('landing'); 
    
    // Auth & Data State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [studentAccount, setStudentAccount] = useState(null); 
    const [grades, setGrades] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

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
                
                // Case-Insensitive Fetch
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
            setGrades(records.sort((a,b) => b.schoolYear.localeCompare(a.schoolYear)));
        } catch (err) {
            console.error("Error fetching grades:", err);
        }
    };

    const handleLogout = () => {
        setStudentAccount(null);
        setGrades([]);
        setUsername('');
        setPassword('');
        setViewMode('landing');
    };

    // --- COMPONENTS ---
    const SelectionCard = ({ title, desc, icon, color, onClick, buttonText }) => (
        <div onClick={onClick} className={`group relative overflow-hidden rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-2 border border-white/5 cursor-pointer shadow-2xl ${color}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-0 group-hover:opacity-5 blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex flex-col h-full items-start text-left">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-5 shadow-inner border border-white/10">{icon}</div>
                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">{title}</h2>
                <p className="text-white/70 text-sm font-medium leading-relaxed mb-8 max-w-sm">{desc}</p>
                <div className="mt-auto flex items-center gap-2 text-white font-bold text-[10px] uppercase tracking-widest bg-black/20 px-4 py-2.5 rounded-xl border border-white/10 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                    {buttonText} {Icons.arrowLeft && <span className="rotate-180 inline-block">→</span>}
                </div>
            </div>
        </div>
    );

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-[#020617] flex flex-col relative overflow-hidden font-sans text-slate-200">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-slate-950" />
                <img src="/2.png" alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950/90" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 w-full max-w-7xl mx-auto">
                
                {/* 1. LANDING SELECTION */}
                {viewMode === 'landing' && (
                    <div className="w-full max-w-5xl animate-fade-in-up">
                        <div className="text-center mb-12">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-2xl border border-white/10">{Icons.document}</div>
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase mb-4">Academic <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Records</span></h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs md:text-sm">Select your portal to continue</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
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
                        <div className="mt-16 text-center">
                            <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group">
                                {Icons.arrowLeft} <span>Back to Main Portal</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* 2. TEACHER SUB-MENU (Updated Links) */}
                {viewMode === 'teacher-select' && (
                    <div className="w-full max-w-5xl animate-fade-in-up">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Teacher Administration</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Choose a management tool</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
                            {/* LINK TO NEW ACADEMIC ACCOUNT MANAGER */}
                            <SelectionCard 
                                title="Accounts Manager"
                                desc="Create and manage student mock login credentials."
                                icon={Icons.users}
                                color="bg-gradient-to-br from-emerald-900 to-slate-900 hover:shadow-emerald-500/20"
                                buttonText="Manage Accounts"
                                onClick={() => navigate('/academic-accounts')} // UPDATED ROUTE
                            />

                            {/* LINK TO GRADEBOOK */}
                            <SelectionCard 
                                title="Gradebook Manager"
                                desc="Upload Excel gradesheets, edit records, and publish quarterly grades."
                                icon={Icons.document}
                                color="bg-gradient-to-br from-blue-900 to-slate-900 hover:shadow-blue-500/20"
                                buttonText="Manage Grades"
                                onClick={() => navigate('/teacher-grades')}
                            />
                        </div>
                        <div className="mt-16 text-center">
                            <button onClick={() => setViewMode('landing')} className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group">
                                {Icons.arrowLeft} <span>Back to Selection</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. STUDENT LOGIN */}
                {viewMode === 'login' && (
                    <div className="w-full max-w-md animate-fade-in-up">
                        <div className="bg-slate-900/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/10">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-black text-white uppercase">Learner Login</h2>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Enter your account credentials</p>
                            </div>
                            <form onSubmit={handleStudentLogin} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1 mb-1 block">Username</label>
                                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600" required />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest ml-1 mb-1 block">Password</label>
                                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600" required />
                                </div>
                                {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold p-3 rounded-xl text-center">{error}</div>}
                                <button disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-indigo-500/20 transition-all hover:-translate-y-1">
                                    {loading ? 'Authenticating...' : 'View My Grades'}
                                </button>
                            </form>
                            <button onClick={() => setViewMode('landing')} className="w-full mt-4 py-3 text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Cancel</button>
                        </div>
                    </div>
                )}

                {/* 4. STUDENT GRADES PORTAL */}
                {viewMode === 'portal' && studentAccount && (
                    <div className="w-full max-w-6xl animate-fade-in">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 bg-slate-900/50 p-6 rounded-[2rem] border border-white/5">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-xl border border-white/10">
                                    {studentAccount.studentName ? studentAccount.studentName.charAt(0) : 'S'}
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none">{studentAccount.studentName}</h1>
                                    <div className="flex gap-2 mt-2"><span className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-300 uppercase">User: {studentAccount.username}</span></div>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-widest transition-all">Sign Out</button>
                        </div>

                        {grades.length === 0 ? (
                            <div className="text-center py-32 bg-slate-900/30 rounded-[2.5rem] border border-dashed border-white/5">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No academic records found for "{studentAccount.studentName}".</p>
                            </div>
                        ) : (
                            <div className="grid gap-8 pb-20">
                                {grades.map((record, idx) => (
                                    <div key={idx} className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                        <div className="bg-white/5 p-8 flex justify-between items-center border-b border-white/5">
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase">{record.quarter}</h3>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">SY {record.schoolYear} • {record.gradeLevel} - {record.section}</p>
                                            </div>
                                            <div className="bg-black/40 px-6 py-3 rounded-2xl border border-white/5 flex flex-col items-end">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gen Avg</span>
                                                <span className={`text-3xl font-black ${record.generalAverage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>{record.generalAverage || '—'}</span>
                                            </div>
                                        </div>
                                        <div className="p-8 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {record.grades && Object.entries(record.grades).map(([subj, grade]) => (
                                                <div key={subj} className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase mb-2 truncate" title={subj}>{subj}</span>
                                                    <span className={`text-2xl font-black ${grade >= 75 ? 'text-white' : 'text-red-400'}`}>{grade}</span>
                                                </div>
                                            ))}
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