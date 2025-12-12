// src/pages/PortalPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// --- ICONS ---
const Icons = {
    GradCap: () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    BookOpen: () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    Coins: () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7 .71-2.82 2.82"/></svg>,
    FileText: () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
    AlertTriangle: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
    Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    ArrowRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    ShieldCheck: () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
};

// --- LOGIC: DYNAMIC ACADEMIC YEAR ---
const getAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); 
    const startYear = currentMonth >= 5 ? currentYear : currentYear - 1;
    return `${startYear} - ${startYear + 1}`;
};

// --- CONFIGURATION ---
const SYSTEM_CARDS = [
    {
        id: 'enrollment',
        title: 'Enrollment System',
        desc: 'New students and returning learners registration portal.',
        icon: <Icons.GradCap />,
        linkTo: '/enrollment-landing',
        theme: {
            cardBg: 'bg-gradient-to-br from-red-600 to-[#800000]',
            border: 'border-red-500/30',
            textTitle: 'text-white',
            textDesc: 'text-red-100/90',
            iconBg: 'bg-white/20 text-white backdrop-blur-sm',
            shadow: 'shadow-lg shadow-red-900/50 hover:shadow-red-600/40',
            actionText: 'text-white/90'
        },
        span: 'col-span-1 md:col-span-2'
    },
    {
        id: 'lms',
        title: 'Learning Management',
        desc: 'Access your classes, modules, and grades.',
        icon: <Icons.BookOpen />,
        actionId: 'lms', 
        isBeta: true,
        theme: {
            cardBg: 'bg-gradient-to-br from-blue-600 to-blue-900',
            border: 'border-blue-500/30',
            textTitle: 'text-white',
            textDesc: 'text-blue-100/90',
            iconBg: 'bg-white/20 text-white backdrop-blur-sm',
            shadow: 'shadow-lg shadow-blue-900/50 hover:shadow-blue-600/40',
            actionText: 'text-white/90'
        },
        span: 'col-span-1 md:col-span-1'
    },
    {
        id: 'bookkeeping',
        title: 'Finance & Ledger',
        desc: 'Manage student accounts and payments.',
        icon: <Icons.Coins />,
        actionId: 'finance', 
        theme: {
            cardBg: 'bg-gradient-to-br from-emerald-600 to-emerald-900',
            border: 'border-emerald-500/30',
            textTitle: 'text-white',
            textDesc: 'text-emerald-100/90',
            iconBg: 'bg-white/20 text-white backdrop-blur-sm',
            shadow: 'shadow-lg shadow-emerald-900/50 hover:shadow-emerald-600/40',
            actionText: 'text-white/90'
        },
        span: 'col-span-1 md:col-span-1'
    },
    {
        id: 'records',
        title: 'Academic Records',
        desc: 'Official grades and transcript history.',
        icon: <Icons.FileText />,
        actionId: 'records', 
        isComingSoon: true,
        theme: {
            cardBg: 'bg-gradient-to-br from-slate-700 to-slate-800',
            border: 'border-slate-600/50',
            textTitle: 'text-slate-200',
            textDesc: 'text-slate-400',
            iconBg: 'bg-slate-900/30 text-slate-400',
            shadow: 'shadow-lg shadow-black/30',
            actionText: 'text-slate-500'
        },
        span: 'col-span-1 md:col-span-2'
    }
];

// --- MODAL COMPONENT ---
const Modal = ({ isOpen, onClose, title, icon: Icon, colorTheme, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up border border-white/10">
                <div className={`p-6 border-b border-gray-100 flex items-center gap-4 ${colorTheme}`}>
                    <div className="p-3 bg-white/40 rounded-xl shadow-sm">
                        <Icon />
                    </div>
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="ml-auto p-2 hover:bg-black/10 rounded-full transition">
                        <Icons.X />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- BENTO CARD COMPONENT ---
const BentoCard = ({ item, onAction }) => {
    const Component = item.linkTo ? Link : 'button';
    return (
        <Component 
            to={item.linkTo}
            onClick={item.linkTo ? undefined : () => onAction(item.actionId)}
            className={`
                group relative overflow-hidden rounded-3xl p-7 transition-all duration-300
                border ${item.theme.border} ${item.theme.cardBg}
                ${item.theme.shadow} hover:-translate-y-2 hover:brightness-110
                flex flex-col justify-between ${item.span} text-left
            `}
        >
            <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${item.theme.iconBg}`}>
                        {item.icon}
                    </div>
                    {item.isBeta && (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-white/20 shadow-sm">
                            Beta
                        </span>
                    )}
                    {item.isComingSoon && (
                        <span className="px-3 py-1 bg-slate-900/30 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1 border border-white/5">
                            <Icons.Clock /> Soon
                        </span>
                    )}
                </div>
                <h3 className={`text-2xl font-black mb-2 tracking-tight ${item.theme.textTitle}`}>{item.title}</h3>
                <p className={`font-medium leading-relaxed max-w-md ${item.theme.textDesc}`}>
                    {item.desc}
                </p>
            </div>
            <div className={`relative z-10 flex items-center gap-2 font-bold text-xs uppercase tracking-widest mt-8 transition-all duration-300 ${item.theme.actionText} group-hover:translate-x-2`}>
                {item.isComingSoon ? 'Under Development' : 'Launch System'}
                {!item.isComingSoon && <Icons.ArrowRight />}
            </div>
        </Component>
    );
};

// --- MAIN PAGE ---
const PortalPage = () => {
    const [modals, setModals] = useState({ lms: false, finance: false, records: false });
    const [academicYear, setAcademicYear] = useState('');

    useEffect(() => {
        setAcademicYear(getAcademicYear());
    }, []);

    const toggleModal = (type, show) => setModals(prev => ({ ...prev, [type]: show }));

    const URLS = {
        lms: "https://srcslms.vercel.app/",
        finance: "https://srcsledger.netlify.app/"
    };

    return (
        <div className="min-h-screen bg-[#020617] font-sans text-slate-200 selection:bg-red-500 selection:text-white relative overflow-hidden">
            
            {/* --- BACKGROUND IMAGE --- */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-slate-950" />
                <img 
                    src="/2.png" 
                    alt="Portal Background" 
                    className="absolute inset-0 w-full h-full object-cover opacity-70" 
                />
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950/90" />
            </div>

            {/* --- MODALS --- */}
            
            <Modal isOpen={modals.lms} onClose={() => toggleModal('lms', false)} title="Beta Environment" icon={Icons.AlertTriangle} colorTheme="bg-amber-50 text-amber-700">
                <p className="text-slate-600 leading-relaxed mb-6">You are entering the LMS <strong>Beta Environment</strong>. Features are currently being tested and you may experience occasional interruptions.</p>
                <div className="flex gap-3">
                    <button onClick={() => toggleModal('lms', false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
                    <button onClick={() => window.location.href = URLS.lms} className="flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition">Proceed</button>
                </div>
            </Modal>

            <Modal isOpen={modals.finance} onClose={() => toggleModal('finance', false)} title="Restricted Access" icon={Icons.Lock} colorTheme="bg-rose-50 text-rose-700">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 rounded-full text-rose-600 mb-4 animate-bounce">
                        <Icons.ShieldCheck />
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg">Authorized Personnel Only</h4>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 text-center">
                    You are about to be redirected to the <strong>Bookkeeping System</strong>.<br/>Please proceed <strong>only</strong> if you are the school's official bookkeeper.
                </p>
                <div className="flex gap-3">
                    <button onClick={() => toggleModal('finance', false)} className="flex-1 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
                    <button onClick={() => window.location.href = URLS.finance} className="flex-1 py-3 rounded-xl font-bold bg-rose-700 text-white shadow-lg shadow-rose-200 hover:bg-rose-800 transition">I am the Bookkeeper</button>
                </div>
            </Modal>

            <Modal isOpen={modals.records} onClose={() => toggleModal('records', false)} title="Coming Soon" icon={Icons.Clock} colorTheme="bg-slate-100 text-slate-700">
                <p className="text-slate-600 leading-relaxed mb-6">We are currently building the <strong>Academic Records System</strong>.</p>
                <button onClick={() => toggleModal('records', false)} className="w-full py-3 rounded-xl font-bold bg-slate-800 text-white shadow-lg hover:bg-slate-900 transition">Back to Portal</button>
            </Modal>

            {/* --- HERO CONTENT --- */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col justify-center min-h-[90vh]">
                
                <header className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 mb-16 animate-fade-in-down">
                    {/* Left: Logo & Title */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl flex items-center justify-center p-3 border border-white/20 hover:bg-white/20 transition-all duration-300">
                                <img src="/1.png" alt="SRCS Logo" className="w-full h-full object-contain drop-shadow-md" />
                            </div>
                            {/* School Name: Responsive */}
                            <span className="font-black text-white text-lg md:text-3xl tracking-wide uppercase whitespace-nowrap">
                                San Ramon Catholic School, Inc.
                            </span>
                        </div>
                        
                        {/* Headline: Aligned Widths */}
                        <div className="flex flex-col">
                            <h1 className="text-5xl md:text-8xl font-black text-white leading-none tracking-[0.27em] ml-1">
                                DIGITAL
                            </h1>
                            <span className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-200 leading-none">
                                Ecosystem.
                            </span>
                        </div>
                    </div>
                    
                    {/* Right: Info Cluster (Status + Date) */}
                    {/* UPDATED: flex-row ensures side-by-side on mobile, gap-2 for tight fit */}
                    <div className="flex flex-row w-full md:w-auto gap-2 md:gap-4 mt-6 md:mt-0">
                        
                        {/* System Status: Flex-1 to share width evenly */}
                        <div className="flex-1 bg-emerald-950/60 backdrop-blur-md border border-emerald-500/30 p-3 md:p-4 rounded-2xl flex items-center justify-center md:justify-start gap-2 md:gap-4 shadow-lg">
                            <span className="relative flex h-2 w-2 md:h-3 md:w-3 flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-emerald-500"></span>
                            </span>
                            <div className="text-left">
                                <p className="text-emerald-100 font-bold text-[10px] md:text-xs uppercase tracking-wider whitespace-nowrap">System Online</p>
                                {/* Hidden on very small screens if needed, or kept small */}
                                <p className="text-[9px] md:text-[10px] text-emerald-400/80 font-medium whitespace-nowrap">Secure Connection</p>
                            </div>
                        </div>

                        {/* Academic Year: Flex-1 to share width evenly */}
                        <div className="flex-1 bg-white/5 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-center text-center md:text-left min-w-0">
                            <p className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-wider mb-0 md:mb-1 whitespace-nowrap">Academic Year</p>
                            <p className="text-sm md:text-2xl font-black text-white tracking-widest leading-none whitespace-nowrap">{academicYear}</p>
                        </div>
                    </div>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                    {SYSTEM_CARDS.map((card) => (
                        <BentoCard 
                            key={card.id} 
                            item={card} 
                            onAction={(actionId) => toggleModal(actionId, true)}
                        />
                    ))}
                </main>

                <footer className="mt-20 border-t border-white/10 pt-8 text-center md:text-left">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-300 transition-colors">
                        © {new Date().getFullYear()} SRCS Official Portal. All Rights Reserved.
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default PortalPage;