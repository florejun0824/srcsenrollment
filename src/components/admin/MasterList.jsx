// src/components/admin/MasterList.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from '../../utils/Icons';
import { db } from '../../firebase';
import { writeBatch, doc, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { 
    ArrowRight, 
    ArrowUpCircle, 
    LayoutGrid, 
    CheckSquare, 
    X,
    GraduationCap,
    Archive
} from 'lucide-react';

// --- CONFIG ---
const GRADE_LEVELS = [
    'Pre-Kindergarten 1', 'Pre-Kindergarten 2', 'Kinder', 
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 
    'Grade 11 (SHS)', 'Grade 12 (SHS)'
];

// --- HELPER: AUTO-SECTIONING ALGORITHM ---
const performAutoSectioning = (students, sectionNames, maxPerSection, mode) => {
    const males = students.filter(s => s.sex === 'Male' || s.gender === 'MALE');
    const females = students.filter(s => s.sex === 'Female' || s.gender === 'FEMALE');

    const sorter = (a, b) => {
        if (mode === 'rank') return (parseFloat(b.gwa || 0) - parseFloat(a.gwa || 0));
        return a.lastName.localeCompare(b.lastName);
    };

    males.sort(sorter);
    females.sort(sorter);

    const assignments = [];
    const sectionCap = parseInt(maxPerSection);
    
    let active = true;
    while (active) {
        let assignedInRound = 0;
        for (const secName of sectionNames) {
            const currentCount = assignments.filter(a => a.newSection === secName).length;
            if (currentCount < sectionCap) {
                let tookMale = false;
                if (males.length > 0) {
                    assignments.push({ id: males.shift().id, newSection: secName });
                    tookMale = true;
                    assignedInRound++;
                }
                if (females.length > 0 && (currentCount + (tookMale ? 1 : 0)) < sectionCap) {
                    assignments.push({ id: females.shift().id, newSection: secName });
                    assignedInRound++;
                }
            }
        }
        if (assignedInRound === 0) active = false;
    }
    return assignments;
};

// --- HELPER: CALCULATE NEXT STAGE ---
const getNextGrade = (current) => {
    if (current === 'Grade 12 (SHS)') return 'Graduate';
    const idx = GRADE_LEVELS.indexOf(current);
    return (idx !== -1 && idx < GRADE_LEVELS.length - 1) ? GRADE_LEVELS[idx + 1] : 'Graduate';
};

const getNextSchoolYear = (currentSY) => {
    if (!currentSY) return '';
    const startYear = parseInt(currentSY.split('-')[0]);
    return `${startYear + 1}-${startYear + 2}`;
};

// --- MODAL COMPONENT ---
const BatchActionModal = ({ isOpen, onClose, title, children, onConfirm, processing, confirmText = "Confirm" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-white/50">
                <div className="bg-slate-50 p-6 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{title}</h3>
                </div>
                <div className="p-6 space-y-4">
                    {children}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button onClick={onClose} disabled={processing} className="flex-1 py-3 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-200 transition-all uppercase">
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={processing}
                        className="flex-1 py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-200 transition-all uppercase flex items-center justify-center gap-2"
                    >
                        {processing ? <span className="animate-spin">C</span> : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- ADDED onRefresh PROP HERE ---
const MasterList = ({ students, onVerify, onRefresh }) => {
    // --- STATE ---
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectionGrade, setSelectionGrade] = useState(null);
    const [availableSections, setAvailableSections] = useState([]);
    
    // Modals
    const [modalMode, setModalMode] = useState(null); // 'promote', 'transfer', 'assign'
    const [processing, setProcessing] = useState(false);

    // Form Data
    const [targetSection, setTargetSection] = useState('');
    const [targetGrade, setTargetGrade] = useState('');
    const [targetSY, setTargetSY] = useState('');
    const [isGraduating, setIsGraduating] = useState(false);
    
    // Auto-Assign specific
    const [maxClassSize, setMaxClassSize] = useState(40);
    const [targetSectionNames, setTargetSectionNames] = useState('');
    const [gwaMode, setGwaMode] = useState(true);

    // --- FETCH SECTIONS ---
    useEffect(() => {
        const fetchSections = async () => {
            try {
                const q = query(collection(db, "sections"), orderBy("name"));
                const snap = await getDocs(q);
                setAvailableSections(snap.docs.map(d => d.data()));
            } catch (err) {
                console.error("Failed to load sections", err);
            }
        };
        fetchSections();
    }, []);

    // --- MEMOIZED DATA ---
    const grouped = useMemo(() => {
        const groups = {};
        students.forEach(s => {
            if (!groups[s.gradeLevel]) groups[s.gradeLevel] = {};
            const sec = s.section || 'Unassigned';
            if (!groups[s.gradeLevel][sec]) groups[s.gradeLevel][sec] = [];
            groups[s.gradeLevel][sec].push(s);
        });
        return groups;
    }, [students]);

    const getSelectedStudents = () => students.filter(s => selectedIds.has(s.id));

    // VALIDATION: Check for Promote Eligibility
    const canPromote = useMemo(() => {
        const selected = getSelectedStudents();
        if (selected.length === 0) return false;
        
        const firstSec = selected[0].section;
        
        // Rule 1: All must have a valid section (not Unassigned, not empty)
        const allHaveSection = selected.every(s => s.section && s.section !== 'Unassigned');
        
        // Rule 2: All must be in the same section
        const sameSection = selected.every(s => s.section === firstSec);

        return allHaveSection && sameSection;
    }, [selectedIds, students]);

    // Filter sections based on target grade
    const filteredSections = useMemo(() => {
        if (!targetGrade) return [];
        return availableSections.filter(s => s.gradeLevel === targetGrade);
    }, [availableSections, targetGrade]);

    // --- SELECTION LOGIC ---
    const toggleSelection = (studentId, gradeLevel) => {
        const newSet = new Set(selectedIds);
        
        if (selectedIds.size > 0 && selectionGrade !== gradeLevel) {
            if (!window.confirm(`Switching selection to ${gradeLevel} will clear current selections. Continue?`)) return;
            newSet.clear();
        }

        if (newSet.has(studentId)) {
            newSet.delete(studentId);
            if (newSet.size === 0) setSelectionGrade(null);
        } else {
            newSet.add(studentId);
            setSelectionGrade(gradeLevel);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAllGrade = (gradeLevel, allStudentsInGrade) => {
        const newSet = new Set(selectedIds);
        const allIds = allStudentsInGrade.map(s => s.id);
        const areAllSelected = allIds.every(id => newSet.has(id));

        if (selectedIds.size > 0 && selectionGrade !== gradeLevel) {
            if (!window.confirm(`Switching selection to ${gradeLevel} will clear current selections. Continue?`)) return;
            newSet.clear();
        }

        if (areAllSelected) {
            allIds.forEach(id => newSet.delete(id));
            if (newSet.size === 0) setSelectionGrade(null);
        } else {
            allIds.forEach(id => newSet.add(id));
            setSelectionGrade(gradeLevel);
        }
        setSelectedIds(newSet);
    };

    // --- BATCH ACTION HANDLERS ---

    const openBatchModal = (type) => {
        const selected = getSelectedStudents();
        const firstStudent = selected[0];

        if (type === 'promote') {
            if (!canPromote) {
                alert("To promote, all selected students must be in the SAME assigned section.");
                return;
            }
            
            // Check for Grade 12 (Graduation)
            const isG12 = firstStudent.gradeLevel === 'Grade 12 (SHS)';
            setIsGraduating(isG12);

            if (isG12) {
                setTargetGrade('Graduate');
                setTargetSection('Alumni');
            } else {
                setTargetGrade(getNextGrade(firstStudent.gradeLevel));
                setTargetSection(''); // User must choose
            }
            
            setTargetSY(getNextSchoolYear(firstStudent.schoolYear));
        } 
        else if (type === 'transfer') {
            setTargetGrade(firstStudent.gradeLevel);
            setTargetSY(firstStudent.schoolYear);
            setTargetSection('');
            setIsGraduating(false);
        } 
        else if (type === 'assign') {
            const withGwa = selected.filter(s => s.gwa && parseFloat(s.gwa) > 0).length;
            setGwaMode(withGwa / selected.length >= 0.5);
        }
        setModalMode(type);
    };

    const handleBatchCommit = async () => {
        setProcessing(true);
        const batch = writeBatch(db);
        const selected = getSelectedStudents();

        try {
            if (modalMode === 'transfer') {
                if (!targetSection) throw new Error("Please select a destination section");
                
                selected.forEach(s => {
                    const ref = doc(db, 'enrollments', s.id);
                    batch.update(ref, { section: targetSection.toUpperCase() });
                });
            } 
            else if (modalMode === 'promote') {
                if (!targetGrade || !targetSection || !targetSY) throw new Error("All fields required");
                
                selected.forEach(s => {
                    // Logic: Create NEW record
                    const newRecord = { 
                        ...s, 
                        schoolYear: targetSY, 
                        gradeLevel: targetGrade, 
                        section: targetSection.toUpperCase(), 
                        // If graduating, mark as Archived/Alumni, otherwise Enrolled
                        status: isGraduating ? 'Archived' : 'Enrolled', 
                        enrolledAt: new Date(), 
                        createdAt: new Date(), 
                        studentType: isGraduating ? 'Alumni' : 'Returning' 
                    };
                    delete newRecord.id; // Ensure new ID generation
                    const newRef = doc(collection(db, "enrollments"));
                    batch.set(newRef, newRecord);
                });
            }
            else if (modalMode === 'assign') {
                const sections = targetSectionNames.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
                if (sections.length === 0) throw new Error("Enter at least one section");
                
                const assignments = performAutoSectioning(selected, sections, maxClassSize, gwaMode ? 'rank' : 'stability');
                
                assignments.forEach(assign => {
                    const ref = doc(db, 'enrollments', assign.id);
                    batch.update(ref, { section: assign.newSection });
                });
            }

            await batch.commit();
            alert(`Success! ${selected.length} records processed.`);
            
            // RESET STATE
            setSelectedIds(new Set());
            setSelectionGrade(null);
            setModalMode(null);
            
            // IMPORTANT: TRIGGER REFRESH INSTEAD OF RELOAD
            if (onRefresh) {
                onRefresh(); 
            }

        } catch (error) {
            alert("Error: " + error.message);
        }
        setProcessing(false);
    };

    return (
        <div className="h-full relative">
            <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-8 pb-32">
                {Object.keys(grouped).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-200 shadow-sm">
                            <div className="opacity-30 text-slate-400 scale-150">{Icons.folder}</div>
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Enrolled Students</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">Approve students from the queue to see them here.</p>
                        </div>
                    </div>
                ) : (
                    Object.entries(grouped).sort().map(([grade, sections]) => {
                        const allStudentsInGrade = Object.values(sections).flat();
                        const allSelected = allStudentsInGrade.length > 0 && allStudentsInGrade.every(s => selectedIds.has(s.id));
                        const isGradeDisabled = selectedIds.size > 0 && selectionGrade !== grade;

                        return (
                            <div key={grade} className={`mb-10 last:mb-0 transition-opacity ${isGradeDisabled ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                {/* Sticky Grade Header */}
                                <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-xl border-b border-slate-200 pb-4 mb-6 pt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => toggleSelectAllGrade(grade, allStudentsInGrade)}
                                            className="group flex items-center gap-3 cursor-pointer outline-none"
                                        >
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${allSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white group-hover:border-indigo-400'}`}>
                                                {allSelected && <CheckSquare className="w-4 h-4 text-white" />}
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                                {grade}
                                            </h3>
                                        </button>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                            {allStudentsInGrade.length} Students
                                        </span>
                                    </div>
                                </div>

                                {/* Sections Grid */}
                                <div className="grid grid-cols-1 gap-6">
                                    {Object.entries(sections).sort().map(([secName, list]) => (
                                        <div key={secName} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-5 border-b border-slate-50 pb-4">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                                    {Icons.sections}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-700 uppercase tracking-wide">{secName}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{list.length} Learners</p>
                                                </div>
                                            </div>

                                            {/* Student Cards Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                {list.map(s => {
                                                    const isSelected = selectedIds.has(s.id);
                                                    return (
                                                        <div 
                                                            key={s.id} 
                                                            onClick={() => toggleSelection(s.id, grade)}
                                                            className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none
                                                                ${isSelected 
                                                                    ? 'bg-indigo-50 border-indigo-500 shadow-indigo-100 shadow-md ring-1 ring-indigo-500' 
                                                                    : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-red-200 hover:shadow-lg hover:shadow-red-100/50'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                {/* Checkbox Overlay */}
                                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                                    {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                                                                </div>
                                                                
                                                                {/* Details */}
                                                                <div className="min-w-0">
                                                                    <p className={`text-xs font-bold truncate transition-colors ${isSelected ? 'text-indigo-900' : 'text-slate-700 group-hover:text-red-700'}`}>
                                                                        {s.lastName}, {s.firstName}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <p className="text-[9px] font-bold text-slate-400 truncate">
                                                                            {s.lrn || 'No LRN'}
                                                                        </p>
                                                                        {s.gwa && <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">Avg: {s.gwa}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div onClick={(e) => { e.stopPropagation(); onVerify(s); }} className="text-slate-300 hover:text-indigo-600 bg-white p-2 rounded-lg border border-slate-100 hover:border-indigo-200 shadow-sm transition-all">
                                                                {Icons.eye}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* --- FLOATING ACTION BAR (Mobile Optimized) --- */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-xl text-white p-3 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-10 fade-in duration-300 flex items-center justify-between md:justify-start gap-4 ring-1 ring-white/10">
                    
                    <div className="flex items-center gap-3 pl-2 md:border-r border-slate-700 md:pr-4">
                        <span className="bg-indigo-500 text-white text-xs font-black px-2 py-0.5 rounded-md min-w-[1.5rem] text-center">{selectedIds.size}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 hidden md:block">Selected</span>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        <button 
                            onClick={() => openBatchModal('promote')}
                            disabled={!canPromote}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap
                                ${canPromote 
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                            title={!canPromote ? "Selection must be from the SAME section and have assigned sections" : "Promote to next grade"}
                        >
                            <ArrowUpCircle className="w-4 h-4" /> <span className="hidden sm:inline">Promote</span>
                        </button>

                        <button 
                            onClick={() => openBatchModal('transfer')}
                            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-900/20 whitespace-nowrap"
                        >
                            <ArrowRight className="w-4 h-4" /> <span className="hidden sm:inline">Transfer</span>
                        </button>

                        <button 
                            onClick={() => openBatchModal('assign')}
                            className="flex items-center gap-2 px-3 py-2 bg-white text-slate-900 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg whitespace-nowrap"
                        >
                            <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Auto-Assign</span>
                        </button>
                    </div>

                    <button onClick={() => { setSelectedIds(new Set()); setSelectionGrade(null); }} className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all ml-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* --- PROMOTE/TRANSFER MODAL --- */}
            {(modalMode === 'promote' || modalMode === 'transfer') && (
                <BatchActionModal 
                    isOpen={true} 
                    onClose={() => setModalMode(null)} 
                    title={isGraduating 
                        ? `Archive ${selectedIds.size} Graduates` 
                        : (modalMode === 'promote' ? `Promote ${selectedIds.size} Students` : `Transfer ${selectedIds.size} Students`)}
                    onConfirm={handleBatchCommit}
                    processing={processing}
                    confirmText={isGraduating ? "Confirm Archive" : "Confirm"}
                >
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {isGraduating ? 'New Status' : 'Target Grade'}
                                </p>
                                <p className={`font-black text-sm mt-1 ${isGraduating ? 'text-amber-600' : 'text-slate-800'}`}>
                                    {targetGrade}
                                </p>
                            </div>
                            <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target SY</p>
                                <p className="font-black text-slate-800 text-sm mt-1">{targetSY}</p>
                            </div>
                        </div>

                        {!isGraduating && (
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Destination Section</label>
                                <div className="relative">
                                    <select 
                                        value={targetSection} 
                                        onChange={(e) => setTargetSection(e.target.value)} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Select {targetGrade} Section --</option>
                                        {filteredSections.map(sec => (
                                            <option key={sec.id} value={sec.name}>{sec.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                                </div>
                            </div>
                        )}

                        {modalMode === 'promote' && !isGraduating && (
                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-[10px] text-amber-700 flex gap-2 font-medium">
                                <GraduationCap className="w-4 h-4 shrink-0" />
                                This creates NEW enrollment records for the next school year.
                            </div>
                        )}

                        {isGraduating && (
                            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-[10px] text-indigo-700 flex gap-2 font-medium">
                                <Archive className="w-4 h-4 shrink-0" />
                                Grade 12 students will be moved to the Archived/Alumni list.
                            </div>
                        )}
                    </div>
                </BatchActionModal>
            )}

            {/* --- AUTO ASSIGN MODAL --- */}
            {modalMode === 'assign' && (
                <BatchActionModal 
                    isOpen={true} 
                    onClose={() => setModalMode(null)} 
                    title="Auto-Sectioning"
                    onConfirm={handleBatchCommit}
                    processing={processing}
                    confirmText="Run Assignment"
                >
                    <div className="space-y-4">
                        <div className="bg-slate-100 p-3 rounded-xl flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600 uppercase">Algorithm Mode</span>
                            <span className={`text-xs font-black uppercase px-2 py-1 rounded ${gwaMode ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {gwaMode ? 'GWA Ranking' : 'Stability Mode'}
                            </span>
                        </div>
                        {!gwaMode && <p className="text-[10px] text-amber-600">Most selected students lack GWA. System will balance randomly/alphabetically.</p>}
                        
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Max Students per Section</label>
                            <input type="number" value={maxClassSize} onChange={(e) => setMaxClassSize(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Target Sections (Comma Separated)</label>
                            <textarea value={targetSectionNames} onChange={(e) => setTargetSectionNames(e.target.value)} placeholder="e.g. St. Matthew, St. Mark, St. Luke" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-4 focus:ring-indigo-100 outline-none h-24 resize-none uppercase" />
                        </div>
                    </div>
                </BatchActionModal>
            )}
        </div>
    );
};

export default MasterList;