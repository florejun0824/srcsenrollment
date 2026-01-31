// src/components/admin/PromoteAccountModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, getDocs, writeBatch, doc } from 'firebase/firestore';
import { X, Loader2, TrendingUp, Archive, AlertTriangle, Layers, GraduationCap, ArrowRight } from 'lucide-react';

const PromoteAccountModal = ({ selectedIds, allAccounts, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [targetGrade, setTargetGrade] = useState('');
    const [targetSection, setTargetSection] = useState('');
    
    // Section Data
    const [allSections, setAllSections] = useState([]);
    const [gradeLevelOptions, setGradeLevelOptions] = useState([]);
    const [filteredSections, setFilteredSections] = useState([]);

    // --- ANALYZE SELECTION ---
    const analysis = useMemo(() => {
        const selectedAccounts = allAccounts.filter(acc => selectedIds.includes(acc.id));
        const grades = selectedAccounts.map(acc => {
            // SAFEGUARD: Ensure gradeLevel is a string before replacing
            const gStr = acc.gradeLevel ? String(acc.gradeLevel) : '';
            return parseInt(gStr.replace(/\D/g, '')) || 0;
        });

        const minGrade = Math.min(...grades);
        const maxGrade = Math.max(...grades);
        const hasGrade12 = grades.includes(12);
        
        // Error: Mixed selection of graduating and non-graduating
        if (hasGrade12 && minGrade < 12) {
            return { type: 'error', message: 'You have selected a mix of Grade 12 and lower levels. Please select them separately.' };
        }

        // Mode: Archive (All are Grade 12)
        if (minGrade === 12) {
            return { type: 'archive', count: selectedAccounts.length };
        }

        // Mode: Promote
        return { type: 'promote', minGrade, maxGrade, count: selectedAccounts.length };

    }, [selectedIds, allAccounts]);

    // --- FETCH SECTIONS ---
    useEffect(() => {
        const fetchSections = async () => {
            try {
                const q = query(collection(db, "sections"), orderBy("name"));
                const snap = await getDocs(q);
                const sectionsData = snap.docs.map(d => ({ 
                    id: d.id, 
                    sectionName: d.data().name || "Unnamed Section", 
                    // FIX: Default to empty string if undefined to prevent crashes
                    gradeLevel: d.data().gradeLevel || "" 
                }));
                setAllSections(sectionsData);
                
                // Extract unique grades with safety check
                const uniqueGrades = [...new Set(sectionsData.map(s => s.gradeLevel))]
                    .filter(g => g) // Remove empty/null/undefined
                    .sort((a, b) => {
                        const numA = parseInt(String(a).replace(/\D/g, '')) || 0;
                        const numB = parseInt(String(b).replace(/\D/g, '')) || 0;
                        return numA - numB;
                    });
                setGradeLevelOptions(uniqueGrades);
            } catch (err) {
                console.error("Error fetching sections:", err);
            }
        };
        fetchSections();
    }, []);

    // --- FILTER OPTIONS ---
    useEffect(() => {
        if (targetGrade) {
            const relevant = allSections.filter(s => s.gradeLevel === targetGrade);
            setFilteredSections(relevant);
            setTargetSection('');
        } else {
            setFilteredSections([]);
        }
    }, [targetGrade, allSections]);

    // FIX: Filter Grade Options with safety check
    const validTargetGrades = gradeLevelOptions.filter(g => {
        if (!g) return false; // Skip if undefined
        const gNum = parseInt(String(g).replace(/\D/g, '')) || 0;
        return gNum > (analysis.maxGrade || 0);
    });

    const handleConfirm = async () => {
        if (analysis.type === 'promote' && (!targetGrade || !targetSection)) {
            alert("Please select a target Grade and Section.");
            return;
        }

        setLoading(true);
        try {
            const batch = writeBatch(db);
            
            selectedIds.forEach(id => {
                const ref = doc(db, "student_accounts", id);
                if (analysis.type === 'archive') {
                    // Archive Logic
                    batch.update(ref, {
                        isArchived: true,
                        gradeLevel: 'Graduate', // Mark as graduate
                        section: 'Alumni',      // General Alumni section
                        archivedAt: new Date()
                    });
                } else {
                    // Promote Logic
                    batch.update(ref, {
                        gradeLevel: targetGrade,
                        section: targetSection,
                        promotedAt: new Date()
                    });
                }
            });

            await batch.commit();
            onSuccess();
            onClose();
        } catch (error) {
            alert("Error processing: " + error.message);
        }
        setLoading(false);
    };

    if (analysis.type === 'error') {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Invalid Selection</h3>
                    <p className="text-sm text-slate-500 mb-6">{analysis.message}</p>
                    <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200">
                        Okay, I'll fix it
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className={`relative z-10 px-8 py-6 border-b border-slate-100 flex justify-between items-center ${analysis.type === 'archive' ? 'bg-amber-50/50' : 'bg-white/40'}`}>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <span className={`p-2 rounded-xl ${analysis.type === 'archive' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {analysis.type === 'archive' ? <Archive className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                            </span>
                            {analysis.type === 'archive' ? 'Archive Students' : 'Promote Students'}
                        </h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 ml-1">
                            Processing {analysis.count} selected accounts
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8">
                    {analysis.type === 'archive' ? (
                        <div className="text-center py-4">
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                You are about to archive <strong>{analysis.count} Grade 12 students</strong>.
                                <br/><br/>
                                They will be marked as <span className="text-amber-600 font-bold">Graduates/Alumni</span>. They can still access their records, but will be moved to the <strong>Archived Tab</strong>.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-50">
                                <div className="text-center">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current</div>
                                    <div className="text-lg font-black text-slate-700">Grade {analysis.minGrade}{analysis.minGrade !== analysis.maxGrade ? `-${analysis.maxGrade}` : ''}</div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-indigo-300" />
                                <div className="text-center flex-1">
                                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Promote To</div>
                                    <div className="text-lg font-black text-indigo-600">{targetGrade || '?'}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <select 
                                        value={targetGrade} 
                                        onChange={e=>setTargetGrade(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Target Grade Level</option>
                                        {validTargetGrades.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>

                                <div className="relative group">
                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <select 
                                        value={targetSection} 
                                        onChange={e=>setTargetSection(e.target.value)}
                                        disabled={!targetGrade}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <option value="">Select New Section</option>
                                        {filteredSections.map(s => <option key={s.id} value={s.sectionName}>{s.sectionName}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-8 flex gap-3">
                        <button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
                            Cancel
                        </button>
                        <button 
                            onClick={handleConfirm}
                            disabled={loading} 
                            className={`flex-[2] py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed
                            ${analysis.type === 'archive' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (analysis.type === 'archive' ? <Archive className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />)}
                            {loading ? 'Processing...' : (analysis.type === 'archive' ? 'Confirm Archive' : 'Confirm Promotion')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromoteAccountModal;