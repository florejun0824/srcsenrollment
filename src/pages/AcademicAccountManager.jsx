// src/pages/AcademicAccountManager.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, orderBy, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
// FIX: Added ArrowLeft to imports
import { Search, UserPlus, FileUp, Download, LogOut, Trash2, Edit, Users, Eye, EyeOff, CheckSquare, Square, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

import AddAccountModal from '../components/admin/AddAccountModal';
import EditAccountModal from '../components/admin/EditAccountModal';
import GenerateAccountsModal from '../components/admin/GenerateAccountsModal';
import DownloadAccountsModal from '../components/admin/DownloadAccountsModal';

const AcademicAccountManager = () => {
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]); // Stores ALL data
    const [filteredAccounts, setFilteredAccounts] = useState([]); // Stores SEARCH results
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // --- SELECTION STATE ---
    const [selectedIds, setSelectedIds] = useState([]);
    const [visiblePasswords, setVisiblePasswords] = useState({});

    // Modal States
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null); 

    const navigate = useNavigate();

    // --- AUTH & DATA ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) fetchAccounts();
            else setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- SEARCH & FILTER LOGIC ---
    useEffect(() => {
        if (!searchQuery) {
            setFilteredAccounts(accounts);
        } else {
            const lowerQ = searchQuery.toLowerCase();
            setFilteredAccounts(accounts.filter(acc => 
                acc.studentName.toLowerCase().includes(lowerQ) || 
                acc.username.toLowerCase().includes(lowerQ)
            ));
        }
        // RESET TO PAGE 1 WHEN SEARCHING
        setCurrentPage(1); 
    }, [searchQuery, accounts]);

    // --- PAGINATION CALCULATION ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAccounts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "student_accounts"), orderBy("studentName"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setAccounts(data);
            setFilteredAccounts(data);
            setSelectedIds([]); 
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    // --- SELECTION HANDLERS ---
    const handleSelectAll = () => {
        const currentIds = filteredAccounts.map(acc => acc.id);
        if (selectedIds.length === currentIds.length) {
            setSelectedIds([]); 
        } else {
            setSelectedIds(currentIds); 
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    // --- DELETE HANDLERS ---
    const handleDelete = async (id, name) => {
        if (!confirm(`Are you sure you want to delete the account for ${name}?`)) return;
        try {
            await deleteDoc(doc(db, "student_accounts", id));
            setAccounts(prev => prev.filter(acc => acc.id !== id));
            setSelectedIds(prev => prev.filter(item => item !== id));
        } catch (error) {
            alert("Error deleting: " + error.message);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected accounts?`)) return;

        setLoading(true);
        try {
            const batch = writeBatch(db);
            selectedIds.forEach(id => {
                batch.delete(doc(db, "student_accounts", id));
            });
            await batch.commit();
            
            setAccounts(prev => prev.filter(acc => !selectedIds.includes(acc.id)));
            setSelectedIds([]);
            alert("Selected accounts deleted successfully.");
        } catch (error) {
            alert("Error deleting batch: " + error.message);
        }
        setLoading(false);
    };

    const handleDeleteAll = async () => {
        if (accounts.length === 0) return;
        if (!confirm("⚠️ WARNING: This will delete ALL student accounts.\n\nAre you sure you want to proceed?")) return;

        setLoading(true);
        try {
            const chunkArray = (arr, size) => {
                return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
                    arr.slice(i * size, i * size + size)
                );
            };

            const chunks = chunkArray(accounts, 400); 
            
            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach(acc => {
                    batch.delete(doc(db, "student_accounts", acc.id));
                });
                await batch.commit();
            }

            setAccounts([]);
            setFilteredAccounts([]);
            setSelectedIds([]);
            alert("All accounts have been deleted.");
        } catch (error) {
            alert("Error deleting all: " + error.message);
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/student-portal');
    };

    const togglePassword = (id) => {
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (!user && !loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-500">Access Denied.</div>;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-6 relative overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                 <div className="absolute inset-0 bg-[url('/2.png')] bg-cover opacity-10" />
                 <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-slate-950/90" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* HEADER (UPDATED WITH BACK BUTTON) */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                    <div className="flex flex-col gap-4">
                        {/* BACK BUTTON */}
                        <div>
                            <button 
                                onClick={() => navigate('/student-portal', { state: { viewMode: 'teacher-select' } })}
                                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all active:scale-95 w-fit"
                            >
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Back to Menu</span>
                            </button>
                        </div>

                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                <span className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                                    <Users className="w-6 h-6 text-white" />
                                </span>
                                Academic Accounts
                            </h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2 ml-1">
                                {filteredAccounts.length} Accounts Found • Page {currentPage} of {totalPages || 1}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search students..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-900/80 transition-all w-64 shadow-lg"
                            />
                        </div>
                        <button onClick={handleLogout} className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-white/10 transition-all">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ACTION TOOLBAR */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {selectedIds.length > 0 ? (
                        <div className="flex items-center gap-4 w-full bg-indigo-900/20 p-4 rounded-2xl border border-indigo-500/30 animate-fade-in">
                            <span className="text-indigo-300 font-bold text-sm uppercase tracking-wider pl-2">
                                {selectedIds.length} Selected
                            </span>
                            <div className="h-6 w-px bg-white/10 mx-2"></div>
                            <button 
                                onClick={handleDeleteSelected}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2 rounded-xl font-bold uppercase text-xs flex items-center gap-2 border border-red-500/20 transition-all shadow-lg"
                            >
                                <Trash2 className="w-4 h-4" /> Delete Selected
                            </button>
                            <button 
                                onClick={() => setSelectedIds([])}
                                className="text-slate-500 hover:text-white px-4 py-2 rounded-xl font-bold uppercase text-xs transition-colors"
                            >
                                Cancel Selection
                            </button>
                        </div>
                    ) : (
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <button onClick={() => setIsAddOpen(true)} className="group bg-slate-800 hover:bg-indigo-600 p-4 rounded-xl border border-white/10 transition-all flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg"><UserPlus className="w-5 h-5 text-white" /></div>
                                <div className="text-left"><h3 className="text-white font-bold text-xs uppercase">Add User</h3></div>
                            </button>
                            <button onClick={() => setIsGenerateOpen(true)} className="group bg-slate-800 hover:bg-emerald-600 p-4 rounded-xl border border-white/10 transition-all flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg"><FileUp className="w-5 h-5 text-white" /></div>
                                <div className="text-left"><h3 className="text-white font-bold text-xs uppercase">Import Excel</h3></div>
                            </button>
                            <button onClick={() => setIsDownloadOpen(true)} className="group bg-slate-800 hover:bg-blue-600 p-4 rounded-xl border border-white/10 transition-all flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-lg"><Download className="w-5 h-5 text-white" /></div>
                                <div className="text-left"><h3 className="text-white font-bold text-xs uppercase">Export List</h3></div>
                            </button>
                            
                            {accounts.length > 0 && (
                                <button 
                                    onClick={handleDeleteAll}
                                    className="group bg-slate-800 hover:bg-red-900/50 p-4 rounded-xl border border-white/10 hover:border-red-500/30 transition-all flex items-center gap-3"
                                >
                                    <div className="bg-red-500/10 p-2 rounded-lg group-hover:bg-red-500/20"><Trash2 className="w-5 h-5 text-red-400" /></div>
                                    <div className="text-left"><h3 className="text-red-400 font-bold text-xs uppercase">Delete All</h3></div>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* TABLE */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[400px] flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/20 border-b border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="p-6 w-16 text-center">
                                        <button onClick={handleSelectAll} className="text-slate-500 hover:text-white transition-colors">
                                            {selectedIds.length > 0 && selectedIds.length === filteredAccounts.length ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5" />}
                                        </button>
                                    </th>
                                    <th className="p-6">Student Name</th>
                                    <th className="p-6">Username</th>
                                    <th className="p-6">Password</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm font-bold text-slate-300">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-10 text-center text-slate-500">Loading accounts...</td></tr>
                                ) : filteredAccounts.length === 0 ? (
                                    <tr><td colSpan="5" className="p-10 text-center text-slate-500">No accounts found.</td></tr>
                                ) : (
                                    currentItems.map((acc) => {
                                        const isSelected = selectedIds.includes(acc.id);
                                        return (
                                            <tr key={acc.id} className={`transition-colors group ${isSelected ? 'bg-indigo-900/10' : 'hover:bg-white/[0.02]'}`}>
                                                <td className="p-6 text-center">
                                                    <button onClick={() => handleSelectOne(acc.id)} className="text-slate-500 hover:text-white transition-colors">
                                                        {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-400" /> : <Square className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-black border border-white/10">
                                                            {acc.studentName.charAt(0)}
                                                        </div>
                                                        <span className={isSelected ? 'text-indigo-200' : 'text-white uppercase tracking-wide'}>{acc.studentName}</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 font-mono text-indigo-400">{acc.username}</td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`font-mono ${visiblePasswords[acc.id] ? 'text-slate-300' : 'text-slate-600 tracking-widest'}`}>
                                                            {visiblePasswords[acc.id] ? acc.password : '••••••••'}
                                                        </span>
                                                        <button onClick={() => togglePassword(acc.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                                                            {visiblePasswords[acc.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => setEditingAccount(acc)} className="p-2 hover:bg-white/10 rounded-lg text-indigo-400 transition-colors" title="Edit">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(acc.id, acc.studentName)} className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors" title="Delete">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>

                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                Page <span className="text-white">{currentPage}</span> of {totalPages}
                            </span>

                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            {isAddOpen && <AddAccountModal onClose={() => setIsAddOpen(false)} onSuccess={fetchAccounts} />}
            {isGenerateOpen && <GenerateAccountsModal onClose={() => setIsGenerateOpen(false)} onSuccess={fetchAccounts} />}
            {isDownloadOpen && <DownloadAccountsModal accounts={filteredAccounts} onClose={() => setIsDownloadOpen(false)} />}
            {editingAccount && <EditAccountModal account={editingAccount} onClose={() => setEditingAccount(null)} onSuccess={fetchAccounts} />}
        </div>
    );
};

export default AcademicAccountManager;