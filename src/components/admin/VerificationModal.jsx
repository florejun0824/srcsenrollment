// src/components/admin/VerificationModal.jsx
import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../firebase';
import { Icons } from '../../utils/Icons';
import { pdf } from '@react-pdf/renderer'; // Import the imperative pdf generator
import EnrollmentPDF from '../EnrollmentPDF';

// --- TOAST NOTIFICATION COMPONENT ---
const Toast = ({ message }) => {
    if (!message) return null;
    return (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-bounce-in">
            <div className="bg-gray-900/95 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
                <div className="bg-green-500 rounded-full p-1">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span className="text-xs font-bold tracking-wide">{message}</span>
            </div>
        </div>
    );
};

// --- HELPER COMPONENTS ---
const InfoCard = ({ title, icon, children, className = "" }) => (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
        <div className="bg-gray-50/50 px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <span className="text-gray-400 scale-75">{icon}</span>
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</h4>
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const DetailRow = ({ label, value, highlight = false }) => (
    <div className="flex flex-col mb-3 last:mb-0">
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</span>
        <span className={`font-semibold text-sm ${highlight ? 'text-[#800000]' : 'text-gray-800'}`}>
            {value || <span className="text-gray-300 italic">N/A</span>}
        </span>
    </div>
);

const EditInput = ({ label, name, value, onChange, type = "text" }) => (
    <div className="flex flex-col mb-3">
        <label className="text-[9px] font-bold text-blue-600 uppercase tracking-wide mb-1">{label}</label>
        <input 
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            className="w-full border-b border-gray-300 py-1 text-sm font-bold text-gray-900 focus:border-blue-500 outline-none bg-transparent"
        />
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        'Enrolled': 'bg-green-100 text-green-700 border-green-200',
        'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
        'Rejected': 'bg-red-100 text-red-700 border-red-200',
        'Cancelled': 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${styles[status] || styles['Pending']}`}>
            {status || 'Pending'}
        </span>
    );
};

// --- STUDENT DATA SUMMARY ---
const EnrollmentDataSummary = ({ 
    s, formData, isEditing, onInputChange, onToggleEdit,
    gwa, setGwa, onSaveGwa, isSavingGwa, 
    onTransfer, onPromote, onRevert, onCancelEnrollment, showActions,
    onGeneratePdf, isPdfGenerating // Passed from parent
}) => {
    
    const displayData = isEditing ? formData : s;

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-1 pb-32">
            
            {/* HEADER PROFILE */}
            <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm mb-6 relative group">
                <div className="w-12 h-12 rounded-full bg-[#800000] text-white flex items-center justify-center text-lg font-bold shadow-md shrink-0">
                    {s.lastName.charAt(0)}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-black text-gray-900 leading-tight">{s.lastName}, {s.firstName}</h3>
                        <StatusBadge status={s.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        <span>{s.studentType}</span>
                        <span>•</span>
                        <span>{s.gradeLevel}</span>
                    </div>
                </div>
                
                {/* DESKTOP ACTIONS (Download + Edit) */}
                {!isEditing && (
                    <div className="hidden md:flex absolute top-4 right-4 gap-2">
                        {/* DESKTOP DOWNLOAD BUTTON */}
                        <button 
                            onClick={onGeneratePdf}
                            disabled={isPdfGenerating}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isPdfGenerating ? (
                                <><span>⏳</span> Generating...</>
                            ) : (
                                <>{Icons.download} PDF Form</>
                            )}
                        </button>

                        <button 
                            onClick={onToggleEdit} 
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-700"
                        >
                            Edit Details
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
                        <div className="space-y-2">
                            <EditInput label="Father's Name" name="fatherName" value={displayData.fatherName} onChange={onInputChange} />
                            <EditInput label="Mother's Name" name="motherName" value={displayData.motherName} onChange={onInputChange} />
                            <EditInput label="Mobile" name="contactNumber1" value={displayData.contactNumber1} onChange={onInputChange} />
                            <EditInput label="City" name="addressCity" value={displayData.addressCity} onChange={onInputChange} />
                            <EditInput label="Barangay" name="addressBarangay" value={displayData.addressBarangay} onChange={onInputChange} />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <DetailRow label="Father" value={s.fatherName} />
                                <DetailRow label="Mother" value={s.motherName} />
                            </div>
                            <DetailRow label="Mobile" value={s.contactNumber1} highlight />
                            <DetailRow label="Address" value={`${s.addressBarangay}, ${s.addressCity}`} />
                        </div>
                    )}
                </InfoCard>

                <InfoCard title="History" icon={Icons.school} className="md:col-span-2">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <DetailRow label="Last School" value={s.lastSchoolName} />
                                <div className="mt-1 text-[10px] text-gray-400">{s.lastSchoolAddress}</div>
                            </div>
                            <div className="space-y-2">
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
                <div className="mt-8 bg-gray-900 rounded-2xl p-4 shadow-xl text-white">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        {Icons.dashboard} Registrar Actions
                    </h4>
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10">
                            <div className="w-10 h-10 rounded-lg bg-[#FFD700] text-[#800000] flex items-center justify-center font-black text-sm shadow-sm shrink-0">%</div>
                            <div className="flex-1 min-w-0">
                                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">General Weighted Avg.</label>
                                <input 
                                    type="number" step="0.01" placeholder="0.00" value={gwa} 
                                    onChange={(e) => setGwa(e.target.value)}
                                    className="text-lg font-bold text-white bg-transparent outline-none w-full placeholder:text-gray-600"
                                />
                            </div>
                            <button onClick={onSaveGwa} disabled={isSavingGwa} className="text-[10px] bg-white text-gray-900 px-4 py-2 rounded-lg font-bold shadow hover:bg-gray-100 disabled:opacity-50 transition-all uppercase whitespace-nowrap">
                                {isSavingGwa ? 'Saving...' : 'Save GWA'}
                            </button>
                        </div>

                        {showActions && (
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => onTransfer(s)} className="py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 font-bold text-[10px] uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    {Icons.transfer} Transfer
                                </button>
                                <button onClick={() => onPromote(s)} className="py-3 bg-[#FFD700] text-[#800000] rounded-xl font-bold text-[10px] uppercase hover:bg-yellow-400 shadow-md transition-all flex items-center justify-center gap-2">
                                    {Icons.promote} Promote
                                </button>
                                <button onClick={() => onRevert(s.id)} className="col-span-1 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-bold text-[10px] uppercase hover:bg-red-500/20 transition-all">
                                    Revert to Pending
                                </button>
                                <button onClick={() => onCancelEnrollment(s.id)} className="col-span-1 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-xl font-bold text-[10px] uppercase hover:bg-gray-600 transition-all">
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

    useEffect(() => { 
        setLocalStudent(student); 
        setFormData(student); 
    }, [student]);

    // Clear toast after 3 seconds
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

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
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    };

    const handleSaveDetails = async () => {
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "enrollments", localStudent.id), formData);
            setLocalStudent(prev => ({ ...prev, ...formData }));
            onUpdateList();
            setIsEditing(false);
            setToastMessage("Details updated successfully");
        } catch (error) {
            console.error(error);
            alert("Failed to update details.");
        }
        setIsSaving(false);
    };

    const handleGeneratePdf = async () => {
        setIsPdfGenerating(true);
        try {
            // Imperatively generate the PDF blob only when clicked
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
        } catch (error) {
            console.error("PDF Gen Error:", error);
            alert("Failed to generate PDF. Please try again.");
        }
        setIsPdfGenerating(false);
    };

    const handleCancelEdit = () => {
        setFormData(localStudent);
        setIsEditing(false);
    };

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
        try {
            await updateDoc(doc(db, "enrollments", localStudent.id), { gwa: gwa });
            setToastMessage("GWA saved successfully");
        } catch (error) { console.error(error); alert("Failed to save GWA."); }
        setIsSavingGwa(false);
    };

    const handleApproveClick = () => {
        if (isSectionRequired && !assignedSection) return;
        const finalSection = isSectionRequired ? assignedSection : 'Main Class'; 
        onApprove(localStudent.id, studentID, finalSection);
    };

    const handleRevert = async (id) => {
        if(!confirm("Revert this student to Pending status?")) return;
        try {
            await updateDoc(doc(db, "enrollments", id), { status: 'Pending', section: null, enrolledAt: null });
            onUpdateList();
            onClose();
        } catch (e) { alert("Error reverting."); }
    };

    const handleCancelEnrollment = async (id) => {
        if(!confirm("Cancel this enrollment? Student will be moved to Cancelled list.")) return;
        try {
            await updateDoc(doc(db, "enrollments", id), { status: 'Cancelled', section: null });
            onUpdateList();
            onClose();
        } catch (e) { alert("Error cancelling."); }
    };

    if (!localStudent) return null;
    const currentImage = viewMode === 'photo' ? localStudent.studentPhotoUrl : (viewMode === 'psa' ? localStudent.psaScanUrl : localStudent.psaScanUrl2);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
            {/* TOAST NOTIFICATION */}
            <Toast message={toastMessage} />

            <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] md:h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl border border-white/20 relative">
                
                {/* MOBILE HEADER ACTIONS (Close + Download + Edit) */}
                <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
                    {/* MOBILE PDF BUTTON */}
                    {!isEditing && (
                         <button 
                            onClick={handleGeneratePdf}
                            disabled={isPdfGenerating}
                            className="md:hidden bg-white/90 backdrop-blur text-blue-600 p-2 rounded-full shadow-lg border border-gray-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isPdfGenerating ? <span className="text-[10px]">⏳</span> : Icons.download}
                        </button>
                    )}

                    {/* MOBILE EDIT BUTTON */}
                    {!isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)} 
                            className="md:hidden bg-white/90 backdrop-blur text-gray-500 p-2 rounded-full shadow-lg border border-gray-100 transition-all active:scale-95"
                        >
                            {Icons.edit || '✏️'}
                        </button>
                    )}
                    {/* CLOSE BUTTON */}
                    <button 
                        onClick={onClose} 
                        className="bg-white/90 backdrop-blur text-gray-500 hover:text-[#800000] p-2 rounded-full shadow-lg border border-gray-100 transition-all active:scale-95"
                    >
                        {Icons.x}
                    </button>
                </div>

                {/* LEFT PANEL */}
                <div className="w-full md:w-80 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col shrink-0 order-2 md:order-1 h-auto md:h-full">
                    
                    {/* LEFT HEADER (TABS) */}
                    <div className="p-3 md:p-6 border-b border-gray-200 bg-white">
                        <div className="grid grid-cols-4 md:grid-cols-2 gap-2">
                            <button onClick={() => setViewMode('details')} className={`py-2 md:py-3 rounded-lg text-[9px] md:text-[10px] font-bold transition-all border ${viewMode === 'details' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-500'}`}>DETAILS</button>
                            <button onClick={() => setViewMode('photo')} className={`py-2 md:py-3 rounded-lg text-[9px] md:text-[10px] font-bold transition-all border ${viewMode === 'photo' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-500'}`}>ID PHOTO</button>
                            <button onClick={() => setViewMode('psa')} className={`py-2 md:py-3 rounded-lg text-[9px] md:text-[10px] font-bold transition-all border ${viewMode === 'psa' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-500'}`}>PSA 1</button>
                            {localStudent.psaScanUrl2 && <button onClick={() => setViewMode('psa2')} className={`py-2 md:py-3 rounded-lg text-[9px] md:text-[10px] font-bold transition-all border ${viewMode === 'psa2' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-500'}`}>PSA 2</button>}
                        </div>
                    </div>

                    {/* LEFT CONTENT (SCROLLABLE) */}
                    <div className="flex-1 px-4 md:px-6 overflow-y-auto py-3 custom-scrollbar">
                        {isEditing ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <span className="text-4xl mb-2">✏️</span>
                                <p className="text-sm font-black text-blue-600 uppercase">Editing Mode</p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    You are currently modifying student details. Use the form on the right.
                                </p>
                            </div>
                        ) : (
                            <>
                                {localStudent.status === 'Pending' ? (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest sticky top-0 bg-gray-50 pb-1">Enrollment Actions</h4>
                                        <div><label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Student ID</label><input type="text" value={studentID} onChange={(e) => setStudentID(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 transition-colors" /></div>
                                        {isSectionRequired ? (
                                            <div><label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Section</label><select value={assignedSection} onChange={(e) => setAssignedSection(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 cursor-pointer"><option value="">-- Select --</option>{validSections.map(sec => <option key={sec.id} value={sec.name}>{sec.name}</option>)}</select></div>
                                        ) : <div className="bg-blue-50 p-2 rounded-lg text-[10px] font-bold text-blue-600 text-center border border-blue-100">Sectioning Not Required</div>}
                                    </div>
                                ) : (
                                    <div className="hidden md:flex h-full flex-col justify-center items-center text-center p-4 bg-white border border-gray-100 rounded-xl">
                                        <span className="text-2xl mb-1">✅</span>
                                        <p className="text-[10px] font-bold text-gray-900 uppercase">Student Enrolled</p>
                                        <p className="text-[9px] text-gray-400">Record is active.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* LEFT FOOTER (ACTIONS) */}
                    <div className="p-3 md:p-6 border-t border-gray-200 flex flex-col gap-2 bg-white pb-safe">
                        {isEditing ? (
                            <div className="flex gap-2 w-full">
                                <button onClick={handleCancelEdit} className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 text-xs uppercase transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleSaveDetails} disabled={isSaving} className="flex-[2] py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md text-xs uppercase transition-colors disabled:opacity-50">
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        ) : (
                            <>
                                {localStudent.status === 'Pending' ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => onReject(localStudent.id)} className="flex-1 py-3 rounded-xl font-bold text-red-500 bg-red-50 hover:bg-red-100 text-[10px] md:text-xs uppercase transition-colors">REJECT</button>
                                        <button onClick={handleApproveClick} disabled={isSectionRequired && !assignedSection} className={`flex-[2] py-3 rounded-xl font-black text-[10px] md:text-xs uppercase shadow-lg transition-all text-white ${(isSectionRequired && !assignedSection) ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#800000] hover:bg-[#600000]'}`}>APPROVE & ENROLL</button>
                                    </div>
                                ) : (
                                    <button onClick={onClose} className="hidden md:block w-full py-3 rounded-xl font-black text-white bg-[#800000] hover:bg-[#600000] text-xs uppercase transition-colors shadow-lg">CLOSE WINDOW</button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="flex-1 bg-gray-50/50 relative overflow-hidden flex flex-col order-1 md:order-2 h-[350px] md:h-full min-h-0">
                    <button onClick={onClose} className="hidden md:block absolute top-4 right-4 z-20 bg-white p-2 rounded-full shadow-md text-gray-500 hover:text-[#800000]">{Icons.x}</button>
                    <div className="flex-1 overflow-y-auto p-0 md:p-8 custom-scrollbar">
                        {viewMode === 'details' ? (
                            <div className="max-w-3xl mx-auto h-full p-3 md:p-0 pt-12 md:pt-0">
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
                            <div className="flex flex-col items-center justify-center min-h-full gap-4 p-4 md:p-0 bg-gray-900 md:bg-transparent">
                                <div className="relative group rounded-xl overflow-hidden shadow-2xl bg-black w-full md:w-auto h-full flex items-center justify-center">
                                    <img src={currentImage} className="max-h-full max-w-full object-contain" alt="Document" />
                                </div>
                                <button onClick={() => handleDownloadImage(currentImage, `${localStudent.lastName}_${viewMode}.jpg`)} className="absolute bottom-4 right-4 px-4 py-2 bg-white text-gray-900 rounded-full font-bold text-[10px] shadow-lg flex items-center gap-2 hover:bg-gray-100 transition-all z-10 opacity-90 hover:opacity-100">{Icons.download} DOWNLOAD</button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-300"><div className="text-5xl mb-2">📂</div><p className="font-bold text-sm">No Document</p></div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationModal;