// src/pages/PortalPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    GraduationCap, 
    Wallet, 
    FileText, 
    Calendar, 
    Clock, 
    ShieldCheck, 
    AlertTriangle, 
    Lock, 
    X,
    MonitorPlay,
    CalendarClock 
} from 'lucide-react';

// --- CONFIGURATION ---
const URLS = {
    lms: "https://srcsdigital.web.app/", // UPDATED URL
    finance: "https://srcsledger.netlify.app/",
    scheduler: "https://san-ramon-catholic-school.web.app/"
};

const getAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); 
    const startYear = currentMonth >= 5 ? currentYear : currentYear - 1;
    return `${startYear} - ${startYear + 1}`;
};

// --- SYSTEM CARDS DATA (Restored Original Details) ---
const SYSTEM_CARDS = [
    {
        id: 'enrollment',
        title: 'Enrollment System',
        description: 'New students and transferees start here. Begin your official registration journey.',
        icon: <GraduationCap className="w-10 h-10" />,
        linkTo: '/enrollment-landing', 
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
        actionId: 'lms', 
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
        actionId: 'finance', 
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
        linkTo: '/student-portal', 
        isDisabled: false,         
        theme: {
            color: 'from-slate-600 to-slate-900',
            border: 'group-hover:border-slate-500/50',
            shadow: 'hover:shadow-slate-900/40',
            iconBg: 'bg-slate-500/20 text-slate-300',
            badge: { text: 'Student Access', style: 'bg-slate-700/50 text-slate-300 border-slate-600' } 
        }
    },
    {
        id: 'scheduler',
        title: 'Smart Scheduler',
        description: 'Generate class schedules and manage subject loading for faculty members.',
        icon: <CalendarClock className="w-10 h-10" />,
        actionId: 'scheduler',
        theme: {
            color: 'from-orange-500 to-amber-700',
            border: 'group-hover:border-orange-500/50',
            shadow: 'hover:shadow-orange-900/40',
            iconBg: 'bg-orange-500/20 text-orange-200',
            badge: { text: 'Admin Beta', style: 'bg-orange-500/20 text-orange-300 border-orange-500/30' }
        }
    }
];

// --- COMPONENTS ---

const HeaderWidget = ({ icon, label, value }) => (
    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-2xl px-6 py-4 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all duration-300 group min-w-[160px] shadow-lg shadow-black/10">
        <div className="p-3 bg-white/5 rounded-2xl text-slate-400 group-hover:text-white transition-colors group-hover:scale-110 duration-300">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5">{label}</p>
            <p className="text-base font-black text-white leading-none tracking-wide">{value}</p>
        </div>
    </div>
);

