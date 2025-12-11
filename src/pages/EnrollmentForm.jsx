// src/pages/EnrollmentForm.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

// --- ICONS (SVG) ---
const Icons = {
    user: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    home: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    family: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    school: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    check: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
    alert: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

// --- REUSABLE UI COMPONENTS ---
const InputGroup = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", width = "col-span-1", disabled = false }) => (
    <div className={`flex flex-col ${width} group`}>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1 group-focus-within:text-[#800000] transition-colors">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required && !disabled}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] focus:bg-white block p-3.5 transition-all duration-200 outline-none shadow-sm ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60 text-gray-500' : ''}`}
        />
    </div>
);

const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6 pt-2">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#800000] shadow-sm">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">{title}</h3>
    </div>
);

const RadioButton = ({ name, value, label, checked, onChange }) => (
    <label className={`relative flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 flex-1 hover:shadow-md ${checked ? 'border-[#800000] bg-red-50/50 ring-1 ring-[#800000]' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${checked ? 'border-[#800000]' : 'border-gray-300'}`}>
            {checked && <div className="w-2.5 h-2.5 rounded-full bg-[#800000]" />}
        </div>
        <span className={`text-sm font-bold uppercase select-none ${checked ? 'text-[#800000]' : 'text-gray-600'}`}>{label}</span>
    </label>
);

// --- MODALS ---
const DuplicateModal = ({ onRetrieve, onCancel, studentName }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center transform transition-all scale-100">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                {Icons.alert}
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Record Found!</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                We found an existing student named <strong>{studentName}</strong>.
            </p>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 text-left mb-6">
                <strong>Wait!</strong> Do not create a duplicate. Click "Retrieve" to load the existing data and update it.
            </div>
            <div className="flex flex-col gap-3">
                <button onClick={onRetrieve} className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                    Retrieve & Update Record
                </button>
                <button onClick={onCancel} className="w-full py-3.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

const ReviewModal = ({ data, onCancel, onConfirm, loading, isUpdateMode }) => {
    const DataRow = ({ label, value }) => (
        <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-50 py-3 last:border-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 sm:mb-0">{label}</span>
            <span className="text-sm font-bold text-gray-800 text-right break-words">{value || <span className="text-gray-300 font-normal">N/A</span>}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#800000] text-white rounded-full flex items-center justify-center shadow-lg shadow-red-100">
                            {isUpdateMode ? '🔄' : '📋'}
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-900">{isUpdateMode ? 'Update Record' : 'Confirm Enrollment'}</h2>
                            <p className="text-xs text-gray-500">Please verify the details below.</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">✕</button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                    <div className="space-y-6">
                        <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                            <h4 className="text-[#800000] font-bold uppercase text-xs tracking-widest mb-3">Enrollment Details</h4>
                            <DataRow label="SY / Grade" value={`${data.schoolYear} - ${data.gradeLevel}`} />
                            <DataRow label="Type / Status" value={`${data.studentType} (${data.lrnStatus})`} />
                        </div>

                        <div>
                            <h4 className="text-[#800000] font-bold uppercase text-xs tracking-widest mb-3 border-b border-gray-100 pb-2">Student Profile</h4>
                            <DataRow label="Full Name" value={`${data.lastName}, ${data.firstName} ${data.middleName} ${data.extension}`} />
                            <DataRow label="LRN" value={data.lrn} />
                            <DataRow label="PSA Cert" value={data.psaCert} />
                            <DataRow label="Birth Details" value={`${data.dob} (${data.age} yrs) - ${data.sex}`} />
                            <DataRow label="Address" value={`${data.addressBarangay}, ${data.addressCity}`} />
                        </div>

                        <div>
                            <h4 className="text-[#800000] font-bold uppercase text-xs tracking-widest mb-3 border-b border-gray-100 pb-2">Contacts</h4>
                            <DataRow label="Parents" value={`F: ${data.fatherName} / M: ${data.motherName}`} />
                            <DataRow label="Contact Number" value={data.contactNumber1} />
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-xs text-yellow-800 text-center leading-relaxed">
                        By clicking confirm, I hereby certify that the above information is true and correct.
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                        Back to Edit
                    </button>
                    <button onClick={onConfirm} disabled={loading} className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#800000] hover:bg-[#600000] shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                        {loading ? <span className="animate-pulse">Processing...</span> : (isUpdateMode ? 'Update Now' : 'Submit Enrollment')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const EnrollmentForm = () => {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    
    // Modal States
    const [showReview, setShowReview] = useState(false);
    const [showDuplicate, setShowDuplicate] = useState(false);
    
    const [existingId, setExistingId] = useState(null);
    const [tempDuplicateData, setTempDuplicateData] = useState(null);

    // --- CONFIGURATION ---
    const currentYear = new Date().getFullYear();
    const schoolYearOptions = Array.from({ length: 10 }, (_, i) => {
        const start = currentYear + 1 + i;
        return `${start}-${start + 1}`;
    });

    // --- STATE ---
    const [data, setData] = useState({
        schoolYear: schoolYearOptions[0],
        gradeLevel: '',
        studentType: 'New',
        lrnStatus: 'No LRN',
        psaCert: '', lrn: '',
        lastName: '', firstName: '', middleName: '', extension: '',
        dob: '', sex: 'Male', age: '', motherTongue: '',
        isIP: false, ipCommunity: '',
        addressStreet: '', addressBarangay: '', addressCity: '', addressProvince: '', addressZip: '',
        fatherName: '', motherName: '', guardianName: '',
        contactNumber1: '', contactNumber2: '',
        signatory: 'Father',
        lastGradeLevel: '', lastSchoolYear: '', lastSchoolName: '', lastSchoolAddress: '', lastSchoolID: '',
        semester: '', track: '', strand: ''
    });

    // --- LOGIC ---
    const startYear = parseInt(data.schoolYear.split('-')[0]);
    const isG11 = data.gradeLevel === 'Grade 11 (SHS)';
    const isG12 = data.gradeLevel === 'Grade 12 (SHS)';

    let isTrackDisabled = false;
    if (startYear === 2026) {
        if (isG11) isTrackDisabled = true;
        if (isG12) isTrackDisabled = false;
    } else if (startYear >= 2027) {
        isTrackDisabled = true;
    }
    const showStrand = !isTrackDisabled && isG12 && startYear === 2026;

    // AGE CHECK
    let ageRule = null;
    let ageError = null;
    const cutoffYear = startYear;

    if (data.gradeLevel === 'Pre-Kindergarten 1') ageRule = `Must be 3 y/o by Oct 31, ${cutoffYear}`;
    else if (data.gradeLevel === 'Pre-Kindergarten 2') ageRule = `Must be 4 y/o by Oct 31, ${cutoffYear}`;
    else if (data.gradeLevel === 'Kinder') ageRule = `Must be 5 y/o by Oct 31, ${cutoffYear}`;

    if (data.dob && ageRule) {
        const cutoffDate = new Date(startYear, 9, 31);
        const birthDate = new Date(data.dob);
        let calculatedAge = cutoffDate.getFullYear() - birthDate.getFullYear();
        const m = cutoffDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && cutoffDate.getDate() < birthDate.getDate())) calculatedAge--;

        if (data.gradeLevel === 'Pre-Kindergarten 1' && calculatedAge < 3) ageError = true;
        else if (data.gradeLevel === 'Pre-Kindergarten 2' && calculatedAge < 4) ageError = true;
        else if (data.gradeLevel === 'Kinder' && calculatedAge < 5) ageError = true;
    }

    const targetGradesForPrevSchool = ['Pre-Kindergarten 1', 'Pre-Kindergarten 2', 'Kinder', 'Grade 7', 'Grade 11 (SHS)'];
    const showPrevSchool = targetGradesForPrevSchool.includes(data.gradeLevel) || data.studentType === 'Transferee' || data.studentType === 'Returning';

    // --- HANDLER WITH AUTO-CAPS ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // AUTO-CAPS LOGIC
        let finalValue = value;
        if (typeof value === 'string' && type !== 'date' && type !== 'password' && type !== 'email') {
            finalValue = value.toUpperCase();
        }

        if (name === 'isIP') {
            setData(prev => ({ ...prev, isIP: value === 'true', ipCommunity: value === 'false' ? '' : prev.ipCommunity }));
        } else {
            setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : finalValue }));
        }
    };

    const isFormValid = () => {
        if (ageError) return false;
        if (!data.gradeLevel || !data.lastName || !data.firstName || !data.dob || !data.fatherName || !data.motherName || !data.contactNumber1) return false;
        if (showPrevSchool && (!data.lastSchoolName || !data.lastSchoolAddress)) return false;
        return true;
    };

    useEffect(() => {
        if (isTrackDisabled) setData(prev => ({ ...prev, track: '', strand: '' }));
        if (!showStrand && data.strand !== '') setData(prev => ({ ...prev, strand: '' }));
    }, [isTrackDisabled, showStrand, data.strand]);

    // DB OPERATIONS
    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid()) return;

        if (!existingId) {
            setLoading(true);
            const q = query(collection(db, "enrollments"),
                where("lastName", "==", data.lastName),
                where("firstName", "==", data.firstName),
                where("dob", "==", data.dob)
            );

            try {
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const docSnap = querySnapshot.docs[0];
                    setTempDuplicateData({ ...docSnap.data(), id: docSnap.id });
                    setShowDuplicate(true);
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Connection error checking records.");
                setLoading(false);
                return;
            }
            setLoading(false);
        }
        setShowReview(true);
    };

    const handleRetrieveDuplicate = () => {
        if (tempDuplicateData) {
            setData(tempDuplicateData);
            setExistingId(tempDuplicateData.id);
            setShowDuplicate(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            if (existingId) {
                const docRef = doc(db, "enrollments", existingId);
                await updateDoc(docRef, { ...data, updatedAt: new Date() });
            } else {
                await addDoc(collection(db, "enrollments"), { ...data, createdAt: new Date() });
            }
            setShowReview(false);
            setSubmitted(true);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error(error);
            alert("Error submitting form.");
        }
        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl text-center max-w-md w-full border border-gray-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-sm">
                        {Icons.check}
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-800 mb-3">{existingId ? 'Updated Successfully!' : 'Enrolled Successfully!'}</h2>
                    <p className="text-gray-500 mb-8 leading-relaxed">The student record has been securely saved to the database.</p>
                    <Link to="/" className="w-full block bg-[#800000] text-white font-bold py-4 rounded-xl hover:bg-[#600000] transition-all shadow-lg shadow-red-200">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-gray-900 pb-20">

            {/* MODALS */}
            {showDuplicate && (
                <DuplicateModal
                    studentName={`${data.firstName} ${data.lastName}`}
                    onCancel={() => setShowDuplicate(false)}
                    onRetrieve={handleRetrieveDuplicate}
                />
            )}

            {showReview && (
                <ReviewModal
                    data={data}
                    loading={loading}
                    isUpdateMode={!!existingId}
                    onCancel={() => setShowReview(false)}
                    onConfirm={handleFinalSubmit}
                />
            )}

            {/* HERO HEADER */}
            <div className="bg-[#800000] pt-12 pb-24 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-20 -translate-y-20 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#FFD700]/10 rounded-full translate-x-20 translate-y-20 blur-3xl"></div>

                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
                    <div className="flex items-center gap-6">
                        <div className="bg-white p-2 rounded-2xl shadow-lg shadow-black/20">
                            <img src="/1.png" alt="Logo" className="w-16 h-16 object-contain" />
                        </div>
                        <div className="text-white">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none">SAN RAMON</h1>
                            <p className="text-[#FFD700] font-bold uppercase tracking-widest text-xs md:text-sm mt-1">Catholic School, Inc.</p>
                        </div>
                    </div>
                    {/* BACK BUTTON (Admin Link Removed) */}
                    <Link to="/" className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all flex items-center gap-2">
                         <span className="opacity-70">←</span> Back to Menu
                    </Link>
                </div>
            </div>

            {/* FORM CONTAINER */}
            <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20">
                <form onSubmit={handleInitialSubmit} className="space-y-6">

                    {/* CARD 1: ENROLLMENT CONFIG */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 md:p-8 border border-gray-100">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Enrollment Settings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            
                            {/* School Year */}
                            <div className="col-span-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">School Year</label>
                                <div className="relative">
                                    <select name="schoolYear" value={data.schoolYear} onChange={handleChange} className="w-full font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-[#800000] outline-none appearance-none transition-shadow">
                                        {schoolYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">▼</div>
                                </div>
                            </div>

                            {/* Grade Level */}
                            <div className="col-span-1 lg:col-span-1">
                                <label className="text-xs font-bold text-[#800000] uppercase tracking-wider mb-2 block">Grade Level</label>
                                <div className="relative">
                                    <select name="gradeLevel" value={data.gradeLevel} onChange={handleChange} required className="w-full font-bold text-gray-800 bg-white border-2 border-[#FFD700] rounded-xl p-3.5 focus:ring-2 focus:ring-[#800000] outline-none appearance-none shadow-sm transition-all">
                                        <option value="">-- Select --</option>
                                        <option value="Pre-Kindergarten 1">Pre-Kindergarten 1</option>
                                        <option value="Pre-Kindergarten 2">Pre-Kindergarten 2</option>
                                        <option value="Kinder">Kinder</option>
                                        {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map(g => (<option key={g} value={g}>{g}</option>))}
                                        <option value="Grade 11 (SHS)">Grade 11 (SHS)</option>
                                        <option value="Grade 12 (SHS)">Grade 12 (SHS)</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">▼</div>
                                </div>
                                {ageRule && !ageError && (
                                    <div className="mt-2 text-[10px] text-yellow-700 font-bold bg-yellow-50 p-2 rounded-lg border border-yellow-100 flex gap-1">
                                        <span>ℹ️</span> {ageRule}
                                    </div>
                                )}
                                {ageError && (
                                    <div className="mt-2 text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100 flex gap-1 animate-pulse">
                                        <span>⛔</span> Requirement not met
                                    </div>
                                )}
                            </div>

                            {/* Student Type */}
                            <div className="col-span-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Student Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['New', 'Old', 'Transferee', 'Returning'].map((type) => (
                                        <label key={type} className={`cursor-pointer text-center text-xs font-bold py-2 rounded-lg border transition-all ${data.studentType === type ? 'bg-[#800000] text-white border-[#800000]' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                                            <input type="radio" name="studentType" value={type} checked={data.studentType === type} onChange={handleChange} className="hidden" />
                                            {type}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* LRN Status */}
                            <div className="col-span-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">LRN Status</label>
                                <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                                    {['With LRN', 'No LRN'].map((status) => (
                                        <label key={status} className={`flex-1 cursor-pointer text-center text-xs font-bold py-2 rounded-lg transition-all ${data.lrnStatus === status ? 'bg-white text-[#800000] shadow-sm ring-1 ring-gray-200' : 'text-gray-400'}`}>
                                            <input type="radio" name="lrnStatus" value={status} checked={data.lrnStatus === status} onChange={handleChange} className="hidden" />
                                            {status}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: PERSONAL INFO */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 md:p-8 border border-gray-100">
                        <SectionHeader title="Student Information" icon={Icons.user} />
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <InputGroup label="PSA Birth Certificate No." name="psaCert" value={data.psaCert} onChange={handleChange} width="md:col-span-2" />
                            <InputGroup label="Learner Reference No. (LRN)" name="lrn" value={data.lrn} onChange={handleChange} width="md:col-span-2" placeholder="12-digit number" />
                            
                            <InputGroup label="Last Name" name="lastName" value={data.lastName} onChange={handleChange} required width="md:col-span-1" />
                            <InputGroup label="First Name" name="firstName" value={data.firstName} onChange={handleChange} required width="md:col-span-1" />
                            <InputGroup label="Middle Name" name="middleName" value={data.middleName} onChange={handleChange} width="md:col-span-1" />
                            <InputGroup label="Ext (Jr/II)" name="extension" value={data.extension} onChange={handleChange} width="md:col-span-1" />
                            
                            <InputGroup label="Date of Birth" name="dob" type="date" value={data.dob} onChange={handleChange} required width="md:col-span-1" />
                            
                            <div className="md:col-span-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 block">Sex</label>
                                <div className="flex gap-2">
                                    <RadioButton name="sex" value="Male" label="Male" checked={data.sex === 'Male'} onChange={handleChange} />
                                    <RadioButton name="sex" value="Female" label="Female" checked={data.sex === 'Female'} onChange={handleChange} />
                                </div>
                            </div>
                            
                            <InputGroup label="Age" name="age" type="number" value={data.age} onChange={handleChange} width="md:col-span-1" />
                            <InputGroup label="Mother Tongue" name="motherTongue" value={data.motherTongue} onChange={handleChange} width="md:col-span-1" />
                            
                            {/* IP Community Section */}
                            <div className="md:col-span-4 bg-gray-50 rounded-xl p-5 border border-gray-200 flex flex-col md:flex-row md:items-center gap-4 transition-all">
                                <div className="flex-shrink-0">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Indigenous People (IP) Community?</span>
                                </div>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="isIP" value="false" checked={!data.isIP} onChange={handleChange} className="accent-[#800000] w-4 h-4" />
                                        <span className={`text-sm font-bold ${!data.isIP ? 'text-[#800000]' : 'text-gray-500'}`}>No</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="isIP" value="true" checked={data.isIP} onChange={handleChange} className="accent-[#800000] w-4 h-4" />
                                        <span className={`text-sm font-bold ${data.isIP ? 'text-[#800000]' : 'text-gray-500'}`}>Yes</span>
                                    </label>
                                </div>
                                {data.isIP && (
                                    <input 
                                        type="text" 
                                        placeholder="SPECIFY COMMUNITY" 
                                        value={data.ipCommunity} 
                                        onChange={(e) => setData({ ...data, ipCommunity: e.target.value.toUpperCase() })} 
                                        className="flex-1 bg-white border-b-2 border-gray-300 focus:border-[#800000] outline-none px-3 py-1 text-sm font-bold text-gray-800 uppercase animate-fade-in" 
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CARD 3: ADDRESS */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 md:p-8 border border-gray-100">
                        <SectionHeader title="Home Address" icon={Icons.home} />
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                            <InputGroup label="House # / Street / Sitio" name="addressStreet" value={data.addressStreet} onChange={handleChange} width="md:col-span-2" />
                            <InputGroup label="Barangay" name="addressBarangay" value={data.addressBarangay} onChange={handleChange} width="md:col-span-2" />
                            <InputGroup label="City / Municipality" name="addressCity" value={data.addressCity} onChange={handleChange} width="md:col-span-2" />
                            <InputGroup label="Province" name="addressProvince" value={data.addressProvince} onChange={handleChange} width="md:col-span-3" />
                            <InputGroup label="Zip Code" name="addressZip" value={data.addressZip} onChange={handleChange} type="number" width="md:col-span-3" />
                        </div>
                    </div>

                    {/* CARD 4: PARENTS */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 md:p-8 border border-gray-100">
                        <SectionHeader title="Parent / Guardian" icon={Icons.family} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Father's Full Name" name="fatherName" value={data.fatherName} onChange={handleChange} placeholder="LAST, FIRST, MIDDLE" required />
                            <InputGroup label="Mother's Maiden Name" name="motherName" value={data.motherName} onChange={handleChange} placeholder="LAST, FIRST, MIDDLE" required />
                            <InputGroup label="Guardian's Name" name="guardianName" value={data.guardianName} onChange={handleChange} placeholder="IF APPLICABLE" />
                            
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Mobile No. 1" name="contactNumber1" value={data.contactNumber1} onChange={handleChange} type="tel" required placeholder="09XX-XXX-XXXX" />
                                <InputGroup label="Mobile No. 2" name="contactNumber2" value={data.contactNumber2} onChange={handleChange} type="tel" placeholder="OPTIONAL" />
                            </div>
                        </div>
                    </div>

                    {/* CARD 5: PREVIOUS SCHOOL (Conditional) */}
                    {showPrevSchool && (
                        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-xl shadow-blue-100/50 p-6 md:p-8 border border-blue-100 animate-fade-in">
                            <SectionHeader title="Previous School" icon={Icons.school} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <InputGroup label="Last School Attended" name="lastSchoolName" value={data.lastSchoolName} onChange={handleChange} required />
                                <InputGroup label="School Address" name="lastSchoolAddress" value={data.lastSchoolAddress} onChange={handleChange} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-blue-100">
                                <InputGroup label="Last Grade Level" name="lastGradeLevel" value={data.lastGradeLevel} onChange={handleChange} />
                                <InputGroup label="Last School Year" name="lastSchoolYear" value={data.lastSchoolYear} onChange={handleChange} />
                                <InputGroup label="School ID (If Known)" name="lastSchoolID" value={data.lastSchoolID || ''} onChange={handleChange} />
                            </div>
                        </div>
                    )}

                    {/* CARD 6: SHS DETAILS (Conditional) */}
                    {data.gradeLevel.includes('SHS') && (
                        <div className="bg-[#FFF8E1] rounded-2xl p-6 md:p-8 border border-[#FFD700] relative overflow-hidden animate-fade-in shadow-lg shadow-yellow-100">
                             <div className="absolute top-0 right-0 text-[#FFECB3] text-9xl font-black -mt-4 -mr-4 select-none opacity-40">SHS</div>
                             <div className="relative z-10">
                                <h3 className="text-lg font-bold text-[#800000] uppercase tracking-tight mb-6 flex items-center gap-2">
                                    <span>🎓</span> Senior High School Track
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="text-xs font-bold text-[#800000] uppercase tracking-wider mb-2 block">Semester</label>
                                        <div className="flex gap-2">
                                            <RadioButton name="semester" value="1ST SEMESTER" label="1st Sem" checked={data.semester === '1ST SEMESTER'} onChange={handleChange} />
                                            <RadioButton name="semester" value="2ND SEMESTER" label="2nd Sem" checked={data.semester === '2ND SEMESTER'} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <InputGroup label="Track" name="track" value={data.track} onChange={handleChange} placeholder="E.G. ACADEMIC" disabled={isTrackDisabled} />
                                        {showStrand && (<div className="animate-fade-in-down"><InputGroup label="Strand" name="strand" value={data.strand} onChange={handleChange} placeholder="E.G. STEM / ABM" /></div>)}
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}

                    {/* SUBMIT SECTION (SCROLLABLE NOW) */}
                    <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-lg mt-8 mb-8">
                        <div className="mb-6">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block text-center">Printed Parent/Guardian Name</label>
                            <div className="flex flex-wrap justify-center gap-4">
                                <RadioButton name="signatory" value="Father" label="Father" checked={data.signatory === 'Father'} onChange={handleChange} />
                                <RadioButton name="signatory" value="Mother" label="Mother" checked={data.signatory === 'Mother'} onChange={handleChange} />
                                <RadioButton name="signatory" value="Guardian" label="Guardian" checked={data.signatory === 'Guardian'} onChange={handleChange} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!isFormValid() || loading}
                            className={`w-full py-4 px-6 rounded-xl font-black text-lg text-white shadow-xl shadow-red-900/20 transform transition-all duration-300
                                ${!isFormValid() || loading
                                    ? 'bg-gray-300 cursor-not-allowed opacity-70 grayscale'
                                    : 'bg-[#800000] hover:bg-[#600000] hover:-translate-y-1 hover:shadow-2xl active:scale-[0.99]'
                                }`}
                        >
                            {loading ? 'PROCESSING...' : (existingId ? 'REVIEW & UPDATE APPLICATION' : 'REVIEW & SUBMIT APPLICATION')}
                        </button>

                        {!isFormValid() && (
                            <p className="text-center text-red-500 font-bold text-xs mt-3 animate-pulse bg-red-50 py-2 rounded-lg">
                                ⚠️ Please complete all required fields (marked with *) to proceed.
                            </p>
                        )}
                        <p className="text-center text-gray-400 text-[10px] mt-4 px-4 uppercase tracking-wide">
                            San Ramon Catholic School Enrollment System
                        </p>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EnrollmentForm;