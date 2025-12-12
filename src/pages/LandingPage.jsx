// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// --- INLINE ICONS ---
const Icons = {
    UserPlus: () => <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    ShieldLock: () => <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><rect x="8" y="10" width="8" height="6" rx="1" fill="currentColor" fillOpacity="0.2" /><path d="M10 10V8a2 2 0 1 1 4 0v2"/></svg>,
    ArrowLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#020617] flex flex-col relative overflow-hidden font-sans text-slate-200 selection:bg-red-500 selection:text-white">
      
      {/* --- BACKGROUND IMAGE --- */}
      <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-slate-950" />
          <img 
              src="/2.png" 
              alt="Background" 
              className="absolute inset-0 w-full h-full object-cover opacity-60" 
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-slate-950/90" />
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-12 animate-fade-in-down w-full">
          
          {/* Logo + School Name Stacked & Centered */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 rounded-2xl flex items-center justify-center p-3 border border-white/20 shadow-xl backdrop-blur-md">
               <img src="/1.png" alt="SRCS Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <span className="font-bold text-slate-300 text-sm md:text-lg tracking-[0.2em] uppercase text-center leading-relaxed max-w-md">
              San Ramon Catholic School, Inc.
            </span>
          </div>

          {/* System Title */}
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-wide drop-shadow-xl">
              ENROLLMENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-400">SYSTEM</span>
            </h1>
          </div>

        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4 animate-fade-in-up">
          
          {/* OPTION 1: ENROLL (Student) */}
          <Link to="/enroll" className="group relative overflow-hidden rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-2 border border-red-500/30 bg-gradient-to-br from-red-600 to-[#800000] shadow-2xl shadow-red-900/30 hover:shadow-red-600/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-0 group-hover:opacity-10 blur-[80px] rounded-full transition-opacity duration-500 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex flex-col h-full items-start text-left">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-5 shadow-inner">
                <Icons.UserPlus />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Enroll Learner</h2>
              <p className="text-red-100/80 text-sm font-medium leading-relaxed mb-6 max-w-sm">
                Register a new student or update an existing record for the upcoming school year.
              </p>
              <div className="mt-auto flex items-center gap-2 text-white font-bold text-[10px] md:text-xs uppercase tracking-widest bg-black/20 px-4 py-2 rounded-xl border border-white/10 group-hover:bg-white group-hover:text-red-900 transition-colors">
                Proceed to Form <Icons.ArrowRight />
              </div>
            </div>
          </Link>

          {/* OPTION 2: ADMIN (Staff) */}
          <Link to="/admin" className="group relative overflow-hidden rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-2 border border-slate-600/50 bg-gradient-to-br from-slate-800 to-slate-950 shadow-2xl shadow-black/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 opacity-0 group-hover:opacity-5 blur-[80px] rounded-full transition-opacity duration-500 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex flex-col h-full items-start text-left">
              <div className="w-14 h-14 bg-slate-700/50 backdrop-blur-md rounded-2xl flex items-center justify-center text-slate-300 mb-5 shadow-inner border border-white/5">
                <Icons.ShieldLock />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Admin Portal</h2>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6 max-w-sm">
                Authorized personnel login to manage enrollments and view student records.
              </p>
              <div className="mt-auto flex items-center gap-2 text-slate-300 font-bold text-[10px] md:text-xs uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                Enter Dashboard <Icons.ArrowRight />
              </div>
            </div>
          </Link>

        </div>

        {/* Enhanced Back Button */}
        <Link to="/" className="group mt-16 relative flex items-center gap-3 px-8 py-3 rounded-full bg-slate-800/40 hover:bg-slate-700/60 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all duration-300 shadow-lg hover:shadow-slate-700/20">
            <div className="p-1.5 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors group-hover:-translate-x-1 transform duration-300">
              <Icons.ArrowLeft />
            </div>
            <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors">
                Return to Portal
            </span>
        </Link>
      </div>

      {/* Footer */}
      <footer className="p-8 text-center border-t border-white/5 bg-slate-950/50 backdrop-blur-sm relative z-10">
        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} SRCS Official Enrollment System. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;