const SystemCard = ({ item, onAction }) => {
    // Logic to handle External vs Internal links vs Actions
    const isExternal = item.linkTo && item.linkTo.startsWith('http');
    
    let Wrapper = 'div';
    let props = {};

    if (item.linkTo) {
        // Updated: Open in new tab
        props = { 
            target: '_blank',
            rel: 'noopener noreferrer'
        };

        if (isExternal) {
            Wrapper = 'a';
            props.href = item.linkTo;
        } else {
            Wrapper = Link;
            props.to = item.linkTo;
        }
    } else {
        props = { onClick: () => onAction(item.actionId, true) };
    }

    return (
        <Wrapper 
            {...props}
            className={`
                group relative overflow-hidden rounded-[3rem] bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-8 
                transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer text-left
                flex flex-col h-full min-h-[320px] w-full md:max-w-[calc(50%-1rem)] xl:max-w-[calc(33.33%-1rem)]
                ${item.theme.border} ${item.theme.shadow}
            `}
        >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.theme.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700 ease-out`}></div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-10">
                    <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-inner ${item.theme.iconBg}`}>
                        {item.icon}
                    </div>
                    {item.theme.badge && (
                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg ${item.theme.badge.style}`}>
                            {item.theme.badge.text}
                        </span>
                    )}
                </div>

                <h3 className="text-3xl font-black text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-400 transition-all tracking-tight">
                    {item.title}
                </h3>
                
                <p className="text-sm text-slate-400 font-medium leading-relaxed mb-12 group-hover:text-slate-300 transition-colors">
                    {item.description}
                </p>

                <div className="mt-auto flex items-center gap-3 text-xs font-bold text-white uppercase tracking-widest opacity-60 group-hover:opacity-100 group-hover:translate-x-3 transition-all duration-500">
                    <div className="w-8 h-[1px] bg-white/50 group-hover:w-12 transition-all duration-500" />
                    <span>{item.isDisabled ? 'Under Development' : 'Access Portal'}</span>
                </div>
            </div>
        </Wrapper>
    );
};

const Modal = ({ isOpen, onClose, title, icon: Icon, colorTheme, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl transition-opacity duration-500" onClick={onClose} />
            <div className="relative bg-slate-900/90 backdrop-blur-3xl rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up border border-white/10 ring-1 ring-white/5">
                <div className={`p-8 border-b border-white/5 flex items-center gap-5 ${colorTheme}`}>
                    <div className="p-4 bg-white/20 rounded-2xl shadow-sm backdrop-blur-sm text-white">
                        <Icon size={28} />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
                    <button onClick={onClose} className="ml-auto p-3 hover:bg-white/10 rounded-full transition text-white/70 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-10">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
const PortalPage = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [modals, setModals] = useState({ lms: false, finance: false, records: false, scheduler: false });
    const [academicYear, setAcademicYear] = useState('');

    useEffect(() => {
        setAcademicYear(getAcademicYear());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Helper to toggle modals
    const toggleModal = (type, show) => setModals(prev => ({ ...prev, [type]: show }));

    // NEW: Handle Proceed - Opens new tab and closes modal
    const handleProceed = (url, modalType) => {
        window.open(url, '_blank', 'noopener,noreferrer');
        toggleModal(modalType, false); // Close the modal immediately
    };

    const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="min-h-screen bg-[#020617] relative overflow-x-hidden font-sans text-slate-200 selection:bg-red-500 selection:text-white">
            
            {/* BACKGROUND */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-slate-950" />
                <img src="/2.png" alt="Portal Background" className="absolute inset-0 w-full h-full object-cover opacity-30 animate-pulse-slow" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-slate-950/90" />
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/20 rounded-full blur-[180px] animate-blob"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[180px] animate-blob animation-delay-2000"></div>
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-amber-500/10 rounded-full blur-[150px] animate-blob animation-delay-4000"></div>
            </div>

            {/* --- MODALS --- */}
            
            {/* LMS Warning Modal */}
            <Modal isOpen={modals.lms} onClose={() => toggleModal('lms', false)} title="Beta Environment" icon={AlertTriangle} colorTheme="bg-gradient-to-r from-blue-600 to-indigo-900">
                <p className="text-slate-400 leading-relaxed mb-8 text-base">
                    You are entering the LMS <strong>Beta Environment</strong>. Features are currently being tested and you may experience occasional interruptions.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => toggleModal('lms', false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-400 bg-white/5 hover:bg-white/10 transition border border-white/5">Cancel</button>
                    {/* Updated to use handleProceed */}
                    <button onClick={() => handleProceed(URLS.lms, 'lms')} className="flex-1 py-4 rounded-2xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition">Proceed to LMS</button>
                </div>
            </Modal>

            {/* Finance Restricted Access Modal */}
            <Modal isOpen={modals.finance} onClose={() => toggleModal('finance', false)} title="Restricted Access" icon={Lock} colorTheme="bg-gradient-to-r from-red-600 to-rose-900">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-rose-500/10 rounded-full text-rose-500 mb-4 border border-rose-500/20 animate-pulse">
                        <ShieldCheck size={48} />
                    </div>
                    <h4 className="font-bold text-white text-lg uppercase tracking-wider">Authorized Personnel Only</h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 text-center">
                    You are about to be redirected to the <strong>Bookkeeping System</strong>.<br/>Please proceed <strong>only</strong> if you are the school's official bookkeeper.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => toggleModal('finance', false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-400 bg-white/5 hover:bg-white/10 transition border border-white/5">Cancel</button>
                    {/* Updated to use handleProceed */}
                    <button onClick={() => handleProceed(URLS.finance, 'finance')} className="flex-1 py-4 rounded-2xl font-bold bg-rose-600 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-500 transition">Access Ledger</button>
                </div>
            </Modal>

            {/* SCHEDULER: Beta & Admin Restricted Modal */}
            <Modal isOpen={modals.scheduler} onClose={() => toggleModal('scheduler', false)} title="Restricted Beta Access" icon={Lock} colorTheme="bg-gradient-to-r from-orange-600 to-amber-700">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-orange-500/10 p-4 rounded-full mb-4 border border-orange-500/20">
                        <AlertTriangle className="w-8 h-8 text-orange-400" />
                    </div>
                    <h4 className="font-bold text-white text-lg uppercase tracking-wider text-center">Admin Access Only</h4>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-8 text-center">
                    You are accessing the <strong>Smart Scheduler (Beta)</strong>. This tool is currently in testing and is strictly for use by <strong>Administrators</strong> to create class schedules and teacher loads.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => toggleModal('scheduler', false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-400 bg-white/5 hover:bg-white/10 transition border border-white/5">Cancel</button>
                    {/* Updated to use handleProceed */}
                    <button onClick={() => handleProceed(URLS.scheduler, 'scheduler')} className="flex-1 py-4 rounded-2xl font-bold bg-orange-600 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-500 transition">Proceed</button>
                </div>
            </Modal>

            {/* Records Coming Soon Modal */}
            <Modal isOpen={modals.records} onClose={() => toggleModal('records', false)} title="Under Maintenance" icon={Clock} colorTheme="bg-gradient-to-r from-slate-700 to-slate-800">
                <p className="text-slate-400 leading-relaxed mb-8 text-base">
                    The <strong>Academic Records System</strong> is currently being built to serve you better. Please check back later.
                </p>
                <button onClick={() => toggleModal('records', false)} className="w-full py-4 rounded-2xl font-bold bg-white text-slate-900 shadow-lg hover:bg-slate-200 transition">Return to Portal</button>
            </Modal>

            {/* --- HERO CONTENT --- */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center min-h-[90vh]">
                
                {/* HEADER */}
                <header className="flex flex-col md:flex-row items-center md:items-end justify-between gap-10 mb-24 animate-fade-in-down">
                    <div className="flex items-center gap-8">
                        <div className="relative group cursor-default">
                            <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                            <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-[2rem] shadow-2xl flex items-center justify-center p-5 border border-white/10 relative z-10 hover:bg-white/10 transition-all hover:scale-105 duration-500">
                                <img src="/1.png" alt="SRCS Logo" className="w-full h-full object-contain drop-shadow-lg" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none uppercase drop-shadow-2xl">
                                San Ramon <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">Catholic School</span>
                            </h1>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.35em] mt-3 border-l-4 border-red-500 pl-4 py-1">Official Digital Portal</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        <HeaderWidget icon={<Calendar className="w-5 h-5" />} label="Today" value={formattedDate} />
                        <HeaderWidget icon={<Clock className="w-5 h-5" />} label="Time" value={formattedTime} />
                        <div className="hidden lg:block">
                            <HeaderWidget icon={<GraduationCap className="w-5 h-5" />} label="School Year" value={academicYear} />
                        </div>
                    </div>
                </header>

                {/* HERO TEXT */}
                <div className="text-center mb-20 animate-fade-in-up">
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-8 drop-shadow-2xl">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-amber-500">Destination</span>
                    </h2>
                    <p className="text-slate-400 font-medium text-base md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Welcome to the SRCS Digital Ecosystem. Please select your designated portal below to proceed securely.
                    </p>
                </div>

                {/* CARDS GRID */}
                <main className="flex flex-wrap justify-center gap-6 mb-auto animate-fade-in-up pb-12" style={{ animationDelay: '0.1s' }}>
                    {SYSTEM_CARDS.map((card) => (
                        <SystemCard 
                            key={card.id} 
                            item={card} 
                            onAction={toggleModal} 
                        />
                    ))}
                </main>

                <footer className="mt-12 border-t border-white/5 pt-10 pb-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left opacity-60 hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-center gap-3 text-slate-500">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">Secure SSL Connection • 256-bit Encryption</span>
                        </div>
                        <p className="text-slate-600 text-[11px] font-bold uppercase tracking-widest">
                            © {new Date().getFullYear()} SRCS System. All Rights Reserved.
                        </p>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default PortalPage;