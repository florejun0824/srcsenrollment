// src/components/Roadmap.jsx
import React, { useState } from 'react';
import { X, Sparkles, Construction, ChevronRight } from 'lucide-react';
import UpdateDetailModal from './UpdateDetailModal';

const Roadmap = ({ isOpen, onClose, systemCards }) => {
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'next'
    const [selectedSystem, setSelectedSystem] = useState(null);

    if (!isOpen) return null;

    return (
        <>
            {/* Main Roadmap List Modal */}
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />
                
                <div className="relative bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl max-w-4xl w-full overflow-hidden animate-fade-in-up border border-white ring-1 ring-slate-100 flex flex-col max-h-[85vh]">
                    
                    {/* Header & Tabs */}
                    <div className="p-6 md:p-8 border-b border-slate-100 shrink-0">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Roadmap</h2>
                                <p className="text-slate-500 text-sm font-medium">Explore the evolution of the SRCS Digital Ecosystem.</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 hover:text-red-500 transition">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Custom Tabs */}
                        <div className="flex p-1 bg-slate-100 rounded-2xl">
                            <button 
                                onClick={() => setActiveTab('new')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'new' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Sparkles size={16} /> What's New
                            </button>
                            <button 
                                onClick={() => setActiveTab('next')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'next' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Construction size={16} /> What's Next
                            </button>
                        </div>
                    </div>

                    {/* Body: System List */}
                    <div className={`p-6 md:p-8 overflow-y-auto ${activeTab === 'new' ? 'bg-emerald-50/30' : 'bg-violet-50/30'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {systemCards.map((card) => (
                                <button 
                                    key={card.id}
                                    onClick={() => setSelectedSystem(card)}
                                    className="group flex flex-col text-left bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 relative overflow-hidden"
                                >
                                    {/* Hover Gradient Overlay */}
                                    <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${activeTab === 'new' ? 'from-emerald-50/50 to-transparent' : 'from-violet-50/50 to-transparent'}`} />
                                    
                                    <div className="relative z-10 flex items-start justify-between w-full mb-4">
                                        <div className={`p-3 rounded-2xl bg-slate-50 text-slate-500 group-hover:scale-110 transition-transform duration-300 ${activeTab === 'new' ? 'group-hover:bg-emerald-100 group-hover:text-emerald-600' : 'group-hover:bg-violet-100 group-hover:text-violet-600'}`}>
                                            {/* Clone icon to enforce size */}
                                            {React.cloneElement(card.icon, { className: "w-6 h-6" })}
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
                                    </div>
                                    
                                    <div className="relative z-10">
                                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight mb-1">{card.title}</h4>
                                        <p className="text-xs text-slate-500 font-medium line-clamp-2">
                                            {activeTab === 'new' ? 'Click to see latest release notes.' : 'Click to see planned features.'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Popup Component */}
            <UpdateDetailModal 
                isOpen={!!selectedSystem} 
                onClose={() => setSelectedSystem(null)} 
                system={selectedSystem}
                type={activeTab}
            />
        </>
    );
};

export default Roadmap;