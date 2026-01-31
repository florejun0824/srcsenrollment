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
    CalendarClock,
    Rocket
} from 'lucide-react';

// IMPORT THE NEW COMPONENT
import Roadmap from './Roadmap';

// --- CONFIGURATION ---
const URLS = {
    lms: "https://srcsdigital.web.app/",
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

// --- SYSTEM CARDS DATA ---
const SYSTEM_CARDS = [
    {
        id: 'enrollment',
        title: 'Enrollment System',
        description: 'New students and transferees start here. Begin registration.',
        icon: <GraduationCap className="w-6 h-6 md:w-8 md:h-8" />,
        linkTo: '/enrollment-landing', 
        theme: {
            accent: 'text-rose-700',
            baseGradient: 'bg-gradient-to-br from-rose-100 via-rose-50 to-white', 
            border: 'border-rose-200 hover:border-rose-300',
            shadow: 'hover:shadow-rose-200/60',
            iconBg: 'bg-rose-200 text-rose-700',
            badge: { text: 'Open Now', style: 'bg-rose-100 text-rose-800 border-rose-200' }
        }
    },
    {
        id: 'lms',
        title: 'LMS Portal',
        description: 'Virtual classrooms, modules, and grading sheets.',
        icon: <MonitorPlay className="w-6 h-6 md:w-8 md:h-8" />,
        actionId: 'lms', 
        isBeta: true,
        theme: {
            accent: 'text-blue-700',
            baseGradient: 'bg-gradient-to-br from-blue-100 via-blue-50 to-white',
            border: 'border-blue-200 hover:border-blue-300',
            shadow: 'hover:shadow-blue-200/60',
            iconBg: 'bg-blue-200 text-blue-700',
            badge: { text: 'Beta Access', style: 'bg-blue-100 text-blue-800 border-blue-200' }
        }
    },
    {
        id: 'finance',
        title: 'Finance & Ledger',
        description: 'Student accounts, tuition fees, and payments.',
        icon: <Wallet className="w-6 h-6 md:w-8 md:h-8" />,
        actionId: 'finance', 
        theme: {
            accent: 'text-emerald-700',
            baseGradient: 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-white',
            border: 'border-emerald-200 hover:border-emerald-300',
            shadow: 'hover:shadow-emerald-200/60',
            iconBg: 'bg-emerald-200 text-emerald-700',
            badge: { text: 'Authorized Only', style: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
        }
    },
    {
        id: 'records',
        title: 'Academic Records',
        description: 'View grades and history. (Student Login Required)',
        icon: <FileText className="w-6 h-6 md:w-8 md:h-8" />,
        linkTo: '/student-portal', 
        theme: {
            accent: 'text-indigo-700',
            baseGradient: 'bg-gradient-to-br from-indigo-100 via-indigo-50 to-white',
            border: 'border-indigo-200 hover:border-indigo-300',
            shadow: 'hover:shadow-indigo-200/60',
            iconBg: 'bg-indigo-200 text-indigo-700',
            badge: { text: 'Student Access', style: 'bg-indigo-100 text-indigo-800 border-indigo-200' } 
        }
    },
    {
        id: 'scheduler',
        title: 'Smart Scheduler',
        description: 'Generate class schedules and subject loading.',
        icon: <CalendarClock className="w-6 h-6 md:w-8 md:h-8" />,
        actionId: 'scheduler',
        theme: {
            accent: 'text-orange-700',
            baseGradient: 'bg-gradient-to-br from-orange-100 via-orange-50 to-white',
            border: 'border-orange-200 hover:border-orange-300',
            shadow: 'hover:shadow-orange-200/60',
            iconBg: 'bg-orange-200 text-orange-700',
            badge: { text: 'Admin Tool', style: 'bg-orange-100 text-orange-800 border-orange-200' }
        }
    }
];

// --- COMPONENT: HEADER WIDGET ---
const HeaderWidget = ({ icon, label, value, subValue, className = "" }) => (
    <div className={`flex items-center gap-2.5 bg-white/60 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-white/60 shadow-sm min-w-[130px] h-[64px] ${className}`}>
        <div className="p-1.5 bg-white/80 rounded-lg text-slate-500 shrink-0 shadow-sm">
            {icon}
        </div>
        <div className="flex flex-col justify-center min-w-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5 truncate">{label}</p>
            <p className="text-xs md:text-sm font-black text-slate-800 leading-tight tracking-tight truncate">{value}</p>
            {subValue && <p className="text-[10px] md:text-xs font-bold text-indigo-600 leading-none mt-0.5 truncate">{subValue}</p>}
        </div>
    </div>
);

// --- COMPONENT: ROADMAP WIDGET ---
// Accepts onClick prop to trigger the modal
const RoadmapWidget = ({ onClick }) => (
    <button 
        onClick={onClick}
        className="group relative flex items-center gap-2.5 bg-white/80 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-violet-200 shadow-sm hover:shadow-md transition-all duration-300 min-w-[130px] h-[64px] cursor-pointer hover:-translate-y-0.5 active:scale-95 overflow-hidden text-left w-full md:w-auto"
    >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-50/0 via-violet-100/50 to-violet-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none" />
        
        <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
            <Rocket size={18} weight="fill" />
        </div>
        <div className="flex flex-col justify-center relative z-10">
            <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Updates</p>
                <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-500"></span>
                </span>
            </div>
            <p className="text-xs md:text-sm font-black text-violet-700 leading-tight tracking-tight whitespace-nowrap group-hover:underline decoration-2 underline-offset-2">Future Roadmap</p>
        </div>
    </button>
);

const SystemCard = ({ item, onAction }) => {
    const isExternal = item.linkTo && item.linkTo.startsWith('http');
    
    let Wrapper = 'div';
    let props = {};

    if (item.linkTo) {
        props = { target: isExternal ? '_blank' : undefined, rel: isExternal ? 'noopener noreferrer' : undefined };
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
                group relative overflow-hidden rounded-[2rem] border p-5 md:p-6 
                transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer text-left
                flex flex-col h-full min-h-[220px] md:min-h-[240px] w-full
                ${item.theme.baseGradient} ${item.theme.border} ${item.theme.shadow} backdrop-blur-[2px]
            `}
        >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-0 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-sm ${item.theme.iconBg}`}>
                        {item.icon}
                    </div>
                    {item.theme.badge && (
                        <span className={`px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest border ${item.theme.badge.style}`}>
                            {item.theme.badge.text}
                        </span>
                    )}
                </div>

                <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 tracking-tight group-hover:text-slate-900 transition-colors">
                    {item.title}
                </h3>
                
                <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed mb-8 group-hover:text-slate-800 transition-colors line-clamp-2">
                    {item.description}
                </p>

                <div className="mt-auto flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-80 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
                    <span className={item.theme.accent}>{item.isDisabled ? 'In Development' : 'Access System'}</span>
                    <div className={`w-4 h-[2px] ${item.theme.accent.replace('text-', 'bg-')}`} />
                </div>
            </div>
        </Wrapper>
    );
};

const Modal = ({ isOpen, onClose, title, icon: Icon, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />
            <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in-up border border-white ring-1 ring-slate-100">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600">
                        <Icon size={20} />
                    </div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">{title}</h3>
                    <button onClick={onClose} className="ml-auto p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-red-500">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
const PortalPage = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    // Added roadmap state
    const [modals, setModals] = useState({ lms: false, finance: false, records: false, scheduler: false, roadmap: false });
    const [academicYear, setAcademicYear] = useState('');

    useEffect(() => {
        setAcademicYear(getAcademicYear());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleModal = (type, show) => setModals(prev => ({ ...prev, [type]: show }));

    const handleProceed = (url, modalType) => {
        window.open(url, '_blank', 'noopener,noreferrer');
        toggleModal(modalType, false);
    };

    const formattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
    const formattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="min-h-screen relative overflow-x-hidden font-sans text-slate-600 selection:bg-indigo-100 selection:text-indigo-900 bg-slate-50">
            
            {/* BACKGROUND LAYER */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <img src="/2.png" alt="Portal Background" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-white/85" /> 
                <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-400/10 rounded-full blur-[80px] mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }}/>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-rose-400/10 rounded-full blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }}/>
            </div>

            {/* --- MODALS --- */}
            <Modal isOpen={modals.lms} onClose={() => toggleModal('lms', false)} title="Beta Environment" icon={AlertTriangle}>
                <p className="text-slate-500 leading-relaxed mb-6 text-xs md:text-sm">
                    You are entering the LMS <strong>Beta Environment</strong>. Features are currently being tested.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => toggleModal('lms', false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition text-xs">Cancel</button>
                    <button onClick={() => handleProceed(URLS.lms, 'lms')} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-500 transition text-xs">Proceed</button>
                </div>
            </Modal>

            <Modal isOpen={modals.finance} onClose={() => toggleModal('finance', false)} title="Restricted Access" icon={Lock}>
                <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full text-emerald-500 mb-3 border border-emerald-100">
                        <ShieldCheck size={32} />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Authorized Only</h4>
                </div>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed mb-6 text-center">
                    Redirecting to <strong>Bookkeeping System</strong>. Proceed only if authorized.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => toggleModal('finance', false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition text-xs">Cancel</button>
                    <button onClick={() => handleProceed(URLS.finance, 'finance')} className="flex-1 py-3 rounded-xl font-bold bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition text-xs">Access Ledger</button>
                </div>
            </Modal>

            <Modal isOpen={modals.scheduler} onClose={() => toggleModal('scheduler', false)} title="Restricted Beta" icon={Lock}>
                 <p className="text-slate-500 leading-relaxed mb-6 text-xs md:text-sm text-center">
                    <strong>Smart Scheduler (Beta)</strong> is strictly for Administrators.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => toggleModal('scheduler', false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition text-xs">Cancel</button>
                    <button onClick={() => handleProceed(URLS.scheduler, 'scheduler')} className="flex-1 py-3 rounded-xl font-bold bg-orange-600 text-white shadow-lg shadow-orange-200 hover:bg-orange-500 transition text-xs">Proceed</button>
                </div>
            </Modal>

            <Modal isOpen={modals.records} onClose={() => toggleModal('records', false)} title="Under Maintenance" icon={Clock}>
                <p className="text-slate-500 leading-relaxed mb-6 text-xs md:text-sm">
                    The <strong>Academic Records System</strong> is currently being built. Please check back later.
                </p>
                <button onClick={() => toggleModal('records', false)} className="w-full py-3 rounded-xl font-bold bg-slate-800 text-white shadow-lg hover:bg-slate-700 transition text-xs">Return</button>
            </Modal>

            {/* --- ROADMAP MODAL --- */}
            <Roadmap 
                isOpen={modals.roadmap} 
                onClose={() => toggleModal('roadmap', false)} 
                systemCards={SYSTEM_CARDS} 
            />

            {/* --- HERO CONTENT --- */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-6 flex flex-col justify-center min-h-[90vh]">
                
                {/* HEADER ROW */}
                <header className="flex flex-col xl:flex-row items-center justify-between gap-6 mb-6 md:mb-8 w-full">
                    
                    {/* LEFT: Branding */}
                    <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-md flex items-center justify-center p-3 border border-slate-100 relative z-10 hover:scale-105 transition-transform duration-300">
                                <img src="/1.png" alt="SRCS Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <div className="flex flex-col leading-none space-y-0.5 md:space-y-1">
                            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight uppercase drop-shadow-sm">
                                San Ramon 
                            </h1>
                            <h1 className="text-2xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500 tracking-tight uppercase drop-shadow-sm">
                                Catholic School
                            </h1>
                            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] pt-1">
                                Official Digital Ecosystem
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: Widgets */}
                    <div className="flex flex-wrap md:flex-nowrap justify-center items-stretch gap-2 md:gap-3 w-full md:w-auto">
                        <HeaderWidget 
                            icon={<Clock className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />} 
                            label="Today" 
                            value={formattedDate} 
                            subValue={formattedTime}
                            className="flex-1 md:flex-none"
                        />
                        <div className="hidden lg:block flex-1 md:flex-none">
                            <HeaderWidget 
                                icon={<GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />} 
                                label="School Year" 
                                value={academicYear} 
                                className="h-full"
                            />
                        </div>
                        {/* Roadmap Widget Button */}
                        <div className="flex-1 md:flex-none w-full md:w-auto">
                            <RoadmapWidget onClick={() => toggleModal('roadmap', true)} />
                        </div>
                    </div>
                </header>

                {/* HERO TEXT */}
                <div className="text-center mb-6 md:mb-8 animate-fade-in-up">
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-2 md:mb-3">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">Destination</span>
                    </h2>
                    <p className="text-slate-600 font-medium text-xs md:text-base max-w-xl mx-auto leading-relaxed px-4">
                        Welcome to the SRCS Digital Ecosystem. Please select your designated portal below to proceed securely.
                    </p>
                </div>

                {/* CARDS GRID */}
                <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-auto animate-fade-in-up pb-8 w-full">
                    {SYSTEM_CARDS.map((card) => (
                        <SystemCard 
                            key={card.id} 
                            item={card} 
                            onAction={toggleModal} 
                        />
                    ))}
                </main>

                {/* FOOTER */}
                <footer className="mt-4 md:mt-6 pt-6 pb-6 flex flex-col md:flex-row items-center justify-center gap-3 opacity-80">
                    <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/40 border border-white/50 shadow-sm backdrop-blur-[2px]">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase tracking-widest">Secure SSL • 256-bit Encryption</span>
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-white/40 border border-white/50 shadow-sm backdrop-blur-[2px]">
                        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            © {new Date().getFullYear()} SRCS Digital Ecosystem. All Rights Reserved.
                        </p>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default PortalPage;