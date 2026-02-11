import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";
import StatusModal from '../components/StatusModal';

// --- IMPORTED COMPONENTS ---
import { AuroraBackground, Icons, RadioButton } from '../components/enrollment/SharedUI';
import { 
    EnrollmentSettings, 
    StudentProfile, 
    AddressInfo, 
    ParentInfo, 
    PreviousSchoolInfo, 
    SHSDetails 
} from '../components/enrollment/FormSections';
import ReviewModal from '../components/enrollment/ReviewModal';

// --- NEW IMPORT: FEE UTILS ---
import { calculateTotalFees } from '../utils/FeeConstants';

// Helper to generate a Reference Number (e.g. SRCS-2025-A7B3)
const generateReferenceNumber = () => {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 for clarity
    let randomStr = '';
    for (let i = 0; i < 6; i++) {
        randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SRCS-${year}-${randomStr}`;
};

const EnrollmentForm = () => {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [existingId, setExistingId] = useState(null);
    const [captchaToken, setCaptchaToken] = useState(null);
    
    // Status Modal State
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });

    const closeModal = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    }, []);

    const triggerModal = (type, title, message) => {
        setModalState({ isOpen: true, type, title, message });
    };

    // Reference Number State
    const [referenceNumber, setReferenceNumber] = useState(null);

    // Config
    const currentYear = new Date().getFullYear();
    
    // School Year Options
    const schoolYearOptions = useMemo(() => Array.from({ length: 10 }, (_, i) => {
        const start = currentYear + i; 
        return `${start}-${start + 1}`;
    }), [currentYear]);

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
        semester: '', track: '', strand: '',
        studentPhotoUrl: '', 
        psaScanUrl: '',
        psaScanUrl2: '',
        status: 'Pending',
        website_url: '' 
    });

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

    // Derived state for validation
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

    // MEMOIZED HANDLERS
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        
        if (['lastName', 'firstName', 'middleName', 'fatherName', 'motherName'].includes(name)) {
            if (/[^a-zA-Z\s\-\.\'\,ñÑ]/.test(value)) {
                return;
            }
        }
        
        let finalValue = value;
        if (typeof value === 'string' && 
            type !== 'date' && 
            type !== 'password' && 
            type !== 'email' && 
            type !== 'radio' && 
            type !== 'select-one' &&
            name !== 'website_url') { 
            finalValue = value.toUpperCase();
        }

        if (name === 'isIP') {
            setData(prev => ({ ...prev, isIP: value === 'true', ipCommunity: value === 'false' ? '' : prev.ipCommunity }));
        } else {
            setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : finalValue }));
        }
    }, []); 

    const handlePhotoUpload = useCallback((url) => setData(prev => ({ ...prev, studentPhotoUrl: url })), []);
    const handlePhotoRemove = useCallback(() => setData(prev => ({ ...prev, studentPhotoUrl: '' })), []);

    const handlePsaUpload = useCallback((url, page = 1) => {
        if (page === 1) setData(prev => ({ ...prev, psaScanUrl: url }));
        else setData(prev => ({ ...prev, psaScanUrl2: url }));
    }, []);

    const handlePsaRemove = useCallback((page = 1) => {
        if (page === 1) setData(prev => ({ ...prev, psaScanUrl: '' }));
        else setData(prev => ({ ...prev, psaScanUrl2: '' }));
    }, []);

    const isFormValid = () => {
        if (ageError) return false;
        if (!data.gradeLevel || !data.lastName || !data.firstName || !data.dob || !data.fatherName || !data.motherName || !data.contactNumber1) return false;
        
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(data.contactNumber1)) return false;

        if (showPrevSchool && (!data.lastSchoolName || !data.lastSchoolAddress)) return false;
        return true;
    };

    useEffect(() => {
        if (isTrackDisabled) setData(prev => ({ ...prev, track: '', strand: '' }));
        if (!showStrand && data.strand !== '') setData(prev => ({ ...prev, strand: '' }));
    }, [isTrackDisabled, showStrand, data.strand]);

    const handleInitialSubmit = (e) => {
        e.preventDefault();

        if (data.website_url !== "") {
            console.warn("Bot detected via Honeypot");
            return;
        }
        
        if (!captchaToken && !existingId) { 
            triggerModal('warning', 'Verification Required', "Please complete the 'I am not a robot' verification before submitting.");
            return;
        }

        if (!isFormValid()) {
            triggerModal('error', 'Incomplete Information', "Please fix the errors in the form or fill out all required fields (marked with *).");
            return;
        }
        
        setShowReview(true);
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            const { website_url, ...submissionData } = data;

            let finalRefNumber = referenceNumber;
            if (!existingId) {
                finalRefNumber = generateReferenceNumber();
            }

            // --- FEE CALCULATION (FULL TUITION) ---
            const feeDetails = calculateTotalFees(data.gradeLevel);
            let initialSOA = null;

            if (feeDetails) {
                // We default to 'None' for subsidy. Admin applies it later.
                const totalAssessment = feeDetails.totalAssessment;
                
                initialSOA = {
                    feeBreakdown: feeDetails,
                    totalAssessment: totalAssessment,
                    subsidyType: 'None', 
                    subsidyAmount: 0,
                    discount: 0,
                    balance: totalAssessment, // Full balance initially
                    payments: [],
                    paymentStatus: 'Unpaid',
                    lastUpdated: new Date()
                };
            }
            // ----------------------------------

            const payload = {
                ...submissionData,
                referenceNumber: finalRefNumber, 
                updatedAt: new Date(),
                soa: initialSOA // Save SOA to Firestore
            };

            if (existingId) {
                const docRef = doc(db, "enrollments", existingId);
                await updateDoc(docRef, payload);
            } else {
                const cleanStr = (str) => {
                    return str && str.toString()
                        .toUpperCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^A-Z0-9\s]/g, '') 
                        .trim()
                        .replace(/\s+/g, '-');
                };

				const uniqueId = `${cleanStr(data.lastName)}-${cleanStr(data.firstName)}-${data.dob}-${data.schoolYear}`;
                
                await setDoc(doc(db, "enrollments", uniqueId), { 
                    ...payload, 
                    createdAt: new Date(),
                    status: 'Pending'
                });
            }
            
            setReferenceNumber(finalRefNumber);
            setShowReview(false);
            setSubmitted(true);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error("Submission Error:", error);
            if (error.code === 'permission-denied' || error.message.includes('permission-denied')) {
                setShowReview(false);
                triggerModal(
                    'warning', 
                    'Application Already Exists', 
                    'It appears this student has already submitted an application for this school year. Please check your status on the Main Page or contact the registrar.'
                );
            } else {
                setShowReview(false);
                triggerModal(
                    'error', 
                    'Submission Failed', 
                    'An error occurred while submitting the form. Please check your internet connection and try again.'
                );
            }
        }
        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden font-sans bg-slate-50">
                <AuroraBackground />
                
                <div className="relative z-10 bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-[2rem] shadow-2xl text-center max-w-md w-full border border-white">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-lg border border-emerald-100">
                        {Icons.check}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">{existingId ? 'Updated Successfully!' : 'Pre-Enrolled Successfully!'}</h2>
                    
                    {referenceNumber && (
                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-8 relative overflow-hidden group shadow-sm mt-6 text-left">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                {Icons.school}
                            </div>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Your Reference Number</p>
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-2xl md:text-3xl font-black text-indigo-900 tracking-tight">{referenceNumber}</h3>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(referenceNumber);
                                        triggerModal('success', 'Copied!', 'Reference number copied to clipboard.');
                                    }}
                                    className="p-2 bg-white rounded-lg shadow-sm text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 transition-colors"
                                    title="Copy to Clipboard"
                                >
                                    {Icons.copy}
                                </button>
                            </div>
                            <p className="text-[10px] text-indigo-400 mt-2 font-medium leading-relaxed">
                                Please save this number. You will need it to track your enrollment progress.
                            </p>
                        </div>
                    )}
                    
                    <div className="text-left text-sm text-slate-600 leading-relaxed space-y-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <p className="font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-xs">
                           ⚠ IMPORTANT: Visit the school in person to submit these requirements on Enrollment Day:
                        </p>
                        
                        <ul className="list-disc pl-5 text-[11px] text-slate-600 space-y-1 font-medium">
                            <li>Baptismal Certificate (Photocopy)</li>
                            <li>PSA Birth Certificate (Photocopy)</li>
                            <li>Report Card & Diploma (Photocopy)</li>
                            <li>Certificate of Good Moral Character</li>
                            <li>Certificate of Honor (If applicable)</li>
                        </ul>
                        
                        <p className="text-[10px] text-slate-500 italic mt-2">
                            Please proceed to the <strong>Guidance Office</strong> to claim your printed form.
                        </p>
                    </div>

                    <Link to="/enrollment-landing" className="w-full block bg-gradient-to-r from-[#800000] to-red-600 text-white font-bold py-4 rounded-2xl hover:to-red-500 transition-all shadow-lg hover:-translate-y-1 active:scale-95">
                        Back to Home
                    </Link>
                </div>
                <StatusModal 
                    isOpen={modalState.isOpen}
                    type={modalState.type}
                    title={modalState.title}
                    message={modalState.message}
                    onClose={closeModal}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans text-slate-800 pb-20 relative selection:bg-indigo-100 selection:text-indigo-900 bg-slate-50">

            <StatusModal 
                isOpen={modalState.isOpen}
                type={modalState.type}
                title={modalState.title}
                message={modalState.message}
                onClose={closeModal}
            />

            {showReview && (
                <ReviewModal
                    data={data}
                    loading={loading}
                    isUpdateMode={!!existingId}
                    onCancel={() => setShowReview(false)}
                    onConfirm={handleFinalSubmit}
                />
            )}

            <AuroraBackground />

            {/* HEADER */}
            <div className="relative z-10 pt-12 pb-10 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white">
                            <img src="/1.png" alt="Logo" className="w-14 h-14 object-contain drop-shadow-sm" />
                        </div>
                        <div className="text-slate-900">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none drop-shadow-sm uppercase">Enrollment Form</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs mt-1">San Ramon Catholic School, Inc.</p>
                        </div>
                    </div>
                    <Link to="/enrollment-landing" className="px-6 py-3 bg-white/80 backdrop-blur-md border border-white rounded-full text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-indigo-700 transition-all flex items-center gap-2 group shadow-sm">
                         <span className="opacity-70 group-hover:-translate-x-1 transition-transform">{Icons.arrowLeft}</span> Back to Menu
                    </Link>
                </div>
            </div>

            {/* FORM CONTAINER */}
            <div className="max-w-5xl mx-auto px-4 relative z-20">
                <form onSubmit={handleInitialSubmit} className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-6 md:p-12 shadow-2xl shadow-indigo-100/40">

                    <div className="opacity-0 absolute -z-10 top-0 left-0 h-0 w-0 overflow-hidden">
                         <label htmlFor="website_url">Website</label>
                         <input 
                             type="text" 
                             name="website_url" 
                             id="website_url" 
                             value={data.website_url}
                             onChange={handleChange}
                             tabIndex="-1" 
                             autoComplete="off"
                         />
                    </div>

                    <EnrollmentSettings 
                        data={data} 
                        handleChange={handleChange} 
                        schoolYearOptions={schoolYearOptions} 
                        ageRule={ageRule} 
                        ageError={ageError} 
                    />

                    <StudentProfile 
                        data={data} 
                        handleChange={handleChange}
                        onPhotoUpload={handlePhotoUpload}
                        onPhotoRemove={handlePhotoRemove}
                        onPsaUpload={handlePsaUpload}
                        onPsaRemove={handlePsaRemove}
                        setModal={setModalState}
                    />

                    <AddressInfo 
                        data={data} 
                        handleChange={handleChange} 
                    />

                    <ParentInfo 
                        data={data} 
                        handleChange={handleChange} 
                    />

                    <PreviousSchoolInfo 
                        data={data} 
                        handleChange={handleChange} 
                        show={showPrevSchool} 
                    />

                    <SHSDetails 
                        data={data} 
                        handleChange={handleChange} 
                        isTrackDisabled={isTrackDisabled} 
                        showStrand={showStrand} 
                    />

                    {/* SUBMIT SECTION */}
                    <div className="bg-slate-50/80 backdrop-blur-sm rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-inner mt-12 mb-4">
                        <div className="mb-10 text-center">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 block">Printed Parent/Guardian Name</label>
                            <div className="flex flex-wrap justify-center gap-4">
                                <RadioButton name="signatory" value="Father" label="Father" checked={data.signatory === 'Father'} onChange={handleChange} />
                                <RadioButton name="signatory" value="Mother" label="Mother" checked={data.signatory === 'Mother'} onChange={handleChange} />
                                <RadioButton name="signatory" value="Guardian" label="Guardian" checked={data.signatory === 'Guardian'} onChange={handleChange} />
                            </div>
                        </div>

                        {/* SECURITY: RECAPTCHA WIDGET */}
                        <div className="flex justify-center mb-8">
                            <ReCAPTCHA
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                onChange={(token) => setCaptchaToken(token)}
                                theme="light" 
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!isFormValid() || loading || (!existingId && !captchaToken)}
                            className={`w-full h-16 rounded-2xl font-black text-lg text-white shadow-xl transform transition-all duration-300 flex items-center justify-center gap-3 active:scale-95
                                ${!isFormValid() || loading || (!existingId && !captchaToken)
                                    ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                                    : 'bg-gradient-to-r from-[#800000] via-red-600 to-[#800000] bg-[length:200%_auto] hover:bg-right transition-[background-position] hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-900/20'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    PROCESSING...
                                </>
                            ) : (
                                existingId ? 'REVIEW & UPDATE APPLICATION' : 'REVIEW & SUBMIT APPLICATION'
                            )}
                        </button>

                        {!isFormValid() && (
                            <div className="flex items-center justify-center gap-2 text-center text-red-600 font-bold text-xs mt-6 bg-red-50 py-4 rounded-xl border border-red-200 animate-pulse">
                                {Icons.alert} <span>Please complete all required fields (marked with *) to proceed.</span>
                            </div>
                        )}

                        {isFormValid() && !captchaToken && !existingId && (
                            <div className="flex items-center justify-center gap-2 text-center text-amber-600 font-bold text-xs mt-6 bg-amber-50 py-4 rounded-xl border border-amber-200 animate-pulse">
                                {Icons.alert} <span>Please check the "I am not a robot" box above.</span>
                            </div>
                        )}

                        <p className="text-center text-slate-400 text-[10px] mt-8 px-4 uppercase tracking-widest font-bold">
                            San Ramon Catholic School Enrollment System © {currentYear}
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EnrollmentForm;