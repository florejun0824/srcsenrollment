// src/pages/PortalPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// --- CARD STYLES CONFIGURATION ---
const CardStyles = {
    'Enrollment System': { icon: '🎓', bgGradient: 'from-red-600 to-[#800000]', iconFill: 'bg-red-200/50', iconColor: 'text-[#800000]', shadow: 'shadow-red-900/40' },
    'LMS': { icon: '📚', bgGradient: 'from-blue-600 to-cyan-500', iconFill: 'bg-blue-200/50', iconColor: 'text-blue-700', shadow: 'shadow-blue-900/40' },
    'Bookkeeping System': { icon: '💰', bgGradient: 'from-green-600 to-lime-500', iconFill: 'bg-green-200/50', iconColor: 'text-green-700', shadow: 'shadow-green-900/40' },
    'Academic Records': { icon: '📜', bgGradient: 'from-purple-600 to-pink-500', iconFill: 'bg-purple-200/50', iconColor: 'text-purple-700', shadow: 'shadow-purple-900/40' },
};

// --- BETA WARNING MODAL ---
const BetaWarningModal = ({ onClose, onProceed }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/70 backdrop-blur-md animate-fade-in">
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl text-center max-w-sm w-full border border-gray-100">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-5 text-orange-600 shadow-sm animate-pulse">
                ⚠️
            </div>
            <h2 className="text-xl font-extrabold text-gray-800 mb-2">Beta Test Phase</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                The LMS is currently in <strong>Beta Testing</strong>. Most functions are operational, but potential bugs may exist.
            </p>
            <p className="text-xs font-black text-orange-600 mb-6">Proceed with caution.</p>
            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition">
                    Cancel
                </button>
                <button onClick={onProceed} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-300/50">
                    Proceed Anyway
                </button>
            </div>
        </div>
    </div>
);

// --- COMING SOON MODAL ---
const ComingSoonPage = ({ onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/70 backdrop-blur-md animate-fade-in">
        <div className="bg-white p-6 md:p-10 rounded-2xl shadow-2xl text-center max-w-sm w-full border border-gray-100">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-5 text-yellow-600 shadow-sm animate-pulse">
                ⏳
            </div>
            <h2 className="text-xl font-extrabold text-gray-800 mb-3">Feature Coming Soon!</h2>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                The Academic Records System is under development. Please check back later.
            </p>
            <button onClick={onClose} className="w-full bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition shadow-lg shadow-gray-200/50">
                Back to Portal
            </button>
        </div>
    </div>
);

// --- PORTAL OPTION CARD ---
const PortalOptionCard = ({ title, description, linkTo, externalUrl, isComingSoon, isBeta, onClick }) => {
    const { icon, bgGradient, iconFill, iconColor, shadow } = CardStyles[title];

    const handleClick = () => {
        if (isComingSoon) return;
        if (onClick) return onClick();
        if (externalUrl) return window.open(externalUrl, "_blank");
        // Internal links handled by Link
    };

    const CardContent = () => (
        <div className={`
            relative p-5 md:p-6 rounded-3xl flex flex-col items-center text-center gap-3
            border border-white/30 backdrop-blur-sm transition-transform duration-300
            ${isComingSoon ? 'bg-gray-100/70 shadow-inner shadow-gray-200 text-gray-500 cursor-not-allowed' : `bg-gradient-to-br ${bgGradient} text-white shadow-xl ${shadow} hover:scale-105`}
        `}>
            {isBeta && <span className="absolute -top-3 right-0 px-3 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-black rounded-full shadow-md uppercase tracking-widest rotate-3">BETA</span>}
            
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-3xl md:text-4xl ${isComingSoon ? 'bg-gray-300 text-gray-600' : `${iconFill} ${iconColor} shadow-lg shadow-black/20`}`}>
                {icon}
            </div>

            <h2 className={`text-lg md:text-xl font-black mt-2 ${isComingSoon ? 'text-gray-600' : 'text-white'}`}>{title}</h2>
            <p className={`text-xs md:text-sm font-medium ${isComingSoon ? 'text-gray-400' : 'text-white/80'}`}>{description}</p>

            <div className={`
                mt-4 px-5 py-2 rounded-full text-xs md:text-sm font-black uppercase tracking-wider shadow-md
                ${isComingSoon ? 'bg-gray-300 text-gray-700 shadow-gray-200' : 'bg-white text-gray-800 border border-gray-200 hover:text-[#800000]'}
            `}>
                {isComingSoon ? 'Coming Soon' : 'Launch Portal →'}
            </div>
        </div>
    );

    if (isComingSoon) return <div className="w-full cursor-not-allowed">{CardContent()}</div>;
    if (linkTo) return <Link to={linkTo} className="w-full">{CardContent()}</Link>;
    return <button onClick={handleClick} className="w-full">{CardContent()}</button>;
};

// --- MAIN PORTAL PAGE ---
const PortalPage = () => {
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [showBetaWarning, setShowBetaWarning] = useState(false);

    const LMS_URL = "https://srcslms.vercel.app/";

    const handleLMSClick = () => setShowBetaWarning(true);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative font-sans">
            
            {showComingSoon && <ComingSoonPage onClose={() => setShowComingSoon(false)} />}
            {showBetaWarning && <BetaWarningModal onClose={() => setShowBetaWarning(false)} onProceed={() => window.location.href = LMS_URL} />}

            {/* Hero Section */}
            <header className="bg-gradient-to-br from-[#800000] to-red-900 pt-16 pb-32 md:pb-48 relative overflow-hidden shadow-2xl shadow-red-900/30">
                <div className="absolute top-0 left-0 w-80 h-80 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFD700]/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="w-28 h-28 md:w-32 md:h-32 bg-white rounded-full shadow-2xl shadow-black/40 mx-auto flex items-center justify-center mb-6 p-4">
                        <img src="/1.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest leading-none mb-2 drop-shadow-lg">SRCS PORTAL HUB</h1>
                    <p className="text-[#FFD700] text-sm md:text-base font-bold uppercase tracking-[0.4em] drop-shadow-md">Choose Your System</p>
                </div>
            </header>

            {/* Portal Cards */}
            <main className="max-w-5xl mx-auto px-4 -mt-28 md:-mt-32 grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-20">
                <PortalOptionCard title="Enrollment System" description="Access the application form for new students and returning learners." linkTo="/enrollment-landing" />
                <PortalOptionCard title="LMS" description="Access learning materials, assignments, and grades." isBeta onClick={handleLMSClick} />
                <PortalOptionCard title="Bookkeeping System" description="Access the financial and ledger management system." externalUrl="https://srcsledger.netlify.app/" />
                <div onClick={() => setShowComingSoon(true)} className="cursor-pointer w-full">
                    <PortalOptionCard title="Academic Records" description="View and manage official student grades and academic history." isComingSoon />
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-12 p-4 text-center text-gray-400 text-xs font-semibold uppercase tracking-widest bg-white/90 backdrop-blur-sm border-t border-gray-100">
                © {new Date().getFullYear()} SRCS Official Portal Hub. All Rights Reserved.
            </footer>
        </div>
    );
};

export default PortalPage;
