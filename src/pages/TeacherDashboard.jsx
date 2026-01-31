// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    House, 
    Student, 
    ChalkboardTeacher, 
    SignOut, 
    List, 
    X, 
    MagnifyingGlass, 
    Bell, 
    CaretRight,
    TrendUp,
    Users,
    Sparkle,
    SquaresFour // New icon for Back to Menu
} from '@phosphor-icons/react';

// FIREBASE
import { db, auth } from '../firebase';
import { collection, getCountFromServer } from 'firebase/firestore'; 
import { onAuthStateChanged } from 'firebase/auth';

// --- IMPORT MODULES ---
import AcademicAccountManager from './AcademicAccountManager'; 
import GradebookManager from './GradebookManager'; 

// --- STYLES ---
const styles = `
  .neural-glass {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 
        0 10px 40px -10px rgba(0,0,0,0.05),
        0 0 0 1px rgba(255,255,255,0.3) inset;
  }
  .sidebar-transition {
    transition: width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1.0);
    will-change: width;
  }
  .mac-scrollbar::-webkit-scrollbar { width: 0px; }
`;

// --- COMPONENT: ISOLATED CLOCK ---
const TimeDisplay = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000); 
        return () => clearInterval(timer);
    }, []);

    const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(' AM', '').replace(' PM', '');
    const amPm = time.toLocaleTimeString([], { hour12: true }).slice(-2);
    const dateString = time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return (
        <div className="flex flex-col">
             <h2 className="text-3xl lg:text-4xl font-thin tracking-tighter text-slate-800 leading-[0.9]">
                {timeString}
                <span className="text-xs lg:text-sm font-bold text-indigo-500 ml-1">{amPm}</span>
             </h2>
             <div className="flex items-center gap-2 mt-1">
                <div className="h-[2px] w-6 bg-indigo-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {dateString}
                </span>
             </div>
        </div>
    );
};

// --- COMPONENT: CINEMATIC SIDEBAR ---
const AestheticSidebar = ({ activeTab, setActiveTab, onLogout, onBackToMenu }) => {
    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: House },
        { id: 'accounts', label: 'Students', icon: Student },
        { id: 'grades', label: 'Gradebook', icon: ChalkboardTeacher },
    ];

    return (
        <div className="hidden lg:block relative h-[calc(100vh-32px)] my-4 ml-4 w-[88px] shrink-0 z-50">
            <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="absolute top-0 left-0 bottom-0 flex flex-col w-full hover:w-[260px] rounded-[32px] sidebar-transition group overflow-hidden neural-glass bg-white/80"
            >
                {/* Brand Logo */}
                <div className="h-28 flex items-center px-7 overflow-hidden whitespace-nowrap shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
                        <Student size={24} weight="fill" />
                    </div>
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-75">
                        <h1 className="font-bold text-base text-slate-800 leading-tight">Admin<span className="text-indigo-600">Portal</span></h1>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty Access</span>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 flex flex-col gap-2 px-4 py-2">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className="relative flex items-center h-14 rounded-2xl group/item cursor-pointer overflow-hidden transition-all duration-200 hover:bg-slate-50"
                            >
                                <div className="min-w-[3.5rem] h-full flex justify-center items-center z-10">
                                    <item.icon 
                                        size={24} 
                                        weight={isActive ? "fill" : "duotone"} 
                                        className={`transition-all duration-300 ${isActive ? 'text-indigo-600 scale-110 drop-shadow-md' : 'text-slate-400 group-hover/item:text-slate-600'}`}
                                    />
                                </div>
                                <div className="flex-1 flex items-center pr-4 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                    <span className={`text-sm font-medium tracking-wide ${isActive ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                                        {item.label}
                                    </span>
                                </div>
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeStrip"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 shrink-0 pb-6 space-y-2">
                     <button onClick={onBackToMenu} className="flex items-center w-full h-12 rounded-2xl hover:bg-slate-50 transition-colors group/btn overflow-hidden">
                         <div className="min-w-[3.5rem] flex justify-center items-center">
                            {/* UPDATED ICON: SquaresFour */}
                            <SquaresFour size={20} weight="duotone" className="text-slate-400 group-hover/btn:text-slate-600" />
                         </div>
                         <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium text-slate-500">
                             Back to Menu
                         </div>
                     </button>
                     <button onClick={onLogout} className="flex items-center w-full h-12 rounded-2xl hover:bg-red-50 transition-colors group/btn overflow-hidden">
                         <div className="min-w-[3.5rem] flex justify-center items-center">
                            <SignOut size={20} weight="duotone" className="text-slate-400 group-hover/btn:text-red-500" />
                         </div>
                         <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-sm font-medium text-slate-500 group-hover/btn:text-red-600">
                             Sign Out
                         </div>
                     </button>
                </div>
            </motion.div>
        </div>
    );
};

const TeacherDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [greeting, setGreeting] = useState('');
    const [studentCount, setStudentCount] = useState(0);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // --- INITIALIZATION ---
    useEffect(() => {
        // Set Greeting
        const h = new Date().getHours();
        setGreeting(h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening');

        // Auth Listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        // Fetch ACTUAL Student Count
        const fetchCount = async () => {
            try {
                const coll = collection(db, "student_accounts");
                const snapshot = await getCountFromServer(coll);
                setStudentCount(snapshot.data().count);
            } catch (err) {
                console.error("Error fetching student count:", err);
                setStudentCount(0);
            }
        };
        fetchCount();

        return () => unsubscribe();
    }, []);

    // --- HANDLERS ---
    const handleLogout = () => navigate('/'); 
    const handleBackToMenu = () => navigate('/student-portal');

    // --- WIDGETS ---
    const StatWidget = ({ icon: Icon, label, value, trend, trendUp, colorClass, delay }) => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden h-full flex flex-col justify-center"
        >
            <div className={`absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity transform scale-150 ${colorClass}`}>
                <Icon size={64} weight="duotone" />
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorClass} bg-opacity-10 text-opacity-100`}>
                <Icon size={20} weight="fill" className={colorClass.replace('bg-', 'text-')} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
            {trend && (
                <div className={`flex items-center gap-1 mt-3 text-[10px] font-bold ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    <TrendUp size={12} weight="bold" className={trendUp ? '' : 'rotate-180'} />
                    <span>{trend}</span>
                </div>
            )}
        </motion.div>
    );

    return (
        <div className="flex h-screen bg-[#F8F9FC] font-sans overflow-hidden selection:bg-indigo-100 text-slate-900 relative">
            <style>{styles}</style>

            {/* --- 0. BACKGROUND AURORA (Updated visibility) --- */}
            {/* Increased opacity and saturation for better visibility */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-300/40 blur-[100px]" />
                <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-fuchsia-300/40 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-cyan-200/50 blur-[100px]" />
            </div>

            {/* 1. CINEMATIC SIDEBAR (DESKTOP) */}
            <AestheticSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onLogout={handleLogout} 
                onBackToMenu={handleBackToMenu} 
            />

            {/* 2. MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden z-10">
                
                {/* HEADER (DESKTOP) */}
                <header className="hidden lg:flex items-center justify-between px-8 py-6 h-24 shrink-0 z-30 pointer-events-none">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col justify-center h-full pointer-events-auto"
                    >
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                            <span>Workspace</span>
                            <CaretRight size={10} weight="bold" />
                            <span className="text-indigo-600">{activeTab}</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            Teacher Dashboard
                        </h2>
                    </motion.div>

                    <div className="flex items-center gap-4 pointer-events-auto">
                        <div className="relative group">
                            <MagnifyingGlass size={16} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-64 shadow-sm"
                            />
                        </div>
                        <button className="p-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-slate-500 hover:text-indigo-600 shadow-sm transition-all hover:scale-105 active:scale-95 relative">
                            <Bell size={20} weight="bold" />
                            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                        </button>
                    </div>
                </header>

                {/* HEADER (MOBILE) */}
                <header className="lg:hidden flex items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                            <Student size={18} weight="fill" />
                        </div>
                        <span className="font-bold text-slate-900">AdminPortal</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600">
                        <List size={24} weight="bold" />
                    </button>
                </header>

                {/* SCROLLABLE VIEWPORT */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:px-8 pb-40 lg:pb-8 relative">
                    <AnimatePresence mode="wait">
                        
                        {activeTab === 'overview' && (
                            <motion.div 
                                key="overview"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-7xl mx-auto space-y-6"
                            >
                                {/* --- TOP SECTION: GREETING & CLOCK CARD --- */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-48">
                                    
                                    {/* CLOCK & GREETING CARD */}
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="lg:col-span-2 relative p-6 rounded-[2rem] bg-white/60 backdrop-blur-md border border-white/40 overflow-hidden shadow-xl flex flex-col justify-between group"
                                    >
                                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0" />
                                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors duration-700" />
                                        
                                        <div className="relative z-10 flex justify-between items-start">
                                            <TimeDisplay />
                                            <div className="hidden sm:flex p-2 rounded-full bg-slate-50 border border-slate-100">
                                                <Sparkle className="w-4 h-4 text-indigo-500 animate-pulse" weight="fill" />
                                            </div>
                                        </div>

                                        <div className="relative z-10 mt-4">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                                                {greeting},
                                            </h3>
                                            <h1 className="text-2xl sm:text-3xl font-serif italic font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 leading-tight">
                                                Faculty Member
                                            </h1>
                                        </div>
                                    </motion.div>

                                    {/* STATS COLUMN (Enrolled Students) */}
                                    <StatWidget 
                                        icon={Users} 
                                        label="Enrolled Students" 
                                        value={studentCount.toLocaleString()} 
                                        trend="+Active" 
                                        trendUp={true} 
                                        colorClass="bg-indigo-500 text-indigo-600"
                                        delay={0.1}
                                    />
                                </div>

                                {/* --- MIDDLE SECTION: REDESIGNED ACTION CARDS --- */}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    {/* CARD 1: MANAGE STUDENTS (Indigo/Blue Theme) */}
                                    <motion.button 
                                        onClick={() => setActiveTab('accounts')} 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-blue-600 text-white p-8 shadow-xl shadow-indigo-200 text-left group"
                                    >
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-x-10 -translate-y-10" />
                                        
                                        <div className="relative z-10 flex items-start justify-between">
                                            <div>
                                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-6">
                                                    <Student size={32} weight="duotone" />
                                                </div>
                                                <h3 className="text-2xl font-black tracking-tight mb-1">Manage Students</h3>
                                                <p className="text-indigo-100 text-sm font-medium">View directory & edit accounts</p>
                                            </div>
                                            
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-indigo-600 transition-all duration-300">
                                                <CaretRight size={20} weight="bold" />
                                            </div>
                                        </div>
                                    </motion.button>

                                    {/* CARD 2: INPUT GRADES (Emerald/Teal Theme) */}
                                    <motion.button 
                                        onClick={() => setActiveTab('grades')} 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-8 shadow-xl shadow-emerald-200 text-left group"
                                    >
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-x-10 -translate-y-10" />
                                        
                                        <div className="relative z-10 flex items-start justify-between">
                                            <div>
                                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-6">
                                                    <ChalkboardTeacher size={32} weight="duotone" />
                                                </div>
                                                <h3 className="text-2xl font-black tracking-tight mb-1">Input Grades</h3>
                                                <p className="text-emerald-50 text-sm font-medium">Quarterly grading sheet</p>
                                            </div>
                                            
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-teal-600 transition-all duration-300">
                                                <CaretRight size={20} weight="bold" />
                                            </div>
                                        </div>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'accounts' && (
                            <motion.div 
                                key="accounts"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full"
                            >
                                <AcademicAccountManager />
                            </motion.div>
                        )}

                        {activeTab === 'grades' && (
                            <motion.div 
                                key="grades"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full"
                            >
                                <GradebookManager />
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </main>

            {/* 3. MOBILE BOTTOM NAV (Glass Dock) */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="neural-glass rounded-full px-6 py-3 flex items-center gap-8 shadow-2xl">
                    <button onClick={() => setActiveTab('overview')} className={`transition-colors ${activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <House size={24} weight={activeTab === 'overview' ? "fill" : "duotone"} />
                    </button>
                    <button onClick={() => setActiveTab('accounts')} className={`transition-colors ${activeTab === 'accounts' ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <Student size={24} weight={activeTab === 'accounts' ? "fill" : "duotone"} />
                    </button>
                    <button onClick={() => setActiveTab('grades')} className={`transition-colors ${activeTab === 'grades' ? 'text-indigo-600' : 'text-slate-400'}`}>
                        <ChalkboardTeacher size={24} weight={activeTab === 'grades' ? "fill" : "duotone"} />
                    </button>
                </div>
            </div>

            {/* MOBILE MENU OVERLAY */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-slate-900/60 z-[60] backdrop-blur-sm lg:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-3/4 max-w-sm bg-white z-[70] p-6 shadow-2xl lg:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-lg font-black text-slate-900">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
                            </div>
                            <div className="space-y-2">
                                <button onClick={handleBackToMenu} className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 text-slate-700 font-bold">
                                    <SquaresFour size={20} /> Back to Portal
                                </button>
                                <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 font-bold">
                                    <SignOut size={20} /> Log Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeacherDashboard;