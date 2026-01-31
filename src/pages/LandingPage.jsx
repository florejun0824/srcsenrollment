// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { 
    UserPlus, 
    ShieldCheck, 
    ChevronRight, 
    LogIn,
    ArrowLeft,
    School,
    Search,
    Loader2,
    X,
    CheckCircle,
    Clock,
    FileText
} from 'lucide-react';

// --- COMPONENT: STANDALONE AURORA BACKGROUND ---
const AuroraBackground = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white/60 to-slate-100/80" />
        <div 
            className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-300/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" 
            style={{ animationDuration: '8s' }}
        />
        <div 
            className="absolute top-[10%] right-[-20%] w-[60vw] h-[60vw] bg-fuchsia-300/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" 
            style={{ animationDuration: '10s', animationDelay: '1s' }}
        />
        <div 
            className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-cyan-300/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" 
            style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
    </div>
);

// --- COMPONENT: TRACKING MODAL (No Changes to Logic) ---
const TrackingModal = ({ isOpen, onClose }) => {
    const [refNumber, setRefNumber] = useState('');
    const [status, setStatus] = useState(null); 
    const [resultData, setResultData] = useState(null);

    if (!isOpen) return null;

    const handleCheck = async (e) => {
        e.preventDefault();
        if (!refNumber.trim()) return;

        setStatus('loading');
        setResultData(null);

        try {
            const q = query(
                collection(db, "enrollments"), 
                where("referenceNumber", "==", refNumber.trim())
            );
            
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                setResultData(docData);
                setStatus('found');
            } else {
                setStatus('not-found');
            }
        } catch (error) {
            console.error("Tracking Error:", error);
            setStatus('error');
        }
    };

    const getStatusColor = (s) => {
        switch(s?.toLowerCase()) {
            case 'enrolled': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'rejected': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-white ring-1 ring-slate-100">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Track Application</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter Reference Number</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition text-slate-400 hover:text-red-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 md:p-8">
                    <form onSubmit={handleCheck} className="relative mb-6">
                        <input 
                            type="text" 
                            value={refNumber}
                            onChange={(e) => setRefNumber(e.target.value.toUpperCase())}
                            placeholder="SRCS-202X-XXXX"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold text-center text-lg rounded-2xl py-3 px-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 uppercase tracking-widest"
                        />
                        <button 
                            type="submit" 
                            disabled={status === 'loading' || !refNumber}
                            className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                        >
                            {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        </button>
                    </form>

                    <div className="min-h-[100px] flex flex-col items-center justify-center">
                        {status === null && (
                            <div className="text-center text-slate-400">
                                <Search size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-medium">Enter your reference code to check status.</p>
                            </div>
                        )}

                        {status === 'not-found' && (
                            <div className="text-center animate-fade-in">
                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
                                    <X size={24} />
                                </div>
                                <h4 className="text-slate-900 font-bold">Record Not Found</h4>
                                <p className="text-xs text-slate-500 mt-1">Please check your reference number and try again.</p>
                            </div>
                        )}

                        {status === 'found' && resultData && (
                            <div className="w-full animate-fade-in">
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-indigo-200 text-2xl font-black">
                                        {resultData.firstName?.[0]}{resultData.lastName?.[0]}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase">{resultData.firstName} {resultData.lastName}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{resultData.gradeLevel}</p>
                                </div>

                                <div className={`p-4 rounded-xl border flex items-center gap-4 ${getStatusColor(resultData.status)}`}>
                                    <div className="shrink-0">
                                        {resultData.status === 'Enrolled' ? <CheckCircle size={24} /> : <Clock size={24} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Current Status</p>
                                        <p className="text-lg font-black uppercase tracking-tight">{resultData.status || 'Pending'}</p>
                                    </div>
                                </div>
                                
                                <div className="mt-4 flex justify-between items-center px-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Update</span>
                                    <span className="text-xs font-bold text-slate-600">
                                        {resultData.updatedAt?.toDate().toLocaleDateString() || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LandingPage = () => {
  const [isTrackOpen, setIsTrackOpen] = useState(false);

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-slate-800 overflow-x-hidden bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* --- 1. BACKGROUND LAYER --- */}
      <AuroraBackground />

      {/* --- 2. HEADER / NAV (Compact padding) --- */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center shrink-0">
         {/* System Badge */}
         <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-sm">
            <School size={12} className="text-slate-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Official Portal v2.0
            </span>
         </div>

         {/* Back to Menu Button */}
         <Link to="/" className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white/80 backdrop-blur-md rounded-full border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
                <ArrowLeft size={12} className="text-slate-600" />
            </div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Back to Menu</span>
         </Link>
      </header>

      {/* --- 3. MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-5xl mx-auto">
        
        {/* HERO SECTION (Compact) */}
        <div className="flex flex-col items-center mb-6 md:mb-8 animate-fade-in-down w-full max-w-3xl text-center">
          
          {/* Animated Logo Container - Smaller Size */}
          <div className="relative group mb-4 md:mb-6">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative w-16 h-16 md:w-24 md:h-24 bg-white/70 backdrop-blur-2xl rounded-[1.25rem] md:rounded-[1.75rem] flex items-center justify-center p-3 shadow-2xl shadow-indigo-100/60 border border-white transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
               <img src="/1.png" alt="SRCS Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
          </div>

          {/* Titles - Reduced spacing and size */}
          <div className="space-y-1 drop-shadow-sm px-4">
            <h2 className="font-bold text-slate-500 text-[10px] md:text-xs tracking-[0.2em] uppercase animate-fade-in bg-white/40 backdrop-blur-md inline-block px-3 py-1 rounded-full border border-white/60">
              San Ramon Catholic School, Inc.
            </h2>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight pt-1">
              Enrollment <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">Portal</span>
            </h1>
            <p className="text-slate-500 font-medium text-xs md:text-sm max-w-md mx-auto pt-2 leading-relaxed line-clamp-2 md:line-clamp-none">
              The official digital gateway for academic registration and student records.
            </p>
          </div>

        </div>

        {/* ACTION CARDS GRID - Compact & Aesthetic */}
        <div className="w-full max-w-4xl px-2 animate-fade-in-up delay-100 space-y-3 md:space-y-4">
            
            {/* Top Row: Main Actions (Reduced Padding & Gap) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                
                {/* OPTION 1: ENROLL */}
                <Link to="/enroll" className="group relative overflow-hidden rounded-[2rem] p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-indigo-100/30 hover:shadow-2xl hover:shadow-indigo-200/50 active:scale-[0.98]">
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-0 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-indigo-200/40 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 h-full">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white/80 rounded-2xl flex items-center justify-center text-indigo-600 md:mb-4 border border-white shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0">
                            <UserPlus size={24} className="md:w-7 md:h-7" strokeWidth={2} />
                        </div>
                        
                        <div className="flex-1 text-left">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 md:mb-1 group-hover:text-indigo-700 transition-colors">Enroll Learner</h2>
                            <p className="text-slate-500 text-[10px] md:text-xs font-medium leading-relaxed md:mb-4 hidden md:block">
                            Register a new student or update an existing record for the upcoming school year.
                            </p>
                            <p className="text-slate-500 text-xs font-medium md:hidden">Start new application</p>
                        </div>
                        
                        <div className="hidden md:flex mt-auto w-full items-center justify-between pt-3 border-t border-slate-200/50 group-hover:border-indigo-100 transition-colors">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Proceed</span>
                            <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-indigo-600 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
                                <ChevronRight size={14} className="text-slate-400 group-hover:text-white" />
                            </div>
                        </div>
                        <div className="md:hidden text-slate-300 group-hover:text-indigo-600">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                </Link>

                {/* OPTION 2: ADMIN */}
                <Link to="/admin" className="group relative overflow-hidden rounded-[2rem] p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-slate-300/50 active:scale-[0.98]">
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-0 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-slate-200/50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 h-full">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white/80 rounded-2xl flex items-center justify-center text-slate-600 md:mb-4 border border-white shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0">
                            <ShieldCheck size={24} className="md:w-7 md:h-7" strokeWidth={2} />
                        </div>
                        
                        <div className="flex-1 text-left">
                            <h2 className="text-lg md:text-xl font-black text-slate-900 md:mb-1 group-hover:text-slate-700 transition-colors">Admin Portal</h2>
                            <p className="text-slate-500 text-[10px] md:text-xs font-medium leading-relaxed md:mb-4 hidden md:block">
                            Authorized faculty login to manage enrollments, grades, and records.
                            </p>
                            <p className="text-slate-500 text-xs font-medium md:hidden">Faculty login only</p>
                        </div>
                        
                        <div className="hidden md:flex mt-auto w-full items-center justify-between pt-3 border-t border-slate-200/50 group-hover:border-slate-200 transition-colors">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">Secure Login</span>
                            <div className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-slate-800 flex items-center justify-center transition-all duration-300 group-hover:translate-x-1">
                                <LogIn size={14} className="text-slate-400 group-hover:text-white" />
                            </div>
                        </div>
                        <div className="md:hidden text-slate-300 group-hover:text-slate-600">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                </Link>

            </div>

            {/* Bottom Row: TRACKING FEATURE (Slimmer) */}
            <button 
                onClick={() => setIsTrackOpen(true)}
                className="w-full group relative overflow-hidden rounded-[2rem] p-4 md:p-5 transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-md border border-white shadow-lg hover:shadow-xl active:scale-[0.99] text-left"
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <FileText size={18} className="md:w-5 md:h-5" strokeWidth={2} />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">Already Submitted your Application?</h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Track your application status</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 rounded-full border border-white shadow-sm group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                        <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-emerald-600">Check Now</span>
                        <Search size={14} className="text-slate-400 group-hover:text-emerald-500" />
                    </div>
                </div>
            </button>
            
        </div>
      </div>

      {/* --- 4. FOOTER (Compact) --- */}
      <footer className="p-3 md:p-4 text-center border-t border-white/20 bg-white/40 backdrop-blur-md relative z-10 shrink-0">
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} SRCS Official System
        </p>
      </footer>

      {/* TRACKING MODAL */}
      <TrackingModal isOpen={isTrackOpen} onClose={() => setIsTrackOpen(false)} />
    </div>
  );
};

export default LandingPage;