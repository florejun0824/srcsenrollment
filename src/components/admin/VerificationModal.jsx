import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../firebase';
import { Icons } from '../../utils/Icons';
import { pdf } from '@react-pdf/renderer';
import EnrollmentPDF from '../EnrollmentPDF';
import { SUBSIDIES } from '../../utils/FeeConstants';

// --- ICONS & ASSETS ---
const ModalIcons = {
    edit: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    save: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
    close: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
};

// --- OPTIMIZED SUB-COMPONENTS (MEMOIZED) ---

const DetailRow = React.memo(({ label, value, highlight = false }) => (
    <div className="flex flex-col mb-3 last:mb-0 group">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</span>
        <span className={`text-sm font-bold break-words whitespace-normal leading-snug ${highlight ? 'text-indigo-600' : 'text-slate-700'}`}>
            {value || <span className="text-slate-300 italic font-medium">Not Provided</span>}
        </span>
    </div>
));

const EditInput = React.memo(({ label, name, value, onChange, type = "text" }) => (
    <div className="flex flex-col mb-3">
        <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{label}</label>
        <input 
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
        />
    </div>
));

const InfoCard = React.memo(({ title, icon, children, className = "" }) => (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
        <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <span className="text-slate-400 scale-90">{icon}</span>
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{title}</h4>
        </div>
        <div className="p-4 md:p-5">{children}</div>
    </div>
));

const StatusBadge = ({ status }) => {
    const styles = {
        'Enrolled': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
        'Rejected': 'bg-red-100 text-red-700 border-red-200',
        'Cancelled': 'bg-slate-100 text-slate-500 border-slate-200'
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles['Pending']}`}>
            {status || 'Pending'}
        </span>
    );
};

// --- MAIN MODAL COMPONENT ---
const VerificationModal = ({ student, sections, onClose, onApprove, onReject, onTransfer, onPromote, onUpdateList }) => {
    const [localStudent, setLocalStudent] = useState(student);
    const [formData, setFormData] = useState(student);
    const [assignedSection, setAssignedSection] = useState(student.section || '');
    const [studentID, setStudentID] = useState(student.studentID || '');
    const [viewMode, setViewMode] = useState('details'); 
    const [selectedVoucher, setSelectedVoucher] = useState('None');
    const [gwa, setGwa] = useState(student.gwa || '');
    
    // States for UI Interaction
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingGwa, setIsSavingGwa] = useState(false);
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);

    // Initial Setup
    useEffect(() => { 
        if (!student.studentID) {
            const year = new Date().getFullYear();
            setStudentID(`${year}-${Math.floor(1000 + Math.random() * 9000)}`);
        }
    }, []);

    // Derived State
    const validSections = useMemo(() => sections.filter(sec => sec.gradeLevel === localStudent.gradeLevel), [sections, localStudent.gradeLevel]);
    const isJHS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(localStudent.gradeLevel);
    const isSHS = ['Grade 11 (SHS)', 'Grade 12 (SHS)'].includes(localStudent.gradeLevel);
    const showSubsidy = isJHS || isSHS;

    // --- HANDLERS ---
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    }, []);

    const handleSaveDetails = async () => {
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "enrollments", localStudent.id), formData);
            setLocalStudent(prev => ({ ...prev, ...formData }));
            onUpdateList();
            setIsEditing(false);
            alert("Updated Successfully");
        } catch (error) { console.error(error); alert("Failed to update."); }
        setIsSaving(false);
    };

    const handleGeneratePdf = async () => {
        setIsPdfGenerating(true);
        try {
            const blob = await pdf(<EnrollmentPDF data={localStudent} />).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${localStudent.lastName}_EnrollmentForm.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) { console.error(error); alert("PDF Error"); }
        setIsPdfGenerating(false);
    };

    const handleApproveClick = async () => {
        const finalSection = assignedSection || 'Unassigned'; 
        const subsidyAmount = SUBSIDIES[selectedVoucher] || 0;
        const currentSOA = localStudent.soa || { totalAssessment: 0, balance: 0, payments: [] };
        const totalPaid = (currentSOA.payments || []).reduce((acc, curr) => acc + curr.amount, 0);
        const baseFee = currentSOA.totalAssessment || 0; 
        const newBalance = baseFee - subsidyAmount - totalPaid;

        const updateData = {
            status: 'Enrolled',
            studentID: studentID,
            section: finalSection,
            voucherType: selectedVoucher, 
            enrolledAt: new Date(),
            "soa.subsidyType": selectedVoucher,
            "soa.subsidyAmount": subsidyAmount,
            "soa.balance": newBalance,
            "soa.paymentStatus": newBalance <= 0 ? 'Fully Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid')
        };

        try {
            await updateDoc(doc(db, "enrollments", localStudent.id), updateData);
            onUpdateList(); 
            onClose();      
            alert(`Student successfully enrolled!`);
        } catch (error) { console.error(error); alert("Failed to enroll."); }
    };

    const handleSaveGwa = async () => {
        setIsSavingGwa(true);
        try { await updateDoc(doc(db, "enrollments", localStudent.id), { gwa: gwa }); } catch (error) { alert("Failed to save GWA."); }
        setIsSavingGwa(false);
    };

    // --- RENDER HELPERS ---
    const currentImage = viewMode === 'photo' ? localStudent.studentPhotoUrl : (viewMode === 'psa' ? localStudent.psaScanUrl : localStudent.psaScanUrl2);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-0 md:p-6 transition-all duration-300">
            
            {/* MAIN CARD */}
            <div className="bg-slate-50 w-full md:w-[95vw] md:max-w-7xl h-full md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative border border-white/10">

                {/* --- LEFT SIDEBAR (Desktop) / TOP NAV (Mobile) --- */}
                <div className="w-full md:w-[320px] bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 z-20">
                    
                    {/* Header: Student Name + Mobile Actions */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                         {/* Name & Avatar */}
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-200 shrink-0">
                                {localStudent.lastName.charAt(0)}
                            </div>
                            <div className="leading-tight min-w-0">
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate max-w-[120px] md:max-w-[150px]">{localStudent.lastName}</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{localStudent.firstName}</p>
                            </div>
                         </div>
                         
                         {/* Mobile Actions: Edit, PDF, Close (Integrated) */}
                         <div className="flex items-center gap-2 md:hidden">
                            {!isEditing && (
                                <>
                                    <button 
                                        onClick={handleGeneratePdf} 
                                        disabled={isPdfGenerating}
                                        className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-full border border-slate-200 transition-colors shadow-sm"
                                    >
                                        {isPdfGenerating ? <span className="text-[10px]">⏳</span> : Icons.download}
                                    </button>
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-full border border-slate-200 transition-colors shadow-sm"
                                    >
                                        {ModalIcons.edit}
                                    </button>
                                </>
                            )}
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-full border border-slate-200 hover:bg-red-50 transition-colors shadow-sm">{ModalIcons.close}</button>
                         </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="px-4 py-3 bg-slate-50/50">
                        <div className="flex p-1 bg-slate-200/50 rounded-xl">
                            {['details', 'photo', 'psa'].map(mode => (
                                <button 
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Content (Scrollable) */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        
                        {/* Status Card */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</span>
                                <StatusBadge status={localStudent.status} />
                            </div>
                            
                            {localStudent.status === 'Pending' ? (
                                <div className="flex flex-row gap-2 animate-fade-in items-end">
                                    {/* 1. Student ID */}
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase truncate block">ID</label>
                                        <input 
                                            type="text" 
                                            value={studentID} 
                                            onChange={(e) => setStudentID(e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all text-center" 
                                        />
                                    </div>

                                    {/* 2. Section */}
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <label className="text-[9px] font-bold text-slate-400 uppercase truncate block">Section</label>
                                        <select 
                                            value={assignedSection} 
                                            onChange={(e) => setAssignedSection(e.target.value)} 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
                                        >
                                            <option value="">Auto</option>
                                            {validSections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </div>

                                    {/* 3. Subsidy (Conditional) */}
                                    {showSubsidy && (
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <label className="text-[9px] font-bold text-emerald-600 uppercase truncate block">Grant</label>
                                            <select 
                                                value={selectedVoucher} 
                                                onChange={(e) => setSelectedVoucher(e.target.value)} 
                                                className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-1 py-2 text-xs font-bold text-emerald-800 outline-none focus:border-emerald-500 transition-all"
                                            >
                                                <option value="None">None</option>
                                                {isJHS && <option value="ESC Grantee">ESC</option>}
                                                {isSHS && <option value="SHS Voucher (Public)">Pub</option>}
                                                {isSHS && <option value="SHS Voucher (Private)">Priv</option>}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <span className="text-2xl">🎓</span>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Student is officially enrolled</p>
                                </div>
                            )}
                        </div>

                        {/* GWA Tool */}
                        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400">%</div>
                            <div className="flex-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase block">General Avg.</label>
                                <input type="number" value={gwa} onChange={e => setGwa(e.target.value)} placeholder="0.00" className="w-full text-sm font-black text-slate-800 bg-transparent outline-none" />
                            </div>
                            <button onClick={handleSaveGwa} disabled={isSavingGwa} className="bg-slate-800 text-white p-2 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50">
                                {ModalIcons.save}
                            </button>
                        </div>
                    </div>

                    {/* Bottom Actions (Desktop & Mobile Sticky) */}
                    <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-30">
                        {isEditing ? (
                            <div className="flex gap-3">
                                <button onClick={() => { setIsEditing(false); setFormData(localStudent); }} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs uppercase hover:bg-slate-200 transition-all">Cancel</button>
                                <button onClick={handleSaveDetails} disabled={isSaving} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50">Save</button>
                            </div>
                        ) : localStudent.status === 'Pending' ? (
                            <div className="flex gap-3">
                                <button onClick={() => onReject(localStudent.id)} className="flex-1 py-3 rounded-xl bg-red-50 text-red-600 border border-red-100 font-bold text-xs uppercase hover:bg-red-100 transition-all">Reject</button>
                                <button onClick={handleApproveClick} className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs uppercase hover:shadow-lg hover:shadow-indigo-200 transition-all">Approve</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => onTransfer(localStudent)} className="py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-[10px] uppercase hover:bg-slate-50">Transfer</button>
                                <button onClick={() => onPromote(localStudent)} className="py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 font-bold text-[10px] uppercase hover:bg-amber-100">Promote</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RIGHT CONTENT AREA --- */}
                <div className="flex-1 bg-slate-50/50 relative overflow-hidden flex flex-col h-full">
                    
                    {/* Desktop Close Button */}
                    <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 z-50 bg-white p-2 rounded-full shadow-lg border border-slate-100 text-slate-400 hover:text-red-500 transition-all">
                        {ModalIcons.close}
                    </button>

                    {/* Scrollable Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24 md:pb-8">
                        {viewMode === 'details' ? (
                            <div className="max-w-4xl mx-auto space-y-6">
                                
                                {/* Edit Mode Toggle Header (Desktop) */}
                                <div className="hidden md:flex justify-between items-end mb-2">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Student Profile</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Enrollment Record</p>
                                    </div>
                                    {!isEditing && (
                                        <div className="flex gap-2">
                                            <button onClick={handleGeneratePdf} disabled={isPdfGenerating} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm">
                                                {isPdfGenerating ? '...' : Icons.download} PDF
                                            </button>
                                            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-slate-800 rounded-xl text-[10px] font-bold uppercase text-white hover:bg-slate-700 transition-all flex items-center gap-2 shadow-lg shadow-slate-200">
                                                {ModalIcons.edit} Edit
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Content Grids */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoCard title="Personal Information" icon={Icons.user}>
                                        {isEditing ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <EditInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                                                <EditInput label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                                                <EditInput label="Middle Name" name="middleName" value={formData.middleName} onChange={handleInputChange} />
                                                <EditInput label="LRN" name="lrn" value={formData.lrn} onChange={handleInputChange} />
                                                <EditInput label="DOB" name="dob" type="date" value={formData.dob} onChange={handleInputChange} />
                                                <EditInput label="Sex" name="sex" value={formData.sex} onChange={handleInputChange} />
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DetailRow label="Full Name" value={`${localStudent.lastName}, ${localStudent.firstName} ${localStudent.middleName || ''}`} highlight />
                                                    <DetailRow label="LRN" value={localStudent.lrn} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <DetailRow label="Date of Birth" value={localStudent.dob} />
                                                    <DetailRow label="Sex" value={localStudent.sex} />
                                                </div>
                                                <DetailRow label="Address" value={`${localStudent.addressBarangay}, ${localStudent.addressCity}`} />
                                            </div>
                                        )}
                                    </InfoCard>

                                    <div className="space-y-4">
                                        <InfoCard title="Contact Details" icon={Icons.family}>
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <EditInput label="Father" name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
                                                    <EditInput label="Mother" name="motherName" value={formData.motherName} onChange={handleInputChange} />
                                                    <EditInput label="Contact" name="contactNumber1" value={formData.contactNumber1} onChange={handleInputChange} />
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <DetailRow label="Father's Name" value={localStudent.fatherName} />
                                                    <DetailRow label="Mother's Name" value={localStudent.motherName} />
                                                    <DetailRow label="Emergency Contact" value={localStudent.contactNumber1} highlight />
                                                </div>
                                            )}
                                        </InfoCard>

                                        <InfoCard title="Academic History" icon={Icons.school}>
                                            {isEditing ? (
                                                <div className="space-y-2">
                                                    <EditInput label="Last School" name="lastSchoolName" value={formData.lastSchoolName} onChange={handleInputChange} />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <EditInput label="Last SY" name="lastSchoolYear" value={formData.lastSchoolYear} onChange={handleInputChange} />
                                                        <EditInput label="Avg" name="lastGradeLevel" value={formData.lastGradeLevel} onChange={handleInputChange} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <DetailRow label="Previous School" value={localStudent.lastSchoolName} />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <DetailRow label="School Year" value={localStudent.lastSchoolYear} />
                                                        <DetailRow label="Last Level" value={localStudent.lastGradeLevel} />
                                                    </div>
                                                </div>
                                            )}
                                        </InfoCard>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // PHOTO VIEW
                            <div className="h-full flex flex-col items-center justify-center p-4">
                                {currentImage ? (
                                    <div className="relative w-full max-w-2xl bg-white p-2 rounded-2xl shadow-xl border border-slate-200">
                                        <img src={currentImage} className="w-full h-auto rounded-xl max-h-[70vh] object-contain mx-auto" alt="Document" />
                                        <a href={currentImage} download target="_blank" rel="noreferrer" className="absolute bottom-6 right-6 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                                            {Icons.download} Download Original
                                        </a>
                                    </div>
                                ) : (
                                    <div className="text-center opacity-50">
                                        <div className="text-6xl mb-4">📂</div>
                                        <p className="font-bold text-slate-400 uppercase tracking-widest">No Document Uploaded</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationModal;