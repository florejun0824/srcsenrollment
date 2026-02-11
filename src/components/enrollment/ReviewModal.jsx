import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import EnrollmentPDF from '../../components/EnrollmentPDF'; 
import { Icons } from './SharedUI';
import { FileText, User, MapPin, Phone, AlertTriangle, X } from 'lucide-react'; // Using lucide-react for cleaner icons, or fallback to Icons if you prefer

const ReviewModal = ({ data, onCancel, onConfirm, loading, isUpdateMode }) => {
    const [generatingPdf, setGeneratingPdf] = useState(false);

    // --- FEATURE: PREVIEW PDF ---
    const handlePreviewPdf = async () => {
        setGeneratingPdf(true);
        try {
            const blob = await pdf(<EnrollmentPDF data={data} />).toBlob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("PDF Preview Error:", error);
            alert("Failed to generate PDF preview.");
        } finally {
            setGeneratingPdf(false);
        }
    };

    // --- SUB-COMPONENT: DATA ROW ---
    const DataRow = ({ label, value, className = "" }) => (
        <div className={`group flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-slate-100 last:border-0 py-3 px-1 hover:bg-slate-50 transition-colors ${className}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-0 shrink-0">{label}</span>
            <span className="text-sm font-bold text-slate-800 text-left sm:text-right break-words leading-tight">{value || <span className="text-slate-300 font-normal italic">N/A</span>}</span>
        </div>
    );

    // --- SUB-COMPONENT: SECTION TITLE ---
    const SectionTitle = ({ icon: Icon, title }) => (
        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 mt-2">
            <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                <Icon size={12} />
            </div>
            {title}
        </h4>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onCancel} />

            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-3xl sm:rounded-[2rem] rounded-t-[2rem] max-h-[95vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/50 ring-1 ring-slate-900/5">
                
                {/* --- HEADER --- */}
                <div className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/20 shrink-0
                            ${isUpdateMode ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-200' : 'bg-gradient-to-br from-[#800000] to-red-600 shadow-red-200'}`}>
                            {isUpdateMode ? <span className="text-xl">🔄</span> : <span className="text-xl">📋</span>}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none mb-1">
                                {isUpdateMode ? 'Update Record' : 'Confirm Enrollment'}
                            </h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                Please Verify Your Details
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onCancel} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-all active:scale-95"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* --- SCROLLABLE CONTENT --- */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-slate-50/50">
                    
                    {/* 1. WARNING BANNER & PDF ACTION */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <div className="flex-1 bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex gap-3 shadow-sm">
                            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-amber-800 font-bold text-xs uppercase mb-1">Final Review</h4>
                                <p className="text-amber-700/80 text-[11px] leading-relaxed font-medium">
                                    Double-check all information. Once submitted, changes can only be made via the Registrar.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handlePreviewPdf}
                            disabled={generatingPdf}
                            className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 sm:py-0 bg-white border border-indigo-100 text-indigo-600 rounded-2xl text-[10px] font-bold uppercase tracking-wide hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                        >
                            {generatingPdf ? <span className="animate-spin w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full" /> : <FileText size={16} />}
                            {generatingPdf ? 'Generating...' : 'Preview PDF'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                        
                        {/* 2. LEFT COLUMN: PROFILE & IDENTITY */}
                        <div className="space-y-6">
                            {/* Student Identity Card */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#800000] to-red-600" />
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="relative shrink-0">
                                        {data.studentPhotoUrl ? (
                                            <img src={data.studentPhotoUrl} alt="Student" className="w-20 h-20 object-cover rounded-2xl border border-slate-100 shadow-md" />
                                        ) : (
                                            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 border border-slate-200">
                                                <User size={32} />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                                            {data.sex === 'Male' ? 'M' : 'F'}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 uppercase leading-tight mb-1">
                                            {data.lastName}, {data.firstName}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{data.middleName} {data.extension}</p>
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{data.gradeLevel}</span>
                                        </div>
                                    </div>
                                </div>
                                <DataRow label="LRN" value={data.lrn} />
                                <DataRow label="Student Type" value={data.studentType} />
                                <DataRow label="PSA Cert No." value={data.psaCert} />
                            </div>

                            {/* Academic Details */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <SectionTitle icon={FileText} title="Academic Details" />
                                <DataRow label="School Year" value={data.schoolYear} />
                                <DataRow label="LRN Status" value={data.lrnStatus} />
                                {data.track && (
                                    <>
                                        <DataRow label="SHS Track" value={data.track} />
                                        <DataRow label="Strand" value={data.strand} />
                                        <DataRow label="Semester" value={data.semester} />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 3. RIGHT COLUMN: PERSONAL & CONTACT */}
                        <div className="space-y-6">
                            {/* Birth & Address */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <SectionTitle icon={MapPin} title="Personal & Address" />
                                <DataRow label="Date of Birth" value={`${data.dob} (${data.age} yrs)`} />
                                <DataRow label="Mother Tongue" value={data.motherTongue} />
                                <DataRow label="IP Community" value={data.isIP ? data.ipCommunity : 'No'} />
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Home Address</p>
                                    <p className="text-sm font-bold text-slate-800 leading-relaxed uppercase">
                                        {data.addressStreet}, {data.addressBarangay}, {data.addressCity}, {data.addressProvince} {data.addressZip}
                                    </p>
                                </div>
                            </div>

                            {/* Parent Info */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                <SectionTitle icon={Phone} title="Family & Contact" />
                                <DataRow label="Father" value={data.fatherName} />
                                <DataRow label="Mother" value={data.motherName} />
                                <DataRow label="Guardian" value={data.guardianName} />
                                <div className="mt-4 bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Primary Contact</span>
                                        <Phone size={12} className="text-indigo-400" />
                                    </div>
                                    <p className="text-lg font-black text-indigo-900 tracking-tight">{data.contactNumber1}</p>
                                </div>
                            </div>
                        </div>

                    </div>
                    
                    {/* Disclaimer */}
                    <p className="text-center text-[10px] text-slate-400 font-medium mt-8 italic">
                        By clicking confirm, I hereby certify that the above information is true and correct.
                    </p>
                </div>

                {/* --- FOOTER ACTIONS --- */}
                <div className="p-4 sm:p-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-20">
                    <button 
                        onClick={onCancel} 
                        className="flex-1 py-4 rounded-xl font-bold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-[0.98] text-xs uppercase tracking-wide"
                    >
                        Back to Edit
                    </button>
                    <button 
                        onClick={onConfirm} 
                        disabled={loading} 
                        className="flex-[2] py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#800000] to-red-600 hover:to-red-500 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-[0.98] text-xs uppercase tracking-wide"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Processing...
                            </>
                        ) : (
                            <>
                                {isUpdateMode ? 'Update Now' : 'Submit Enrollment'} 
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ReviewModal;