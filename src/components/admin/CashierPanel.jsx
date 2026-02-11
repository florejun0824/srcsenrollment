import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom'; 
import { collection, query, where, getDocs, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore'; 
import { db } from '../../firebase';
import { Search, RefreshCw, CreditCard, Calendar, FileText, Download, Users, Printer, Edit3, Save, X, CheckCircle, Wallet, Building2, Banknote, Ban, AlertTriangle, Trash2 } from 'lucide-react';
import FinanceModal from './FinanceModal';
import { calculateTotalFees } from '../../utils/FeeConstants';
import { pdf } from '@react-pdf/renderer';
import TransactionReportPDF from './TransactionReportPDF'; 
import OfficialReceiptPDF from './OfficialReceiptPDF';

// --- HELPER: FORMAT CURRENCY ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
};

// --- HELPER: NORMALIZE STUDENT DATA ---
const normalizeStudentData = (docId, data) => {
    let financialData = data.soa;
    if (!financialData) {
        const feeCalc = calculateTotalFees(data.gradeLevel);
        if (feeCalc) {
            financialData = {
                totalAssessment: feeCalc.totalAssessment,
                balance: feeCalc.totalAssessment,
                paymentStatus: 'Unpaid',
                feeBreakdown: feeCalc,
                payments: [] 
            };
        } else {
            financialData = { totalAssessment: 0, balance: 0, paymentStatus: 'N/A', payments: [] };
        }
    }
    return { id: docId, ...data, ...financialData };
};

// --- COMPONENT: VOID TRANSACTION MODAL ---
const VoidTransactionModal = ({ transaction, onClose, onConfirm, isProcessing }) => createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up transform transition-all">
            <div className="bg-red-50 p-6 text-center border-b border-red-100">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ring-4 ring-white">
                    <Ban className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-red-700 uppercase tracking-tight">Void Transaction</h3>
                <p className="text-xs text-red-600/80 font-bold mt-1 uppercase tracking-wide">This action cannot be undone</p>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="text-center space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Receipt Number</p>
                    <p className="text-xl font-black text-slate-800 font-mono tracking-tight">{transaction.orNumber}</p>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-center relative overflow-hidden group">
                     <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 relative z-10">Amount to Reverse</p>
                     <p className="text-3xl font-black text-slate-800 relative z-10">{formatCurrency(transaction.amount)}</p>
                </div>

                <div className="text-center px-2">
                    <p className="text-xs text-slate-500 leading-relaxed">
                        <span className="font-bold text-slate-800">{transaction.studentName}'s</span> balance will be automatically adjusted to reflect this cancellation.
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                        Confirm Void
                    </button>
                </div>
            </div>
        </div>
    </div>,
    document.body
);

// --- COMPONENT: EDIT TRANSACTION MODAL ---
const EditTransactionModal = ({ transaction, student, onClose, onSave, isSaving }) => {
    const [formData, setFormData] = useState({
        orNumber: transaction.orNumber,
        mode: transaction.mode,
        date: transaction.dateObj.toISOString().split('T')[0],
        allocation: transaction.allocation || {}
    });

    const feeKeys = useMemo(() => {
        const breakdown = student.soa?.feeBreakdown || {};
        const keys = [];
        if (breakdown.tuition) keys.push('Tuition Fee');
        if (breakdown.standard) keys.push(...Object.keys(breakdown.standard));
        if (breakdown.nonStandard) keys.push(...Object.keys(breakdown.nonStandard));
        return keys;
    }, [student]);

    const currentTotal = useMemo(() => {
        return Object.values(formData.allocation).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    }, [formData.allocation]);

    const handleAllocationChange = (key, value) => {
        const numVal = parseFloat(value);
        setFormData(prev => ({
            ...prev,
            allocation: {
                ...prev.allocation,
                [key]: isNaN(numVal) ? 0 : numVal
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalAllocation = {};
        Object.entries(formData.allocation).forEach(([k, v]) => {
            if (v > 0) finalAllocation[k] = v;
        });

        onSave({
            ...transaction,
            amount: currentTotal, 
            orNumber: formData.orNumber,
            mode: formData.mode,
            newDate: new Date(formData.date),
            allocation: finalAllocation
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md md:max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center shrink-0">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-indigo-600"/> Edit Transaction
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                        
                        {/* WARNING */}
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 shrink-0"><AlertTriangle className="w-5 h-5" /></div>
                            <div>
                                <p className="text-xs font-bold text-amber-800 uppercase">Balance Impact</p>
                                <p className="text-[11px] text-amber-700 leading-relaxed mt-1">
                                    Modifying allocations will automatically recalculate the student's outstanding balance. Ensure the total matches the actual payment received.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* LEFT COLUMN: DETAILS */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OR Number</label>
                                    <input 
                                        type="text" 
                                        value={formData.orNumber}
                                        onChange={e => setFormData({...formData, orNumber: e.target.value})}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
                                    <input 
                                        type="date" 
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-indigo-500 outline-none text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Mode</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Cash', 'GCash', 'Bank Transfer'].map((mode) => (
                                            <button
                                                key={mode}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, mode }))}
                                                className={`px-2 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${formData.mode === mode ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:bg-indigo-50'}`}
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-wide">{mode}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: ALLOCATION */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full max-h-[300px] md:max-h-none">
                                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fee Breakdown</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</span>
                                </div>
                                <div className="divide-y divide-slate-100 bg-white overflow-y-auto custom-scrollbar">
                                    {feeKeys.map(key => (
                                        <div key={key} className="flex justify-between items-center px-4 py-2.5 hover:bg-slate-50 transition-colors">
                                            <span className="text-xs font-bold text-slate-700 truncate pr-4">{key}</span>
                                            <input 
                                                type="number" 
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={formData.allocation[key] || ''}
                                                onChange={(e) => handleAllocationChange(key, e.target.value)}
                                                className="w-24 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all focus:ring-2 focus:ring-indigo-100"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="p-4 md:p-6 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</span>
                            <span className="text-2xl font-black text-indigo-600">{formatCurrency(currentTotal)}</span>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isSaving || currentTotal <= 0}
                            className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                        >
                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body 
    );
};

// --- COMPONENT: SUCCESS MODAL ---
const PaymentSuccessModal = ({ data, onClose, onPrint }) => createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-bounce-in text-center p-8 relative">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                <CheckCircle className="w-10 h-10" />
            </div>
            
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Transaction Saved</h2>
            <p className="text-xs text-slate-500 font-medium mb-8">The payment record has been successfully updated.</p>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 space-y-3">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">Amount</span>
                    <span className="text-slate-900 font-black text-lg">{formatCurrency(data.amount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-wider">OR Number</span>
                    <span className="text-indigo-600 font-bold font-mono">{data.orNumber}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button onClick={onClose} className="py-3 px-4 rounded-xl border border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors">
                    Dismiss
                </button>
                <button onClick={() => onPrint(data)} className="py-3 px-4 rounded-xl bg-indigo-600 font-bold text-xs uppercase tracking-wider text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex items-center justify-center gap-2">
                    <Printer className="w-4 h-4" /> Receipt
                </button>
            </div>
        </div>
    </div>,
    document.body
);

// --- MAIN COMPONENT ---
const CashierPanel = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    
    // STATES
    const [viewMode, setViewMode] = useState('accounts'); 
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reprintingId, setReprintingId] = useState(null); 
    
    // EDITING STATES
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const [successData, setSuccessData] = useState(null); 
    
    // VOIDING STATES
    const [voidingTransaction, setVoidingTransaction] = useState(null);
    const [isVoiding, setIsVoiding] = useState(false);

    // --- 1. FETCH ALL STUDENTS ---
    const fetchStudents = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "enrollments"), where("status", "==", "Enrolled"));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => normalizeStudentData(doc.id, doc.data()));
            data.sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));
            setStudents(data);
        } catch (error) {
            console.error("Error fetching students:", error);
            alert("Error loading student list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStudents(); }, []);

    // --- 2. SINGLE DOC REFRESH ---
    const handlePaymentUpdate = async (updatedTx = null) => {
        if (updatedTx) setSuccessData(updatedTx);

        const targetId = selectedStudent ? selectedStudent.id : (updatedTx ? updatedTx.studentId : null);
        if (!targetId) return;

        try {
            const studentRef = doc(db, "enrollments", targetId);
            const studentSnap = await getDoc(studentRef);

            if (studentSnap.exists()) {
                const updatedStudent = normalizeStudentData(studentSnap.id, studentSnap.data());
                setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
            }
        } catch (error) {
            console.error("Error refreshing student:", error);
        }
    };

    // --- 3. HANDLE SAVE EDITED TRANSACTION ---
    const saveEditedTransaction = async (updatedTx) => {
        setIsSavingEdit(true);
        try {
            const [studentId, idxStr] = updatedTx.id.split('_');
            const idx = parseInt(idxStr);

            const studentRef = doc(db, "enrollments", studentId);
            const snap = await getDoc(studentRef);
            
            if (!snap.exists()) throw new Error("Student not found");
            const data = snap.data();

            const oldPayment = data.soa.payments[idx];
            
            const amountDiff = updatedTx.amount - oldPayment.amount; 
            const newBalance = data.soa.balance - amountDiff;

            const updatedPayments = [...data.soa.payments];
            updatedPayments[idx] = {
                ...updatedPayments[idx],
                amount: updatedTx.amount,
                orNumber: updatedTx.orNumber,
                mode: updatedTx.mode,
                allocation: updatedTx.allocation, 
                date: Timestamp.fromDate(updatedTx.newDate)
            };

            await updateDoc(studentRef, {
                "soa.payments": updatedPayments,
                "soa.balance": newBalance
            });

            setEditingTransaction(null);
            await handlePaymentUpdate({ ...updatedTx, studentId, date: updatedTx.newDate }); 

        } catch (error) {
            console.error("Edit Error:", error);
            alert("Failed to update transaction.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    // --- 4. HANDLE VOID TRANSACTION (OPEN MODAL) ---
    const handleVoidClick = (transaction) => {
        setVoidingTransaction(transaction);
    };

    // --- 5. CONFIRM VOID (FIRESTORE) ---
    const confirmVoidTransaction = async () => {
        if (!voidingTransaction) return;
        setIsVoiding(true);

        try {
            const transaction = voidingTransaction;
            const [studentId, idxStr] = transaction.id.split('_');
            const idx = parseInt(idxStr);
            const studentRef = doc(db, "enrollments", studentId);
            const snap = await getDoc(studentRef);
            const data = snap.data();

            const newBalance = data.soa.balance + transaction.amount;

            const updatedPayments = [...data.soa.payments];
            updatedPayments[idx] = {
                ...updatedPayments[idx],
                isVoid: true,
                voidedAt: Timestamp.now(),
                voidedBy: 'Cashier' 
            };

            await updateDoc(studentRef, {
                "soa.payments": updatedPayments,
                "soa.balance": newBalance
            });

            // Refresh UI
            const updatedStudent = normalizeStudentData(snap.id, { ...data, soa: { ...data.soa, payments: updatedPayments, balance: newBalance }});
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
            
            setVoidingTransaction(null); // Close Modal

        } catch (error) {
            console.error("Void Error:", error);
            alert("Failed to void transaction.");
        } finally {
            setIsVoiding(false);
        }
    };

    // --- DERIVED DATA ---
    const allTransactions = useMemo(() => {
        let txs = [];
        students.forEach(student => {
            if (student.soa?.payments) {
                student.soa.payments.forEach((payment, idx) => {
                    txs.push({
                        ...payment,
                        id: `${student.id}_${idx}`, 
                        studentId: student.id, 
                        studentName: `${student.lastName}, ${student.firstName}`,
                        studentRaw: { firstName: student.firstName, lastName: student.lastName, gradeLevel: student.gradeLevel },
                        dateObj: payment.date.seconds ? new Date(payment.date.seconds * 1000) : new Date(payment.date),
                        studentFull: student 
                    });
                });
            }
        });
        return txs.sort((a, b) => b.dateObj - a.dateObj);
    }, [students]);

    const filteredTransactions = useMemo(() => {
        const start = new Date(dateRange.start); start.setHours(0,0,0,0);
        const end = new Date(dateRange.end); end.setHours(23,59,59,999);
        return allTransactions.filter(t => t.dateObj >= start && t.dateObj <= end);
    }, [allTransactions, dateRange]);

    const filteredStudents = useMemo(() => {
        if (!search) return students;
        const lower = search.toLowerCase();
        return students.filter(s => (s.lastName?.toLowerCase() || "").includes(lower) || (s.studentID?.toLowerCase() || "").includes(lower));
    }, [students, search]);

    // --- PDF ACTIONS ---
    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        const validTxs = filteredTransactions.filter(t => !t.isVoid);
        try {
            const blob = await pdf(<TransactionReportPDF transactions={validTxs} dateRange={dateRange} />).toBlob();
            window.open(URL.createObjectURL(blob), '_blank');
        } catch (error) { alert("Report Error"); } finally { setIsGeneratingReport(false); }
    };

    const handleReprintReceipt = async (transaction) => {
        if (transaction.isVoid) return alert("Cannot reprint a voided receipt.");
        setReprintingId(transaction.id);
        try {
            const blob = await pdf(<OfficialReceiptPDF payment={transaction} student={transaction.studentRaw} />).toBlob();
            window.open(URL.createObjectURL(blob), '_blank');
        } catch (error) { alert("Reprint Error"); } finally { setReprintingId(null); }
    };

    const totalCollected = filteredTransactions.reduce((acc, t) => t.isVoid ? acc : acc + t.amount, 0);

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* --- HEADER CONTROLS --- */}
            <div className="p-6 pb-2">
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-fit mb-6 shadow-sm">
                    <button onClick={() => setViewMode('accounts')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'accounts' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <Users className="w-4 h-4" /> Accounts List
                    </button>
                    <button onClick={() => setViewMode('history')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'history' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <FileText className="w-4 h-4" /> Transaction History
                    </button>
                </div>

                {viewMode === 'accounts' ? (
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Search Student..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all"/>
                        </div>
                        <button onClick={fetchStudents} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors" title="Reload Data"><RefreshCw className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Start</label><input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"/></div>
                            <div className="flex flex-col"><label className="text-[9px] font-bold text-slate-400 uppercase ml-1">End</label><input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"/></div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valid Collection</p>
                                <p className="text-xl font-black text-indigo-600">{formatCurrency(totalCollected)}</p>
                            </div>
                            <button onClick={handleGenerateReport} disabled={isGeneratingReport || filteredTransactions.length === 0} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50">
                                {isGeneratingReport ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />} Report
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- CONTENT TABLE --- */}
            <div className="flex-1 overflow-auto px-6 pb-6 custom-scrollbar">
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-w-[800px] md:min-w-0">
                    {viewMode === 'accounts' ? (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Assessment</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (<tr><td colSpan="4" className="p-8 text-center text-xs font-bold text-slate-400 animate-pulse">Loading...</td></tr>) : 
                                filteredStudents.length === 0 ? (<tr><td colSpan="4" className="p-8 text-center text-xs font-bold text-slate-400">No students found.</td></tr>) : 
                                filteredStudents.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4"><div className="flex flex-col"><span className="text-sm font-bold text-slate-800">{s.lastName}, {s.firstName}</span><span className="text-[10px] font-bold text-slate-400 uppercase">{s.gradeLevel}</span></div></td>
                                        <td className="px-6 py-4"><span className="text-xs font-bold text-slate-600">{formatCurrency(s.soa?.totalAssessment)}</span></td>
                                        <td className="px-6 py-4 text-right"><span className={`text-sm font-black ${s.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatCurrency(s.balance)}</span></td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => setSelectedStudent(s)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-indigo-100">
                                                <CreditCard className="w-4 h-4" /> Pay
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Time</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">OR Number</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.length === 0 ? (<tr><td colSpan="6" className="p-8 text-center text-xs font-bold text-slate-400">No transactions.</td></tr>) :
                                filteredTransactions.map((t, i) => (
                                    <tr key={i} className={`hover:bg-slate-50 transition-colors ${t.isVoid ? 'bg-red-50/50 grayscale' : ''}`}>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                            {t.dateObj.toLocaleDateString()} 
                                            {t.isVoid && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded uppercase">VOID</span>}
                                        </td>
                                        <td className={`px-6 py-4 text-xs font-bold ${t.isVoid ? 'text-slate-400 line-through' : 'text-indigo-600'}`}>{t.orNumber}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-800">{t.studentName}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase border border-slate-200">{t.mode}</span>
                                        </td>
                                        <td className={`px-6 py-4 text-right text-sm font-black ${t.isVoid ? 'text-slate-400 line-through' : 'text-emerald-600'}`}>{formatCurrency(t.amount)}</td>
                                        <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                                            {!t.isVoid && (
                                                <>
                                                    <button onClick={() => setEditingTransaction(t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    {/* Changed from direct call to opening the modal */}
                                                    <button onClick={() => handleVoidClick(t)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Void Receipt">
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleReprintReceipt(t)} disabled={reprintingId === t.id} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Reprint">
                                                        {reprintingId === t.id ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Printer className="w-4 h-4" />}
                                                    </button>
                                                </>
                                            )}
                                            {t.isVoid && <span className="text-[9px] text-slate-400 italic">No Actions</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* --- MODALS --- */}
            {selectedStudent && <FinanceModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onUpdate={handlePaymentUpdate} />}
            {editingTransaction && <EditTransactionModal transaction={editingTransaction} student={editingTransaction.studentFull} onClose={() => setEditingTransaction(null)} onSave={saveEditedTransaction} isSaving={isSavingEdit} />}
            {successData && <PaymentSuccessModal data={successData} onClose={() => setSuccessData(null)} onPrint={() => { handleReprintReceipt(successData); setSuccessData(null); }} />}
            {voidingTransaction && <VoidTransactionModal transaction={voidingTransaction} onClose={() => setVoidingTransaction(null)} onConfirm={confirmVoidTransaction} isProcessing={isVoiding} />}
        </div>
    );
};

export default CashierPanel;