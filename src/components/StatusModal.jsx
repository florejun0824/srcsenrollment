// src/components/StatusModal.jsx
import { memo, useEffect } from 'react';

const StatusModal = memo(({ isOpen, type, title, message, onClose }) => {
    
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    // Config based on type
    const config = {
        success: {
            icon: (
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ),
            bg: 'bg-emerald-100',
            border: 'border-emerald-200',
            btn: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
            titleColor: 'text-emerald-900'
        },
        error: {
            icon: (
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
            bg: 'bg-red-100',
            border: 'border-red-200',
            btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
            titleColor: 'text-red-900'
        },
        warning: {
            icon: (
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            bg: 'bg-amber-100',
            border: 'border-amber-200',
            btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
            titleColor: 'text-amber-900'
        }
    };

    const currentStyle = config[type] || config.info;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 border border-slate-100">
                <div className="flex flex-col items-center text-center">
                    {/* Icon Bubble */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${currentStyle.bg} ${currentStyle.border}`}>
                        {currentStyle.icon}
                    </div>

                    <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${currentStyle.titleColor}`}>
                        {title}
                    </h3>
                    
                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg shadow-slate-200 transition-transform active:scale-95 outline-none focus:ring-4 focus:ring-opacity-30 ${currentStyle.btn}`}
                    >
                        Okay, I Understand
                    </button>
                </div>
            </div>
        </div>
    );
});

StatusModal.displayName = 'StatusModal';
export default StatusModal;