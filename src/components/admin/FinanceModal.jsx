import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom'; 
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'; 
import { db } from '../../firebase';
import { PAYMENT_MODES } from '../../utils/FeeConstants';
import { X, CreditCard, Receipt, Printer, Save, RefreshCw, CheckCircle, ArrowRight } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import OfficialReceiptPDF from './OfficialReceiptPDF';

// Helper to generate OR Number
const generateOR = () => {
    const date = new Date();
    const datePart = date.getFullYear().toString().substr(-2) + (date.getMonth()+1).toString().padStart(2, '0') + date.getDate().toString().padStart(2, '0');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    return `OR-${datePart}-${randomPart}`;
};

const FinanceModal = ({ student, onClose, onUpdate }) => {
    const [orNumber, setOrNumber] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [loading, setLoading] = useState(false);
    
    const [allocations, setAllocations] = useState({});
    const [lastPayment, setLastPayment] = useState(null);
    const [updatedBalance, setUpdatedBalance] = useState(0); // Track new balance for display

    // Initial load
    useEffect(() => {
        setOrNumber(generateOR());
        
        const initial = {};
        const breakdown = student.soa?.feeBreakdown || {};
        
        if (breakdown.tuition) initial['Tuition Fee'] = '';
        if (breakdown.standard) Object.keys(breakdown.standard).forEach(k => initial[k] = '');
        if (breakdown.nonStandard) Object.keys(breakdown.nonStandard).forEach(k => initial[k] = '');
        
        setAllocations(initial);
    }, [student]);

    // Calculate Balances
    const itemBalances = useMemo(() => {
        const breakdown = student.soa?.feeBreakdown || {};
        const payments = student.soa?.payments || [];
        
        const fees = {};
        if (breakdown.tuition) fees['Tuition Fee'] = breakdown.tuition;
        if (breakdown.standard) Object.assign(fees, breakdown.standard);
        if (breakdown.nonStandard) Object.assign(fees, breakdown.nonStandard);

        // Apply Subsidy to Tuition first
        if (student.soa?.subsidyAmount > 0) {
            fees['Tuition Fee'] = Math.max(0, fees['Tuition Fee'] - student.soa.subsidyAmount);
        }

        const paidSoFar = {};
        
        // Skip voided payments
        payments.forEach(p => {
            if (p.isVoid) return; 

            if (p.allocation) {
                Object.entries(p.allocation).forEach(([key, amt]) => {
                    paidSoFar[key] = (paidSoFar[key] || 0) + amt;
                });
            }
        });

        const balances = {};
        Object.keys(fees).forEach(key => {
            const paid = paidSoFar[key] || 0;
            const remaining = Math.max(0, fees[key] - paid);

            balances[key] = {
                original: fees[key],
                paid: paid,
                remaining: remaining
            };
        });

        return balances;
    }, [student]);

    const totalPaymentAmount = Object.values(allocations).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);

    const handleAllocationChange = (item, val) => {
        setAllocations(prev => ({ ...prev, [item]: val }));
    };

    const handleProcessPayment = async (e) => {
        e.preventDefault();
        if (totalPaymentAmount <= 0) return alert("Please allocate a payment amount.");

        setLoading(true);
        try {
            const finalAllocation = {};
            Object.entries(allocations).forEach(([key, val]) => {
                const num = parseFloat(val);
                if (num > 0) finalAllocation[key] = num;
            });

            const currentGlobalBalance = student.soa?.balance || 0;
            const newBalance = currentGlobalBalance - totalPaymentAmount;

            const paymentRecord = {
                amount: totalPaymentAmount,
                date: new Date(),
                orNumber: orNumber,
                mode: paymentMode,
                allocation: finalAllocation, 
                processedBy: 'Cashier' 
            };

            const docRef = doc(db, "enrollments", student.id);
            await updateDoc(docRef, {
                "soa.balance": newBalance,
                "soa.paymentStatus": newBalance <= 0 ? 'Fully Paid' : 'Partial',
                "soa.payments": arrayUnion(paymentRecord)
            });

            setUpdatedBalance(newBalance); // Store for success screen
            setLastPayment(paymentRecord);
            onUpdate();
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Failed to record payment.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrintReceipt = async () => {
        if (!lastPayment) return;
        try {
            const blob = await pdf(<OfficialReceiptPDF payment={lastPayment} student={student} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error(err);
            alert("Failed to generate receipt.");
        }
    };

    // Use createPortal to render outside the Dashboard layout
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl flex flex-col max-h-[85vh] md:max-h-[90vh] shadow-2xl overflow-hidden relative border border-white/20">
                
                {/* HEADER (Fixed at Top) */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 shadow-sm">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Cashiering</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{student.lastName}, {student.firstName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* CONTENT (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 pb-20 custom-scrollbar">
                    
                    {!lastPayment ? (
                        <form onSubmit={handleProcessPayment}>
                            {/* GLOBAL INFO */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 relative overflow-hidden">
                                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">OR Number (Auto)</span>
                                    <div className="flex items-center gap-2 mt-1 relative z-10">
                                        <span className="text-lg font-black text-blue-700">{orNumber}</span>
                                        <button type="button" onClick={() => setOrNumber(generateOR())} className="p-1 hover:bg-blue-100 rounded-md transition-colors"><RefreshCw className="w-3 h-3 text-blue-400"/></button>
                                    </div>
                                    <Receipt className="absolute -bottom-2 -right-2 w-12 h-12 text-blue-100 -rotate-12" />
                                </div>
					<div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
					    <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Payment Mode</label>
					    <select 
					        value={paymentMode}
					        onChange={e => setPaymentMode(e.target.value)}
					        className="w-full bg-transparent font-bold text-slate-700 outline-none text-sm cursor-pointer"
					    >
					        {PAYMENT_MODES.map(m => (
					            <option 
					                key={m.value} 
					                value={m.value}
					                disabled={m.value === 'Gcash' || m.value === 'Bank Transfer'} //
					                className={m.value === 'Gcash' || m.value === 'Bank Transfer' ? 'text-slate-300' : ''}
					            >
					                {m.label} { (m.value === 'Gcash' || m.value === 'Bank Transfer') ? '(Disabled)' : '' }
					            </option>
					        ))}
					    </select>
					</div>
                            </div>

                            {/* ALLOCATION TABLE */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden mb-24"> 
                                <div className="bg-slate-100 px-4 py-3 grid grid-cols-12 gap-2 border-b border-slate-200 sticky top-0 z-10">
                                    <div className="col-span-5 text-[9px] font-bold text-slate-500 uppercase">Fee Component</div>
                                    <div className="col-span-3 text-[9px] font-bold text-slate-500 uppercase text-right">Balance</div>
                                    <div className="col-span-4 text-[9px] font-bold text-slate-500 uppercase text-right">Payment</div>
                                </div>
                                <div className="bg-white divide-y divide-slate-50">
                                    {Object.entries(itemBalances).map(([item, bal]) => (
                                        <div key={item} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-50 group transition-colors">
                                            <div className="col-span-5">
                                                <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{item}</p>
                                                {bal.paid > 0 && <p className="text-[9px] text-emerald-600 font-medium">Paid: {bal.paid.toLocaleString()}</p>}
                                            </div>
                                            <div className="col-span-3 text-right">
                                                <p className="text-xs font-bold text-slate-500">{bal.remaining.toLocaleString()}</p>
                                            </div>
                                            <div className="col-span-4">
                                                <input 
                                                    type="number"
                                                    min="0"
                                                    max={bal.remaining} 
                                                    step="0.01"
                                                    disabled={bal.remaining <= 0}
                                                    placeholder="0.00"
                                                    value={allocations[item] || ''}
                                                    onChange={(e) => handleAllocationChange(item, e.target.value)}
                                                    className="w-full text-right bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white disabled:opacity-50 focus:ring-2 focus:ring-indigo-100 transition-all"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                    ) : (
                        // REFINED SUCCESS STATE
                        <div className="flex flex-col items-center justify-center h-full py-6 text-center animate-fade-in-up">
                            
                            {/* Success Icon */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center relative border-4 border-emerald-100 shadow-sm">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                            </div>

                            {/* Message */}
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Payment Successful</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1 mb-8">Transaction has been recorded to the system.</p>

                            {/* Summary Card */}
                            <div className="w-full max-w-sm bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
                                <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Paid</span>
                                    <span className="text-2xl font-black text-emerald-600">₱{lastPayment.amount.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR Number</span>
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">{lastPayment.orNumber}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Mode</span>
                                        <span className="text-xs font-bold text-slate-700">{lastPayment.mode}</span>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-slate-200 border-dashed flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining Balance</span>
                                        <span className="text-sm font-black text-slate-800">₱{updatedBalance.toLocaleString('en-PH', {minimumFractionDigits: 2})}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <button onClick={handlePrintReceipt} className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 group">
                                    <Printer className="w-4 h-4" /> 
                                    <span>Print Receipt</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </button>
                                <button onClick={onClose} className="px-6 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">
                                    Close Window
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER (Fixed at Bottom for Payments) */}
                {!lastPayment && (
                    <div className="bg-white border-t border-slate-200 p-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-center sm:text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Payment Amount</p>
                                <p className="text-2xl font-black text-slate-800">₱{totalPaymentAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <button 
                                onClick={handleProcessPayment}
                                disabled={loading || totalPaymentAmount <= 0}
                                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95"
                            >
                                {loading ? 'Processing...' : <><Save className="w-4 h-4" /> Confirm Payment</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body 
    );
};

export default FinanceModal;