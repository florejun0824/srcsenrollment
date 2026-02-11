import React, { useState, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { 
    UserPlus, ShieldCheck, ChevronRight, LogIn, ArrowLeft, School,
    Search, FileText, Loader2
} from 'lucide-react';

// --- OPTIMIZATION: LAZY LOAD TRACKING MODAL ---
// We use React.lazy so the heavy PDF library inside TrackingModal 
// is ONLY downloaded when the user clicks the "Check Now" button.
const TrackingModal = React.lazy(() => import('../components/TrackingModal'));

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

// --- LANDING PAGE COMPONENT DEFINITION ---
const LandingPage = () => {
  const [isTrackOpen, setIsTrackOpen] = useState(false);

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-slate-800 overflow-x-hidden bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      <AuroraBackground />

      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center shrink-0">
         <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-sm">
            <School size={12} className="text-slate-500" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Official Portal v2.0
            </span>
         </div>

         <Link to="/" className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white/80 backdrop-blur-md rounded-full border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
                <ArrowLeft size={12} className="text-slate-600" />
            </div>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Back to Menu</span>
         </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-5xl mx-auto">
        <div className="flex flex-col items-center mb-6 md:mb-8 animate-fade-in-down w-full max-w-3xl text-center">
          <div className="relative group mb-4 md:mb-6">
            <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative w-16 h-16 md:w-24 md:h-24 bg-white/70 backdrop-blur-2xl rounded-[1.25rem] md:rounded-[1.75rem] flex items-center justify-center p-3 shadow-2xl shadow-indigo-100/60 border border-white transform transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
               <img src="/1.png" alt="SRCS Logo" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
          </div>
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

        <div className="w-full max-w-4xl px-2 animate-fade-in-up delay-100 space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <Link to="/enroll" className="group relative overflow-hidden rounded-[2rem] p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-indigo-100/30 hover:shadow-2xl hover:shadow-indigo-200/50 active:scale-[0.98]">
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-0 pointer-events-none" />
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
                    </div>
                </Link>

                <Link to="/admin" className="group relative overflow-hidden rounded-[2rem] p-5 md:p-6 transition-all duration-300 hover:-translate-y-1 bg-white/60 backdrop-blur-xl border border-white shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:shadow-slate-300/50 active:scale-[0.98]">
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-0 pointer-events-none" />
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
                    </div>
                </Link>
            </div>

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

      <footer className="p-3 md:p-4 text-center border-t border-white/20 bg-white/40 backdrop-blur-md relative z-10 shrink-0">
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} SRCS Official System
        </p>
      </footer>

      {/* --- INTEGRATION: RENDER WITH SUSPENSE --- */}
      <Suspense fallback={
          <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 border border-slate-100">
                  <Loader2 className="animate-spin text-indigo-600" size={24} />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Loading Tracker...</span>
              </div>
          </div>
      }>
        {isTrackOpen && (
            <TrackingModal isOpen={isTrackOpen} onClose={() => setIsTrackOpen(false)} />
        )}
      </Suspense>
    </div>
  );
};

export default LandingPage;