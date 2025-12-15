// src/components/admin/SectionManager.jsx
import React, { useState } from 'react';
import { Icons } from '../../utils/Icons';

const GRADE_LEVELS = [
    'Pre-Kindergarten 1', 'Pre-Kindergarten 2', 'Kinder', 
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 
    'Grade 11 (SHS)', 'Grade 12 (SHS)'
];

const SectionManager = ({ sections, onAdd, onDelete }) => {
    const [newSection, setNewSection] = useState('');
    const [targetGrade, setTargetGrade] = useState(GRADE_LEVELS[0]);

    const handleAdd = () => { if(newSection.trim()){ onAdd(newSection, targetGrade); setNewSection(''); } };

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-10">
            <div className="max-w-6xl mx-auto pb-20">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/30 border border-white/10 shrink-0">
                        {Icons.sections}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Section Management</h2>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5">Create and Organize Class Sections</p>
                    </div>
                </div>

                {/* Create Section Input Card */}
                <div className="bg-slate-800/50 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-2xl mb-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"></div>
                    
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Add New Section
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end relative z-10">
                        {/* Grade Select */}
                        <div className="md:col-span-4 space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Grade Level</label>
                            <div className="relative">
                                <select 
                                    value={targetGrade} 
                                    onChange={(e) => setTargetGrade(e.target.value)} 
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all appearance-none cursor-pointer hover:border-white/20"
                                >
                                    {GRADE_LEVELS.map(g => <option key={g} value={g} className="bg-slate-900 text-white">{g}</option>)}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="md:col-span-5 space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Section Name</label>
                            <input 
                                type="text" 
                                value={newSection} 
                                onChange={(e) => setNewSection(e.target.value)} 
                                placeholder="E.G. ST. MATTHEW" 
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all placeholder:text-slate-600 uppercase"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="md:col-span-3">
                            <button 
                                onClick={handleAdd} 
                                disabled={!newSection.trim()}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:to-blue-500 text-white py-4 rounded-xl font-bold text-xs shadow-lg shadow-blue-900/30 transition-all hover:-translate-y-1 hover:shadow-blue-600/20 uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                            >
                                {Icons.plus} Create Section
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Sections List Grid */}
                <div className="space-y-10">
                    {GRADE_LEVELS.map(grade => {
                        const gradeSections = sections.filter(s => s.gradeLevel === grade);
                        if (gradeSections.length === 0) return null;
                        
                        return (
                            <div key={grade} className="animate-fade-in-up">
                                {/* Grade Header */}
                                <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                                    <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-3">
                                        <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-800 rounded-full"></span>
                                        {grade}
                                    </h3>
                                    <span className="bg-white/5 border border-white/5 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                        {gradeSections.length} Sections
                                    </span>
                                </div>
                                
                                {/* Sections Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {gradeSections.map(sec => (
                                        <div key={sec.id} className="bg-white/[0.03] hover:bg-white/[0.06] p-4 rounded-2xl border border-white/5 flex justify-between items-center group transition-all duration-300 hover:border-white/10 hover:shadow-xl hover:-translate-y-1">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold border border-white/5 group-hover:border-blue-500/30 group-hover:text-blue-400 transition-colors">
                                                    {sec.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-300 text-sm group-hover:text-white transition-colors uppercase truncate">
                                                    {sec.name}
                                                </span>
                                            </div>
                                            
                                            <button 
                                                onClick={() => onDelete(sec)} 
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-600 hover:text-white hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                                                title="Delete Section"
                                            >
                                                {Icons.trash}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Empty State */}
                {sections.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-32 opacity-50">
                        <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 text-slate-600">
                            <span className="scale-150">{Icons.folder}</span>
                        </div>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No Sections Created Yet</p>
                        <p className="text-xs text-slate-600 mt-2">Use the form above to add your first section.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SectionManager;