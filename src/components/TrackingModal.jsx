import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { pdf } from '@react-pdf/renderer'; 
import EnrollmentPDF from './EnrollmentPDF'; 
import { 
    X, Search, Loader2, CheckCircle, Clock, Download, 
    Receipt, Calculator, AlertCircle, Lock,
    Smartphone, Landmark, Banknote
} from 'lucide-react';

const TrackingModal = ({ isOpen, onClose }) => {
    const [refNumber, setRefNumber] = useState('');
    const [lastNameVerify, setLastNameVerify] = useState(''); 
    const [status, setStatus] = useState(null); 
    const [resultData, setResultData] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
    };

    if (!isOpen) return null;

    const handleCheck = async (e) => {
        e.preventDefault();
        if (!refNumber.trim() || !lastNameVerify.trim()) return;

        setStatus('loading');
        setResultData(null);

        try {
            const q = query(
                collection(db, "enrollments"), 
                where("referenceNumber", "==", refNumber.trim())
            );
            
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                if (docData.lastName?.toLowerCase() === lastNameVerify.trim().toLowerCase()) {
                    setResultData(docData);
                    setStatus('found');
                } else {
                    setStatus('not-found');
                }
            } else {
                setStatus('not-found');
            }
        } catch (error) {
            console.error("Tracking Error:", error);
            setStatus('error');
        }
    };

    const handleDownloadPdf = async () => {
        if (!resultData) return;
        setDownloading(true);
        try {
            const blob = await pdf(<EnrollmentPDF data={resultData} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${resultData.lastName}_EnrollmentForm.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download Error:", error);
            alert("Failed to download PDF.");
        } finally {
            setDownloading(false);
        }
    };

    const getStatusColor = (s) => {
        switch(s?.toLowerCase()) {
            case 'enrolled': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'rejected': return 'text-red-600 bg-red-50 border-red-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    // Helper to render lists (Standard Fees, etc.)
    const renderFeeList = (feesObj, isDeduction = false) => {
        if (!feesObj) return null;
        return Object.entries(feesObj).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 border-dashed">
                <span className={`text-[10px] font-medium uppercase tracking-wide truncate pr-2 ${isDeduction ? 'text-emerald-600' : 'text-slate-500'}`}>{key}</span>
                <span className={`text-xs font-bold whitespace-nowrap ${isDeduction ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {isDeduction ? '-' : ''}{formatCurrency(value)}
                </span>
            </div>
        ));
    };

    // Helper to get Icon based on payment mode
    const getPaymentIcon = (mode) => {
        const m = mode?.toLowerCase() || '';
        if (m.includes('gcash')) return <Smartphone size={16} />;
        if (m.includes('bank')) return <Landmark size={16} />;
        return <Banknote size={16} />; // Default to Cash
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className={`relative bg-white md:rounded-[2rem] shadow-2xl transition-all duration-500 ease-in-out border border-white ring-1 ring-slate-100 overflow-hidden flex flex-col 
                ${resultData ? 'w-full h-full md:w-[95vw] md:h-[90vh] md:max-w-[1400px]' : 'w-full h-full md:h-auto md:w-full md:max-w-md md:max-h-[90vh]'}`}>
                
                {/* --- HEADER --- */}
                <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-md shrink-0 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Search size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight leading-tight">Track Application</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">Real-time Enrollment Status</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white border border-slate-100 rounded-full transition text-slate-400 hover:text-red-500 hover:border-red-100 shadow-sm">
                        <X size={18} />
                    </button>
                </div>

                {/* --- BODY --- */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    
                    {/* --- SIDEBAR: SEARCH FORM & STUDENT PROFILE --- */}
                    <div className={`bg-white transition-all duration-500 flex flex-col z-10 border-b md:border-b-0 md:border-r border-slate-100
                        ${resultData ? 'w-full md:w-[320px] lg:w-[360px] shrink-0 h-auto md:h-full overflow-y-auto custom-scrollbar p-4 md:p-6 bg-slate-50/30' : 'w-full p-6 md:p-8 h-full overflow-y-auto'}`}>
                        
                        <form onSubmit={handleCheck} className={`relative transition-all duration-500 ${resultData ? 'mb-6' : 'mb-8'}`}>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Reference Number</label>
                                    <input 
                                        type="text" 
                                        value={refNumber}
                                        onChange={(e) => setRefNumber(e.target.value.toUpperCase())}
                                        placeholder="SRCS-202X-XXXX"
                                        className="w-full bg-white border border-slate-200 text-slate-900 font-bold text-sm rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 uppercase tracking-widest shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                                        Last Name <Lock size={10} className="text-slate-300"/>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={lastNameVerify}
                                        onChange={(e) => setLastNameVerify(e.target.value)}
                                        placeholder="e.g. Santos"
                                        className="w-full bg-white border border-slate-200 text-slate-900 font-bold text-sm rounded-xl py-3 px-4 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={status === 'loading' || !refNumber || !lastNameVerify}
                                className="w-full mt-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
                            >
                                {status === 'loading' ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                                Track Status
                            </button>
                        </form>

                        {!resultData && (
                            <div className="text-center animate-fade-in mt-8">
                                {status === 'not-found' ? (
                                    <div className="py-6 px-4 bg-red-50 rounded-2xl border border-red-100">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-red-500 shadow-sm">
                                            <AlertCircle size={24} />
                                        </div>
                                        <h4 className="text-slate-900 font-bold text-sm">Record Not Found</h4>
                                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                                            Please verify that your Reference Number and Last Name match our records exactly.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-slate-400 py-4 opacity-60">
                                        <Lock size={32} className="mx-auto mb-3 opacity-50"/>
                                        <p className="text-xs font-medium">Secure Verification Required</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {status === 'found' && resultData && (
                            <div className="animate-fade-in-up space-y-4">
                                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                                    
                                    <div className="flex flex-col items-center text-center pt-2">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 text-2xl font-black mb-3">
                                            {resultData.firstName?.[0]}{resultData.lastName?.[0]}
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 uppercase leading-tight mb-1">{resultData.firstName} {resultData.lastName}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                                            {resultData.gradeLevel} • {resultData.studentType}
                                        </p>
                                        
                                        <div className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 ${getStatusColor(resultData.status)}`}>
                                            {resultData.status === 'Enrolled' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                            <span className="text-[11px] font-black uppercase tracking-widest">{resultData.status || 'Pending'}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDownloadPdf}
                                    disabled={downloading}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-70 group"
                                >
                                    {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} className="group-hover:-translate-y-0.5 transition-transform"/>}
                                    {downloading ? "Generating PDF..." : "Download Registration Form"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* --- MAIN CONTENT AREA --- */}
                    {status === 'found' && resultData && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 p-4 md:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                                
                                {/* CENTER COLUMN: Statement of Accounts */}
                                <div className="lg:col-span-7 flex flex-col gap-5">
                                    {resultData.status === 'Enrolled' && resultData.soa ? (
                                        <>
                                            {/* Header */}
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                    <Calculator size={18} className="text-indigo-600"/>
                                                    Statement of Accounts
                                                </h4>
                                                <span className="text-[10px] font-bold bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-500 shadow-sm">
                                                    SY {resultData.schoolYear}
                                                </span>
                                            </div>

                                            {/* --- ENHANCED ASSESSMENT SUMMARY --- */}
                                            <div className="bg-slate-900 rounded-2xl text-white p-1 shadow-xl shadow-slate-200 overflow-hidden">
                                                <div className="p-5 md:p-6 bg-gradient-to-br from-slate-900 to-slate-800">
                                                    
                                                    {(() => {
                                                        // --- UPDATED LOGIC: Handle Subsidy Breakdown ---
                                                        const totalSubsidy = resultData.soa.subsidyBreakdown 
                                                            ? Object.values(resultData.soa.subsidyBreakdown).reduce((a, b) => a + Number(b), 0)
                                                            : (resultData.soa.subsidyAmount || 0);

                                                        const isGrantee = totalSubsidy > 0;
                                                        
                                                        // Net Assessment Calculation
                                                        const netAssessment = resultData.soa.totalAssessment - totalSubsidy;
                                                        const monthlyAmortization = netAssessment / 10;

                                                        return (
                                                            <div className="flex flex-col gap-4">
                                                                {/* Top Row: Total & Deductions */}
                                                                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/10">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Assessment</span>
                                                                        <span className="text-lg md:text-xl font-bold text-white">{formatCurrency(resultData.soa.totalAssessment)}</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Less: Total Subsidy</span>
                                                                        <span className={`text-lg md:text-xl font-bold ${isGrantee ? 'text-emerald-400' : 'text-slate-600'}`}>
                                                                            {isGrantee ? `(${formatCurrency(totalSubsidy)})` : '—'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Middle Row: Net Assessment */}
                                                                <div className="flex items-center justify-between py-2">
                                                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Net Assessment</span>
                                                                    <span className="text-2xl md:text-3xl font-black text-white">{formatCurrency(netAssessment)}</span>
                                                                </div>

                                                                {/* Bottom Box: Payment Schedule */}
                                                                <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 mt-2">
                                                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                                            <Receipt size={20} />
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Outstanding Balance</span>
                                                                            <span className="text-lg font-black text-white">{formatCurrency(resultData.soa.balance)}</span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {resultData.soa.balance > 0 && (
                                                                        <div className="text-right w-full md:w-auto border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-4">
                                                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Monthly Installment</p>
                                                                            <p className="text-base font-bold text-white">{formatCurrency(monthlyAmortization)} <span className="text-[10px] font-normal text-slate-500">/mo</span></p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* --- DETAILED FEE BREAKDOWN --- */}
                                            <div className="space-y-3 animate-fade-in-up delay-75">
                                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Detailed Breakdown</h5>
                                                
                                                {/* Tuition Row */}
                                                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1 bg-indigo-500 h-8 rounded-full"></div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800 uppercase">Tuition Fee</p>
                                                            <p className="text-[10px] text-slate-500">Basic education fee</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-base font-black text-slate-800">{formatCurrency(resultData.soa.feeBreakdown?.tuition)}</span>
                                                </div>

                                                {/* Fees Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {/* Standard Fees */}
                                                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Standard Fees</p>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            {renderFeeList(resultData.soa.feeBreakdown?.standard)}
                                                        </div>
                                                    </div>

                                                    {/* Non-Standard Fees */}
                                                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                                                            <div className="w-2 h-2 rounded-full bg-fuchsia-400"></div>
                                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Non-Standard Fees</p>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            {renderFeeList(resultData.soa.feeBreakdown?.nonStandard)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* --- NEW: GRANTS & SUBSIDIES SECTION --- */}
                                                {((resultData.soa.subsidyBreakdown && Object.keys(resultData.soa.subsidyBreakdown).length > 0) || resultData.soa.subsidyAmount > 0) && (
                                                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 shadow-sm mt-2">
                                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-emerald-200/50">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Applied Grants & Subsidies</p>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            {resultData.soa.subsidyBreakdown ? (
                                                                renderFeeList(resultData.soa.subsidyBreakdown, true)
                                                            ) : (
                                                                <div className="flex justify-between items-center py-2">
                                                                    <span className="text-[10px] font-medium uppercase tracking-wide truncate pr-2 text-emerald-600">General Subsidy</span>
                                                                    <span className="text-xs font-bold whitespace-nowrap text-emerald-600">
                                                                        -{formatCurrency(resultData.soa.subsidyAmount)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        // Pending State
                                        <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-sm">
                                            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                                <Clock size={40} />
                                            </div>
                                            <h4 className="text-lg font-black text-slate-800 uppercase mb-2">Assessment Pending</h4>
                                            <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-xs mx-auto">
                                                Your Statement of Accounts (SOA) is currently being generated by the finance office. Please check back later.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* RIGHT COLUMN: Transaction History */}
                                <div className="lg:col-span-5 flex flex-col h-full">
                                    <div className="bg-white rounded-2xl border border-slate-200 p-5 h-full flex flex-col shadow-sm sticky top-0 max-h-[500px] lg:max-h-none">
                                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                                <Receipt size={14} className="text-indigo-600"/>
                                                Transaction History
                                            </h4>
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                                            {resultData.soa?.payments && resultData.soa.payments.filter(p => !p.isVoid).length > 0 ? (
                                                <div className="space-y-3">
                                                    <div className="bg-emerald-50 text-emerald-800 rounded-xl p-4 border border-emerald-100 mb-4 flex justify-between items-center">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Total Paid</span>
                                                        <span className="text-xl font-black">
                                                            {formatCurrency(resultData.soa.payments.reduce((acc, curr) => acc + (curr.isVoid ? 0 : curr.amount), 0))}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {[...resultData.soa.payments]
                                                            .filter(p => !p.isVoid)
                                                            .reverse()
                                                            .map((p, i) => (
                                                            <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between hover:border-indigo-200 hover:shadow-sm transition-all group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                                                                        {/* --- NEW: Dynamic Icon based on payment mode --- */}
                                                                        {getPaymentIcon(p.mode)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[11px] font-black text-slate-700 uppercase mb-0.5">{p.mode}</p>
                                                                        <p className="text-[10px] text-slate-400 font-medium">{new Date(p.date.seconds * 1000).toLocaleDateString()}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="block text-xs font-black text-emerald-600">+{formatCurrency(p.amount)}</span>
                                                                    <span className="text-[9px] font-bold text-slate-300 uppercase">{p.orNumber}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-10">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                        <Clock size={20} className="text-slate-400"/>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">No transactions yet</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 max-w-[150px]">Payments will appear here once verified by the cashier.</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                                            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                                                For payment discrepancies, please present your physical receipt to the finance office.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingModal;