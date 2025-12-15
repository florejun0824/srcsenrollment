// src/pages/PortalPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    GraduationCap, 
    Wallet, 
    FileText, 
    Calendar, 
    Clock, 
    ChevronRight, 
    ShieldCheck, 
    AlertTriangle, 
    Lock, 
    X,
    MonitorPlay
} from 'lucide-react';

// --- CONFIGURATION ---
const URLS = {
    lms: "https://srcslms.vercel.app/",
    finance: "https://srcsledger.netlify.app/"
};

const getAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); 
    const startYear = currentMonth >= 5 ? currentYear : currentYear - 1;
    return `${startYear} - ${startYear + 1}`;
};

// --- SYSTEM CARDS DATA ---
const SYSTEM_CARDS = [
    {
        id: 'enrollment',
        title: 'Enrollment System',
        description: 'New students and transferees start here. Begin your official registration journey.',
        icon: <GraduationCap className="w-10 h-10" />,
        linkTo: '/enrollment-landing', // Direct Route
        theme: {
            color: 'from-red-600 to-rose-900',
            border: 'group-hover:border-red-500/50',
            shadow: 'hover:shadow-red-900/40',
            iconBg: 'bg-red-500/20 text-red-200',
            badge: { text: 'Open for Registration', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
        }
    },
    {
        id: 'lms',
        title: 'LMS Portal',
        description: 'Access your virtual classrooms, modules, and grading sheets.',
        icon: <MonitorPlay className="w-10 h-10" />,
        actionId: 'lms', // Trigger Modal
        isBeta: true,
        theme: {
            color: 'from-blue-600 to-indigo-900',
            border: 'group-hover:border-blue-500/50',
            shadow: 'hover:shadow-blue-900/40',
            iconBg: 'bg-blue-500/20 text-blue-200',
            badge: { text: 'Beta Environment', style: 'bg-amber-500/20 text-amber-300 border-amber-500/30' }
        }
    },
    {
        id: 'finance',
        title: 'Finance & Ledger',
        description: 'Manage student accounts, tuition fees, and payment history.',
        icon: <Wallet className="w-10 h-10" />,
        actionId: 'finance', // Trigger Modal
        theme: {
            color: 'from-emerald-600 to-teal-900',
            border: 'group-hover:border-emerald-500/50',
            shadow: 'hover:shadow-emerald-900/40',
            iconBg: 'bg-emerald-500/20 text-emerald-200',
            badge: { text: 'Authorized Personnel', style: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
        }
    },
	{
	        id: 'records',
	        title: 'Academic Records',
	        description: 'View your official grades and academic history. (Student Login Required)',
	        icon: <FileText className="w-10 h-10" />,
	        linkTo: '/student-portal', // <--- Update this link to the new Student Portal route
	        isDisabled: false,         // <--- Change this to false to enable the button
	        theme: {
	            color: 'from-slate-600 to-slate-900',
	            border: 'group-hover:border-slate-500/50',
	            shadow: 'hover:shadow-slate-900/40',
	            iconBg: 'bg-slate-500/20 text-slate-300',
	            badge: { text: 'Student Access', style: 'bg-slate-700/50 text-slate-300 border-slate-600' } // Updated badge
	        }
	    }
];

// --- COMPONENTS ---

const HeaderWidget = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group min-w-[140px]">
        <div className="p-2 bg-white/5 rounded-xl text-slate-400 group-hover:text-white transition-colors">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-sm font-black text-white leading-none tracking-wide">{value}</p>
        </div>
    </div>
);

const SystemCard = ({ item, onAction }) => {
    // Determine Component Type
    const Wrapper = item.linkTo ? Link : 'div';
    
    // FIX: Pass 'true' to onAction to ensure modal opens
    const props = item.linkTo 
        ? { to: item.linkTo } 
        : { onClick: () => onAction(item.actionId, true) };

    return (
        <Wrapper 
            {...props}
            className={`
                group relative overflow-hidden rounded-[2.5rem] bg-slate-900/60 backdrop-blur-xl border border-white/5 p-8 
                transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer text-left w-full
                ${item.theme.border} ${item.theme.shadow} flex flex-col h-full
            `}
        >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.theme.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-8">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500 ${item.theme.iconBg}`}>
                        {item.icon}
                    </div>
                    {item.theme.badge && (
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${item.theme.badge.style}`}>
                            {item.theme.badge.text}
                        </span>
                    )}
                </div>

                <h3 className="text-2xl font-black text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all">
                    {item.title}
                </h3>
                
                <p className="text-sm text-slate-400 font-medium leading-relaxed mb-10 group-hover:text-slate-300 transition-colors">
                    {item.description}
                </p>

                <div className="mt-auto flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest opacity-70 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                    <span>{item.isDisabled ? 'Under Development' : 'Access Portal'}</span>
                    {!item.isDisabled && <ChevronRight className="w-4 h-4" />}
                </div>
            </div>
        </Wrapper>
    );
};

const Modal = ({ isOpen, onClose, title, icon: Icon, colorTheme, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose} />
            <div className="relative bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up border border-white/10">
                <div className={`p-6 border-b border-white/5 flex items-center gap-4 ${colorTheme}`}>
                    <div className="p-3 bg-white/20 rounded-xl shadow-sm backdrop-blur-sm text-white">
                        <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
                    <button onClick={onClose} className="ml-auto p-2 hover:bg-white/10 rounded-full transition text-white/70 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
const PortalPage = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [modals, setModals] = useState({ lms: false, finance: false, records: false });
    const [academicYear, setAcademicYear] = useState('');

    useEffect(() => {
        setAcademicYear(getAcademicYear());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Helper to toggle modals
    const toggleModal = (type, show) => setModals(prev => ({ ...prev, [type]: show }));

    const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="min-h-screen bg-[#020617] relative overflow-hidden font-sans text-slate-200 selection:bg-red-500 selection:text-white">
            
            {/* BACKGROUND */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-slate-950" />
                <img src="/2.png" alt="Portal Background" className="absolute inset-0 w-full h-full object-cover opacity-40 animate-pulse-slow" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/60 to-slate-950/90" />
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
            </div>

            {/* --- MODALS --- */}
            
            {/* LMS Warning Modal */}
            <Modal isOpen={modals.lms} onClose={() => toggleModal('lms', false)} title="Beta Environment" icon={AlertTriangle} colorTheme="bg-gradient-to-r from-blue-600 to-indigo-900">
                <p className="text-slate-400 leading-relaxed mb-8 text-sm">
                    You are entering the LMS <strong>Beta Environment</strong>. Features are currently being tested and you may experience occasional interruptions.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => toggleModal('lms', false)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-400 bg-white/5 hover:bg-white/10 transition border border-white/5">Cancel</button>
                    <button onClick={() => window.location.href = URLS.lms} className="flex-1 py-3.5 rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition">Proceed to LMS</button>
                </div>
            </Modal>

            {/* Finance Restricted Access Modal */}
            <Modal isOpen={modals.finance} onClose={() => toggleModal('finance', false)} title="Restricted Access" icon={Lock} colorTheme="bg-gradient-to-r from-red-600 to-rose-900">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-500/10 rounded-full text-rose-500 mb-4 border border-rose-500/20 animate-pulse">
                        <ShieldCheck size={40} />
                    </div>
                    <h4 className="font-bold text-white text-lg uppercase tracking-wider">Authorized Personnel Only</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed mb-8 text-center">
                    You are about to be redirected to the <strong>Bookkeeping System</strong>.<br/>Please proceed <strong>only</strong> if you are the school's official bookkeeper.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => toggleModal('finance', false)} className="flex-1 py-3.5 rounded-xl font-bold text-slate-400 bg-white/5 hover:bg-white/10 transition border border-white/5">Cancel</button>
                    <button onClick={() => window.location.href = URLS.finance} className="flex-1 py-3.5 rounded-xl font-bold bg-rose-600 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-500 transition">Access Ledger</button>
                </div>
            </Modal>

            {/* Records Coming Soon Modal */}
            <Modal isOpen={modals.records} onClose={() => toggleModal('records', false)} title="Under Maintenance" icon={Clock} colorTheme="bg-gradient-to-r from-slate-700 to-slate-800">
                <p className="text-slate-400 leading-relaxed mb-8 text-sm">
                    The <strong>Academic Records System</strong> is currently being built to serve you better. Please check back later.
                </p>
                <button onClick={() => toggleModal('records', false)} className="w-full py-3.5 rounded-xl font-bold bg-white text-slate-900 shadow-lg hover:bg-slate-200 transition">Return to Portal</button>
            </Modal>

            {/* --- HERO CONTENT --- */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center min-h-[90vh]">
                
                {/* HEADER */}
                <header className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 mb-20 animate-fade-in-down">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl shadow-2xl flex items-center justify-center p-4 border border-white/10 relative z-10 hover:bg-white/10 transition-all">
                                <img src="/1.png" alt="SRCS Logo" className="w-full h-full object-contain drop-shadow-lg" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none uppercase">
                                San Ramon <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Catholic School</span>
                            </h1>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-2 border-l-2 border-red-500 pl-3">Official Digital Portal</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        <HeaderWidget icon={<Calendar className="w-4 h-4" />} label="Today" value={formattedDate} />
                        <HeaderWidget icon={<Clock className="w-4 h-4" />} label="Time" value={formattedTime} />
                        <div className="hidden md:block">
                            <HeaderWidget icon={<GraduationCap className="w-4 h-4" />} label="School Year" value={academicYear} />
                        </div>
                    </div>
                </header>

                {/* HERO TEXT */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-amber-500">Destination</span>
                    </h2>
                    <p className="text-slate-400 font-medium text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
                        Welcome to the SRCS integrated ecosystem. Please select your designated portal below to proceed securely.
                    </p>
                </div>

                {/* CARDS GRID */}
                <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {SYSTEM_CARDS.map((card) => (
                        <SystemCard 
                            key={card.id} 
                            item={card} 
                            onAction={toggleModal} // FIX: Properly passes the handler
                        />
                    ))}
                </main>

                <footer className="mt-24 border-t border-white/5 pt-8 pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                        <div className="flex items-center justify-center gap-2 text-slate-500">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Secure SSL Connection • 256-bit Encryption</span>
                        </div>
                        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:text-slate-400 transition-colors cursor-default">
                            © {new Date().getFullYear()} SRCS System. All Rights Reserved.
                        </p>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default PortalPage;