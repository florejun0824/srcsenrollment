// src/components/admin/TransferPromoteModal.jsx
import React, { useState, useEffect } from 'react';
import { Icons } from '../../utils/Icons';
import { AlertTriangle, GraduationCap } from 'lucide-react'; 

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
    if (!currentSY) return '';
    const startYear = parseInt(currentSY.split('-')[0]);
    return `${startYear + 1}-${startYear + 2}`;
};

// Helper format
const formatCurrency = (val) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

const TransferPromoteModal = ({ type, student, sections, onClose, onConfirm }) => {
    const [targetSection, setTargetSection] = useState('');
    const [targetYear, setTargetYear] = useState('');
    const [targetGrade, setTargetGrade] = useState('');
    const [isGraduating, setIsGraduating] = useState(false);

    // Calculate if student has debt to carry over
    const hasBalance = (student.soa?.balance || 0) > 0;

    useEffect(() => {
        if (type === 'promote') {
            const next = getNextGrade(student.gradeLevel);
            setTargetGrade(next);
            setTargetYear(getNextSchoolYear(student.schoolYear));
            
            // Handle Graduation Case
            if (next === 'Graduated') {
                setIsGraduating(true);
                setTargetSection('Alumni');
            } else {
                setIsGraduating(false);
                setTargetSection('');
            }
        } else {
            // Transfer Case
            setTargetGrade(student.gradeLevel);
            setTargetYear(student.schoolYear);
            setIsGraduating(false);
        }
    }, [type, student]);

    const validSections = sections.filter(sec => sec.gradeLevel === targetGrade);

    const handleConfirm = () => {
        // Validation: Require section for Transfer, or Promote (unless graduating)
        if (!targetSection && !isGraduating) return alert("Select a section");
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
                    
                    {/* --- BACK ACCOUNT WARNING (Carry Over Balance) --- */}
                    {type === 'promote' && hasBalance && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-3 items-start animate-pulse-slow">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Unpaid Balance Detected</p>
                                <p className="text-xs text-amber-200/80 leading-relaxed mt-1">
                                    Student has a remaining balance of <span className="text-amber-100 font-bold">{formatCurrency(student.soa.balance)}</span>. 
                                    This will be carried over to SY {targetYear} as a "Back Account".
                                </p>
                            </div>
                        </div>
                    )}

                    {/* --- GRADUATION NOTICE --- */}
                    {isGraduating && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex gap-3 items-center">
                            <GraduationCap className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Graduating Student</p>
                                <p className="text-xs text-emerald-200/80 leading-relaxed mt-0.5">
                                    Student will be moved to the Alumni / Archived list.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target SY</p>
                            <p className="font-black text-white text-sm">{targetYear}</p>
                        </div>
                        <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Grade</p>
                            <p className={`font-black text-sm ${isGraduating ? 'text-emerald-400' : 'text-red-400'}`}>{targetGrade}</p>
                        </div>
                    </div>

                    {!isGraduating && (
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
                    )}
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
                        {isGraduating ? 'Confirm Archive' : 'Confirm Action'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransferPromoteModal;