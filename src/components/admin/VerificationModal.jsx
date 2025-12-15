// src/components/admin/VerificationModal.jsx
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../firebase';
import { Icons } from '../../utils/Icons';
import { pdf } from '@react-pdf/renderer';
import EnrollmentPDF from '../EnrollmentPDF';

// --- ICONS SPECIFIC TO THIS MODAL ---
const ModalIcons = {
    edit: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
    save: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
    close: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
};

// --- TOAST COMPONENT ---
const Toast = ({ message }) => {
    if (!message) return null;
    return (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-down">
            <div className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                <div className="bg-emerald-500 rounded-full p-1 text-black">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span className="text-xs font-bold tracking-wide uppercase">{message}</span>
            </div>
        </div>
    );
};

// --- UI COMPONENTS ---
const InfoCard = ({ title, icon, children, className = "" }) => (
    <div className={`bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden ${className}`}>
        <div className="bg-white/[0.02] px-5 py-3 border-b border-white/5 flex items-center gap-3">
            <span className="text-slate-400">{icon}</span>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const DetailRow = ({ label, value, highlight = false }) => (
    <div className="flex flex-col mb-4 last:mb-0">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</span>
        <span className={`text-sm font-bold truncate ${highlight ? 'text-red-400' : 'text-slate-200'}`}>
            {value || <span className="text-slate-600 italic">N/A</span>}
        </span>
    </div>
);

const EditInput = ({ label, name, value, onChange, type = "text" }) => (
    <div className="flex flex-col mb-4">
        <label className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">{label}</label>
        <input 
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500/50 focus:bg-white/5 transition-all"
        />
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        'Enrolled': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
        'Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]',
        'Rejected': 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
        'Cancelled': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    };
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status] || styles['Pending']}`}>
            {status || 'Pending'}
        </span>
    );
};

// --- DATA SUMMARY VIEW ---
const EnrollmentDataSummary = ({ 
    s, formData, isEditing, onInputChange, onToggleEdit,
    gwa, setGwa, onSaveGwa, isSavingGwa, 
    onTransfer, onPromote, onRevert, onCancelEnrollment, showActions,
    onGeneratePdf, isPdfGenerating 
}) => {
    const displayData = isEditing ? formData : s;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-1 pb-32">
            
            {/* HEADER PROFILE */}
            <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 rounded-[1.5rem] p-6 mb-6 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                
                <div className="flex items-start md:items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#800000] to-red-900 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-red-900/30 border border-white/10 shrink-0">
                        {s.lastName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                            <h3 className="text-xl md:text-2xl font-black text-white leading-none truncate">{s.lastName}, {s.firstName}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <StatusBadge status={s.status} />
                            <span className="text-slate-600">•</span>
                            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{s.studentType}</span>
                            <span className="text-slate-600">•</span>
                            <span>{s.gradeLevel}</span>
                        </div>
                    </div>
                </div>

                {/* DESKTOP ACTIONS */}
                {!isEditing && (
                    <div className="hidden md:flex absolute top-6 right-6 gap-2 z-20">
                        <button 
                            onClick={onGeneratePdf}
                            disabled={isPdfGenerating}
                            className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isPdfGenerating ? <span className="animate-spin">C</span> : Icons.download} PDF Form
                        </button>
                        <button 
                            onClick={onToggleEdit} 
                            className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 flex items-center gap-2"
                        >
                            {ModalIcons.edit} Edit Details
                        </button>
                    </div>
                )}
            </div>

            {/* DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard title="Personal Info" icon={Icons.user}>
                    {isEditing ? (
                        <div className="grid grid-cols-2 gap-4">
                            <EditInput label="Last Name" name="lastName" value={displayData.lastName} onChange={onInputChange} />
                            <EditInput label="First Name" name="firstName" value={displayData.firstName} onChange={onInputChange} />
                            <EditInput label="Middle Name" name="middleName" value={displayData.middleName} onChange={onInputChange} />
                            <EditInput label="Extension" name="extension" value={displayData.extension} onChange={onInputChange} />
                            <EditInput label="LRN" name="lrn" value={displayData.lrn} onChange={onInputChange} />
                            <EditInput label="Birth Date" name="dob" type="date" value={displayData.dob} onChange={onInputChange} />
                            <EditInput label="Sex" name="sex" value={displayData.sex} onChange={onInputChange} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <DetailRow label="LRN" value={s.lrn} />
                            <DetailRow label="Birth Date" value={`${s.dob} (${s.age})`} />
                            <DetailRow label="Sex" value={s.sex} />
                            <DetailRow label="Assigned Section" value={s.section} highlight />
                        </div>
                    )}
                </InfoCard>

                <InfoCard title="Contact" icon={Icons.family}>
                    {isEditing ? (
                        <div className="space-y-1">
                            <EditInput label="Father's Name" name="fatherName" value={displayData.fatherName} onChange={onInputChange} />
                            <EditInput label="Mother's Name" name="motherName" value={displayData.motherName} onChange={onInputChange} />
                            <EditInput label="Mobile" name="contactNumber1" value={displayData.contactNumber1} onChange={onInputChange} />
                            <EditInput label="Address (City/Brgy)" name="addressCity" value={displayData.addressCity} onChange={onInputChange} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <DetailRow label="Father" value={s.fatherName} />
                                <DetailRow label="Mother" value={s.motherName} />
                            </div>
                            <DetailRow label="Mobile" value={s.contactNumber1} highlight />
                            <DetailRow label="Address" value={`${s.addressBarangay}, ${s.addressCity}`} />
                        </div>
                    )}
                </InfoCard>

                <InfoCard title="Academic History" icon={Icons.school} className="md:col-span-2">
                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <EditInput label="Last School" name="lastSchoolName" value={displayData.lastSchoolName} onChange={onInputChange} />
                            <EditInput label="School Address" name="lastSchoolAddress" value={displayData.lastSchoolAddress} onChange={onInputChange} />
                            <div className="grid grid-cols-2 gap-4">
                                <EditInput label="Last School Year" name="lastSchoolYear" value={displayData.lastSchoolYear} onChange={onInputChange} />
                                <EditInput label="Last Grade Level" name="lastGradeLevel" value={displayData.lastGradeLevel} onChange={onInputChange} />
                            </div>
                            <EditInput label="School ID (Last School)" name="lastSchoolID" value={displayData.lastSchoolID} onChange={onInputChange} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <DetailRow label="Last School Attended" value={s.lastSchoolName} />
                                <div className="mt-1 text-[10px] text-slate-500 font-medium uppercase tracking-wide">{s.lastSchoolAddress}</div>
                            </div>
                            <div className="space-y-4">
                                <DetailRow label="Last SY" value={s.lastSchoolYear} />
                                <DetailRow label="Last Grade" value={s.lastGradeLevel} />
                                <DetailRow label="School ID" value={s.lastSchoolID} />
                            </div>
                        </div>
                    )}
                </InfoCard>
            </div>

            {/* REGISTRAR ACTIONS */}
            {!isEditing && (
                <div className="mt-6 bg-white/[0.03] rounded-2xl p-6 border border-white/5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                        {Icons.dashboard} Registrar Actions
                    </h4>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm border border-amber-500/20 shrink-0">%</div>
                            <div className="flex-1 min-w-0">
                                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">General Weighted Avg.</label>
                                <input 
                                    type="number" step="0.01" placeholder="0.00" value={gwa} 
                                    onChange={(e) => setGwa(e.target.value)}
                                    className="text-lg font-black text-white bg-transparent outline-none w-full placeholder:text-slate-700"
                                />
                            </div>
                            <button 
                                onClick={onSaveGwa} 
                                disabled={isSavingGwa} 
                                className="text-[10px] bg-white text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 disabled:opacity-50 transition-all uppercase whitespace-nowrap"
                            >
                                {isSavingGwa ? 'Saving...' : 'Save GWA'}
                            </button>
                        </div>

                        {showActions && (
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => onTransfer(s)} className="py-3.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-bold text-[10px] uppercase hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
                                    {Icons.transfer} Transfer Section
                                </button>
                                <button onClick={() => onPromote(s)} className="py-3.5 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-xl font-bold text-[10px] uppercase hover:to-yellow-500 shadow-lg shadow-amber-900/20 transition-all flex items-center justify-center gap-2 border border-white/10">
                                    {Icons.promote} Promote Student
                                </button>
                                <button onClick={() => onRevert(s.id)} className="col-span-1 py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold text-[10px] uppercase hover:bg-red-500/20 transition-all">
                                    Revert to Pending
                                </button>
                                <button onClick={() => onCancelEnrollment(s.id)} className="col-span-1 py-3.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-xl font-bold text-[10px] uppercase hover:bg-slate-700 transition-all">
                                    Cancel Enrollment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN VERIFICATION MODAL COMPONENT ---
const VerificationModal = ({ student, sections, onClose, onApprove, onReject, onTransfer, onPromote, onUpdateList }) => {
    const [localStudent, setLocalStudent] = useState(student);
    const [assignedSection, setAssignedSection] = useState(student.section || '');
    const [studentID, setStudentID] = useState(student.studentID || '');
    const [viewMode, setViewMode] = useState('details'); 
    
    // Edit & Form State
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(student);
    const [isSaving, setIsSaving] = useState(false);
    
    // PDF State
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);

    // GWA & Toast State
    const [gwa, setGwa] = useState(student.gwa || '');
    const [isSavingGwa, setIsSavingGwa] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    useEffect(() => { setLocalStudent(student); setFormData(student); }, [student]);
    useEffect(() => { if (toastMessage) { const timer = setTimeout(() => setToastMessage(null), 3000); return () => clearTimeout(timer); } }, [toastMessage]);

    const NO_SECTION_GRADES = ['Pre-Kindergarten 1', 'Pre-Kindergarten 2', 'Kinder'];
    const isSectionRequired = !NO_SECTION_GRADES.includes(localStudent.gradeLevel);
    const validSections = sections.filter(sec => sec.gradeLevel === localStudent.gradeLevel);

    useEffect(() => {
        if (!localStudent.studentID) {
            const year = new Date().getFullYear();
            setStudentID(`${year}-${Math.floor(1000 + Math.random() * 9000)}`);
        }
    }, [localStudent]);

    // --- HANDLERS ---
    const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value.toUpperCase() })); };

    const handleSaveDetails = async () => {
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "enrollments", localStudent.id), formData);
            setLocalStudent(prev => ({ ...prev, ...formData }));
            onUpdateList();
            setIsEditing(false);
            setToastMessage("Details updated successfully");
        } catch (error) { console.error(error); alert("Failed to update details."); }
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
            setToastMessage("PDF Generated Successfully");
        } catch (error) { console.error("PDF Gen Error:", error); alert("Failed to generate PDF."); }
        setIsPdfGenerating(false);
    };

    const handleCancelEdit = () => { setFormData(localStudent); setIsEditing(false); };

    const handleDownloadImage = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        } catch (error) { window.open(url, '_blank'); }
    };

    const handleSaveGwa = async () => {
        setIsSavingGwa(true);
        try { await updateDoc(doc(db, "enrollments", localStudent.id), { gwa: gwa }); setToastMessage("GWA saved successfully"); } catch (error) { alert("Failed to save GWA."); }
        setIsSavingGwa(false);
    };

    const handleApproveClick = () => {
        if (isSectionRequired && !assignedSection) return;
        const finalSection = isSectionRequired ? assignedSection : 'Main Class'; 
        onApprove(localStudent.id, studentID, finalSection);
    };

    const handleRevert = async (id) => {
        if(!confirm("Revert this student to Pending status?")) return;
        try { await updateDoc(doc(db, "enrollments", id), { status: 'Pending', section: null, enrolledAt: null }); onUpdateList(); onClose(); } catch (e) { alert("Error reverting."); }
    };

    const handleCancelEnrollment = async (id) => {
        if(!confirm("Cancel this enrollment?")) return;
        try { await updateDoc(doc(db, "enrollments", id), { status: 'Cancelled', section: null }); onUpdateList(); onClose(); } catch (e) { alert("Error cancelling."); }
    };

    if (!localStudent) return null;
    const currentImage = viewMode === 'photo' ? localStudent.studentPhotoUrl : (viewMode === 'psa' ? localStudent.psaScanUrl : localStudent.psaScanUrl2);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <Toast message={toastMessage} />

            <div className="bg-slate-900 rounded-[2rem] w-full max-w-6xl h-[90vh] md:h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl border border-white/10 relative">
                
                {/* MOBILE ACTIONS */}
                <div className="absolute top-3 right-3 z-50 flex items-center gap-2 md:hidden">
                    {!isEditing && <button onClick={handleGeneratePdf} disabled={isPdfGenerating} className="bg-white/10 backdrop-blur text-white p-2 rounded-full border border-white/10">{isPdfGenerating ? '⏳' : Icons.download}</button>}
                    {!isEditing && <button onClick={() => setIsEditing(true)} className="bg-white/10 backdrop-blur text-white p-2 rounded-full border border-white/10">{ModalIcons.edit}</button>}
                    <button onClick={onClose} className="bg-white/10 backdrop-blur text-white p-2 rounded-full border border-white/10">{ModalIcons.close}</button>
                </div>

                {/* LEFT SIDEBAR / ACTIONS PANEL */}
                <div className="w-full md:w-80 bg-slate-900/50 border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0 order-2 md:order-1 h-auto md:h-full">
                    
                    {/* TABS */}
                    <div className="p-3 md:p-6 border-b border-white/5 bg-slate-900">
                        <div className="grid grid-cols-4 md:grid-cols-2 gap-2">
                            {['details', 'photo', 'psa', ...(localStudent.psaScanUrl2 ? ['psa2'] : [])].map(mode => (
                                <button 
                                    key={mode}
                                    onClick={() => setViewMode(mode)} 
                                    className={`py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${viewMode === mode ? 'bg-white text-slate-900 border-white' : 'bg-transparent border-white/10 text-slate-500 hover:text-white hover:border-white/30'}`}
                                >
                                    {mode === 'psa2' ? 'PSA 2' : mode === 'psa' ? 'PSA' : mode.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ACTION AREA */}
                    <div className="flex-1 px-4 md:px-6 overflow-y-auto py-4 custom-scrollbar">
                        {isEditing ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4 opacity-50">
                                <span className="text-4xl mb-4 grayscale">✏️</span>
                                <p className="text-sm font-black text-white uppercase">Editing Mode</p>
                                <p className="text-[10px] text-slate-400 mt-2">Modify details on the right panel.</p>
                            </div>
                        ) : (
                            <>
                                {localStudent.status === 'Pending' ? (
                                    <div className="space-y-5">
                                        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                                            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Enrollment Setup</h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Assigned Student ID</label>
                                                    <input type="text" value={studentID} onChange={(e) => setStudentID(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500/50" />
                                                </div>
                                                {isSectionRequired ? (
                                                    <div>
                                                        <label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Assign Section</label>
                                                        <div className="relative">
                                                            <select value={assignedSection} onChange={(e) => setAssignedSection(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold text-white outline-none focus:border-blue-500/50 appearance-none cursor-pointer">
                                                                <option value="" className="bg-slate-900 text-slate-500">-- Select Section --</option>
                                                                {validSections.map(sec => <option key={sec.id} value={sec.name} className="bg-slate-900">{sec.name}</option>)}
                                                            </select>
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">▼</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-white/5 p-3 rounded-lg text-[10px] font-bold text-slate-400 text-center border border-white/5">
                                                        No Section Required
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="hidden md:flex h-full flex-col justify-center items-center text-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-2xl mb-3 border border-emerald-500/20">{Icons.check}</div>
                                        <p className="text-xs font-black text-white uppercase tracking-widest">Student Enrolled</p>
                                        <p className="text-[10px] text-slate-500 mt-1">This record is active.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ACTION BUTTONS FOOTER */}
                    <div className="p-3 md:p-6 border-t border-white/5 flex flex-col gap-3 bg-slate-900">
                        {isEditing ? (
                            <div className="flex gap-2 w-full">
                                <button onClick={handleCancelEdit} className="flex-1 py-3.5 rounded-xl font-bold text-slate-400 bg-white/5 hover:bg-white/10 text-xs uppercase transition-colors">Cancel</button>
                                <button onClick={handleSaveDetails} disabled={isSaving} className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 text-xs uppercase transition-colors disabled:opacity-50">
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        ) : (
                            <>
                                {localStudent.status === 'Pending' ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => onReject(localStudent.id)} className="flex-1 py-3.5 rounded-xl font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[10px] md:text-xs uppercase transition-all">Reject</button>
                                        <button onClick={handleApproveClick} disabled={isSectionRequired && !assignedSection} className={`flex-[2] py-3.5 rounded-xl font-black text-[10px] md:text-xs uppercase shadow-lg transition-all text-white border border-white/10 ${(isSectionRequired && !assignedSection) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-[#800000] to-red-700 hover:to-red-600 shadow-red-900/30'}`}>
                                            Approve & Enroll
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={onClose} className="hidden md:block w-full py-3.5 rounded-xl font-bold text-slate-400 bg-white/5 hover:bg-white/10 hover:text-white text-xs uppercase transition-colors">Close Window</button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL (CONTENT) */}
                <div className="flex-1 bg-slate-950 relative overflow-hidden flex flex-col order-1 md:order-2 h-[450px] md:h-full min-h-0">
                    <button onClick={onClose} className="hidden md:block absolute top-6 right-6 z-20 bg-white/5 p-2.5 rounded-full shadow-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">{ModalIcons.close}</button>
                    
                    <div className="flex-1 overflow-y-auto p-0 md:p-8 custom-scrollbar">
                        {viewMode === 'details' ? (
                            <div className="max-w-4xl mx-auto h-full p-4 md:p-0 pt-14 md:pt-0">
                                <EnrollmentDataSummary 
                                    s={{...localStudent, section: assignedSection || localStudent.section}} 
                                    formData={formData} 
                                    isEditing={isEditing}
                                    onInputChange={handleInputChange}
                                    onToggleEdit={() => setIsEditing(true)}
                                    gwa={gwa}
                                    setGwa={setGwa}
                                    onSaveGwa={handleSaveGwa}
                                    isSavingGwa={isSavingGwa}
                                    onTransfer={onTransfer}
                                    onPromote={onPromote}
                                    onRevert={handleRevert}
                                    onCancelEnrollment={handleCancelEnrollment}
                                    showActions={localStudent.status !== 'Pending'}
                                    onGeneratePdf={handleGeneratePdf}
                                    isPdfGenerating={isPdfGenerating}
                                />
                            </div>
                        ) : currentImage ? (
                            <div className="flex flex-col items-center justify-center min-h-full gap-4 p-4 md:p-0">
                                <div className="relative group rounded-xl overflow-hidden shadow-2xl bg-black border border-white/10 w-full md:w-auto h-full flex items-center justify-center">
                                    <img src={currentImage} className="max-h-full max-w-full object-contain" alt="Document" />
                                </div>
                                <button onClick={() => handleDownloadImage(currentImage, `${localStudent.lastName}_${viewMode}.jpg`)} className="absolute bottom-6 right-6 px-5 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 hover:bg-slate-200 transition-all z-10">
                                    {Icons.download} Download
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                                <div className="text-5xl opacity-20">{Icons.folder}</div>
                                <p className="font-bold text-sm uppercase tracking-widest">No Document Available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationModal;