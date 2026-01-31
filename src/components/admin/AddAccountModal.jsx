// src/components/admin/AddAccountModal.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { X, Check, Loader2, User, GraduationCap, Layers, Lock, ChevronDown, AlignLeft } from 'lucide-react';

const AddAccountModal = ({ onClose, onSuccess }) => {
    // --- STATE ---
    const [form, setForm] = useState({ 
        lastName: '', 
        firstName: '', 
        mi: '', 
        username: '', 
        password: '',
        gradeLevel: '',
        section: ''
    });
    const [loading, setLoading] = useState(false);
    
    // Section Data State
    const [allSections, setAllSections] = useState([]);
    const [gradeLevelOptions, setGradeLevelOptions] = useState([]);
    const [filteredSections, setFilteredSections] = useState([]);
    const [loadingSections, setLoadingSections] = useState(true);

    // --- FETCH SECTIONS LOGIC ---
    useEffect(() => {
        const fetchSections = async () => {
            try {
                // Read Optimized: Fetch all sections once and filter locally
                const q = query(collection(db, "sections"), orderBy("name"));
                const snap = await getDocs(q);
                const sectionsData = snap.docs.map(d => ({ 
                    id: d.id, 
                    sectionName: d.data().name || "Unnamed", 
                    gradeLevel: d.data().gradeLevel || "Unassigned"
                }));
                setAllSections(sectionsData);
                
                // Extract unique grades
                const uniqueGrades = [...new Set(sectionsData.map(s => s.gradeLevel))].sort((a, b) => {
                    // Numeric sort for grades like "Grade 7", "Grade 10"
                    const numA = parseInt(a.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.replace(/\D/g, '')) || 0;
                    return numA - numB;
                });
                setGradeLevelOptions(uniqueGrades);
            } catch (error) {
                console.error("Error loading sections:", error);
            }
            setLoadingSections(false);
        };
        fetchSections();
    }, []);

    // --- FILTER SECTIONS ON GRADE CHANGE ---
    useEffect(() => {
        if (form.gradeLevel) {
            const relevant = allSections.filter(s => s.gradeLevel === form.gradeLevel);
            setFilteredSections(relevant);
            
            // Reset section if it doesn't belong to new grade
            if (!relevant.some(s => s.sectionName === form.section)) {
                setForm(prev => ({ ...prev, section: '' }));
            }
        } else {
            setFilteredSections([]);
            setForm(prev => ({ ...prev, section: '' }));
        }
    }, [form.gradeLevel, allSections]);

    // --- HANDLERS ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.gradeLevel || !form.section) {
            alert("Please select a Grade Level and Section.");
            return;
        }

        setLoading(true);
        try {
            const miPart = form.mi ? `${form.mi.charAt(0)}.` : '';
            const fullName = `${form.lastName}, ${form.firstName} ${miPart}`.toUpperCase().trim();
            
            await addDoc(collection(db, "student_accounts"), {
                studentName: fullName,
                username: form.username,
                password: form.password,
                gradeLevel: form.gradeLevel,
                section: form.section,
                createdAt: new Date()
            });
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Aurora Effects */}
                <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-indigo-200/50 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-emerald-100/50 rounded-full blur-[80px] pointer-events-none"></div>

                {/* Header */}
                <div className="relative z-10 px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/40">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <span className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                                <User className="w-5 h-5" />
                            </span>
                            New Student
                        </h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 ml-1">
                            Manual Account Creation
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="relative z-10 p-8 overflow-y-auto custom-scrollbar flex-1">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Section 1: Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <AlignLeft className="w-3 h-3" /> Student Information
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <input 
                                        type="text" 
                                        placeholder="Last Name" 
                                        required 
                                        value={form.lastName} 
                                        onChange={e=>setForm({...form, lastName: e.target.value})} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400 uppercase" 
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <input 
                                        type="text" 
                                        placeholder="First Name" 
                                        required 
                                        value={form.firstName} 
                                        onChange={e=>setForm({...form, firstName: e.target.value})} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400 uppercase" 
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input 
                                        type="text" 
                                        placeholder="Middle Initial (Optional)" 
                                        maxLength={2} 
                                        value={form.mi} 
                                        onChange={e=>setForm({...form, mi: e.target.value})} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400 uppercase" 
                                    />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Section 2: Academic Grouping */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-3 h-3" /> Academic Placement
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative group col-span-2 sm:col-span-1">
                                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <select 
                                        value={form.gradeLevel} 
                                        onChange={e=>setForm({...form, gradeLevel: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                        disabled={loadingSections}
                                    >
                                        <option value="">Select Grade</option>
                                        {gradeLevelOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>

                                <div className="relative group col-span-2 sm:col-span-1">
                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <select 
                                        value={form.section} 
                                        onChange={e=>setForm({...form, section: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        disabled={!form.gradeLevel || loadingSections}
                                    >
                                        <option value="">Select Section</option>
                                        {filteredSections.map(s => <option key={s.id} value={s.sectionName}>{s.sectionName}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Section 3: Credentials */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Lock className="w-3 h-3" /> Login Credentials
                            </h3>
                            <div className="space-y-3">
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Username" 
                                        required 
                                        value={form.username} 
                                        onChange={e=>setForm({...form, username: e.target.value})} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400" 
                                    />
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Password" 
                                        required 
                                        value={form.password} 
                                        onChange={e=>setForm({...form, password: e.target.value})} 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400" 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-4 flex gap-3">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={loading} 
                                className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-500 hover:to-teal-600 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {loading ? 'Saving...' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddAccountModal;