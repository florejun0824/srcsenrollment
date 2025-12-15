// src/components/admin/TransferPromoteModal.jsx
import React, { useState, useEffect } from 'react';
import { Icons } from '../../utils/Icons';

const GRADE_LEVELS = [
    'Pre-Kindergarten 1', 'Pre-Kindergarten 2', 'Kinder', 
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 
    'Grade 11 (SHS)', 'Grade 12 (SHS)'
];

const getNextGrade = (current) => {
    const idx = GRADE_LEVELS.indexOf(current);
    return (idx !== -1 && idx < GRADE_LEVELS.length - 1) ? GRADE_LEVELS[idx + 1] : 'Graduated';
};

const getNextSchoolYear = (currentSY) => {
    const startYear = parseInt(currentSY.split('-')[0]);
    return `${startYear + 1}-${startYear + 2}`;
};

const TransferPromoteModal = ({ type, student, sections, onClose, onConfirm }) => {
    const [targetSection, setTargetSection] = useState('');
    const [targetYear, setTargetYear] = useState('');
    const [targetGrade, setTargetGrade] = useState('');

    useEffect(() => {
        if (type === 'promote') {
            setTargetGrade(getNextGrade(student.gradeLevel));
            setTargetYear(getNextSchoolYear(student.schoolYear));
        } else {
            setTargetGrade(student.gradeLevel);
            setTargetYear(student.schoolYear);
        }
    }, [type, student]);

    const validSections = sections.filter(sec => sec.gradeLevel === targetGrade);

    const handleConfirm = () => {
        if (type === 'transfer' && !targetSection) return alert("Select a section");
        onConfirm(student, { targetSection, targetYear, targetGrade });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>

                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#800000] to-red-900 flex items-center justify-center text-white shadow-lg shadow-red-900/20 border border-white/10">
                        {type === 'promote' ? Icons.promote : Icons.transfer}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">
                            {type === 'promote' ? 'Promote Student' : 'Transfer Section'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Select Destination</p>
                    </div>
                </div>
                
                <div className="space-y-4 mb-8 relative z-10">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target School Year</p>
                        <p className="font-black text-white text-lg">{targetYear}</p>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Grade Level</p>
                        <p className="font-black text-red-400 text-lg">{targetGrade}</p>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Assign New Section</label>
                        <div className="relative group">
                            <select 
                                value={targetSection} 
                                onChange={(e) => setTargetSection(e.target.value)} 
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-red-500/50 transition-all appearance-none cursor-pointer hover:bg-white/5"
                            >
                                <option value="" className="bg-slate-900 text-slate-400">-- {validSections.length ? 'Select Section' : 'No Sections Available'} --</option>
                                {validSections.map(sec => <option key={sec.id} value={sec.name} className="bg-slate-900 text-white">{sec.name}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                        </div>
                        <p className="text-[9px] font-bold text-slate-600 mt-2 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                            Only showing sections for {targetGrade}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white transition-colors text-xs uppercase tracking-wider"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#800000] to-red-700 hover:to-red-600 shadow-lg shadow-red-900/30 transition-all hover:-translate-y-0.5 text-xs uppercase tracking-wider"
                    >
                        Confirm Action
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransferPromoteModal;