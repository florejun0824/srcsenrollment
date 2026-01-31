// src/components/UpdateDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Loader2, FileX, FolderOpen } from 'lucide-react';

const UpdateDetailModal = ({ isOpen, onClose, system, type }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (isOpen && system) {
            setLoading(true);
            setError(false);
            setContent('');

            // Map system IDs to your text filenames
            const fileMap = {
                enrollment: 'enrollment.txt',
                lms: 'lms.txt',
                finance: 'finance.txt',
                records: 'academic.txt', 
                scheduler: 'scheduler.txt'
            };

            const fileName = fileMap[system.id];
            
            // NOTE: Ensure your folder structure in 'public' matches this path:
            // public/updates/new/filename.txt
            const folder = type === 'new' ? 'new' : 'next'; 
            const filePath = `/updates/${folder}/${fileName}`;

            fetch(filePath)
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.text();
                })
                .then(text => {
                    // FIX 1: Detect if server returned index.html (404) instead of text file
                    if (text.trim().startsWith('<!doctype html') || text.trim().startsWith('<html')) {
                        throw new Error('File not found (returned index.html)');
                    }
                    
                    setContent(text);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Update file missing:", err);
                    setError(true);
                    setLoading(false);
                });
        }
    }, [isOpen, system, type]);

    if (!isOpen || !system) return null;

    // Helper to render text efficiently for smooth scrolling (FIX 2)
    const renderContent = (text) => {
        return text.split('\n').map((line, index) => (
            <div 
                key={index} 
                className="whitespace-pre-wrap font-medium text-slate-600 leading-relaxed text-sm min-h-[1.5em]"
            >
                {line || " "}
            </div>
        ));
    };

    // Dynamic Styling
    const isNew = type === 'new';
    const themeColor = isNew ? 'text-emerald-600' : 'text-violet-600';
    const themeBg = isNew ? 'bg-emerald-50' : 'bg-violet-50';

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />
            
            {/* Modal Container - Removed backdrop-blur here to fix lag */}
            <div className="relative bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in-up border border-white ring-1 ring-slate-100 flex flex-col max-h-[80vh]">
                
                {/* Header */}
                <div className={`p-6 border-b border-slate-100 flex items-center gap-4 ${themeBg}`}>
                    <div className={`p-3 bg-white rounded-2xl shadow-sm ${themeColor}`}>
                        {system.icon}
                    </div>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${themeColor}`}>
                            {isNew ? "Released Update" : "Coming Soon"}
                        </p>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none mt-1">
                            {system.title}
                        </h3>
                    </div>
                    <button onClick={onClose} className="ml-auto p-2 hover:bg-white/50 rounded-full transition text-slate-400 hover:text-red-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-8 overflow-y-auto min-h-[300px] bg-white relative">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <Loader2 className={`w-8 h-8 animate-spin ${themeColor}`} />
                            <span className="text-xs font-bold uppercase tracking-wider">Retrieving Data...</span>
                        </div>
                    ) : error ? (
                        /* Error / No Data State */
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                            <div className="relative w-24 h-24 mb-6">
                                <div className={`absolute inset-0 rounded-full opacity-20 animate-pulse ${isNew ? 'bg-emerald-200' : 'bg-violet-200'}`} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <FolderOpen strokeWidth={1.5} className={`w-12 h-12 ${isNew ? 'text-emerald-300' : 'text-violet-300'}`} />
                                </div>
                                <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                                    <FileX className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                            <h4 className="text-lg font-black text-slate-800 tracking-tight">No Details Available</h4>
                            <p className="text-sm text-slate-500 font-medium mt-2 max-w-[250px] leading-relaxed">
                                We haven't uploaded the patch notes for this specific update yet.
                            </p>
                        </div>
                    ) : (
                        /* Success State */
                        <div className="prose prose-sm prose-slate max-w-none animate-fade-in">
                            {renderContent(content)}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 transition text-xs uppercase tracking-wider">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateDetailModal;