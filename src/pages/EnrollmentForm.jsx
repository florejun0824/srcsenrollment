// src/pages/EnrollmentForm.jsx
import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";

// ==========================================
// 0. OPTIMIZED AURORA BACKGROUND (MEMOIZED)
// ==========================================
const AuroraBackground = memo(() => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white/60 to-slate-100/80" />
        {/* Blob 1 */}
        <div 
            className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-300/30 rounded-full blur-[100px] mix-blend-multiply"
            style={{ transform: 'translate3d(0,0,0)', willChange: 'transform' }} // Added willChange
        />
        {/* Blob 2 */}
        <div 
            className="absolute top-[10%] right-[-20%] w-[60vw] h-[60vw] bg-fuchsia-300/30 rounded-full blur-[100px] mix-blend-multiply"
            style={{ transform: 'translate3d(0,0,0)', willChange: 'transform' }}
        />
        {/* Blob 3 */}
        <div 
            className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-cyan-300/30 rounded-full blur-[100px] mix-blend-multiply"
            style={{ transform: 'translate3d(0,0,0)', willChange: 'transform' }}
        />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
    </div>
));

AuroraBackground.displayName = 'AuroraBackground';

// ==========================================
// 1. ICONS (SVG) - Static Object (No Changes Needed)
// ==========================================
const Icons = {
    user: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    home: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    family: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    school: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    check: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
    alert: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    upload: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
    trash: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
    eye: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
    plus: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
    arrowLeft: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    copy: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
};

// ==========================================
// 2. REUSABLE UI COMPONENTS (MEMOIZED)
// ==========================================

const InputGroup = memo(({ label, name, value, onChange, type = "text", required = false, placeholder = "", width = "col-span-1", disabled = false, pattern, errorMessage }) => (
    <div className={`flex flex-col ${width} group relative`}>
        <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-red-600 transition-colors">
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
            pattern={pattern}
            className={`w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm md:text-base rounded-2xl px-5 py-4
            focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 
            hover:border-slate-300 transition-all duration-300 outline-none shadow-sm
            placeholder:text-slate-400 placeholder:text-xs placeholder:uppercase placeholder:font-bold
            invalid:border-red-300 invalid:text-red-600
            disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100`}
        />
        {errorMessage && (
            <span className="hidden peer-invalid:block text-[10px] text-red-500 mt-1 ml-1 font-medium">{errorMessage}</span>
        )}
    </div>
));
InputGroup.displayName = 'InputGroup';

const RadioButton = memo(({ name, value, label, checked, onChange }) => (
    <label className={`relative flex items-center justify-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex-1 active:scale-95
        ${checked 
            ? 'border-red-500 bg-red-50/50 text-red-700 shadow-md shadow-red-100' 
            : 'border-slate-200 bg-white/50 text-slate-600 hover:bg-white hover:border-slate-300' 
        }`}>
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        {checked && (
            <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        )}
    </label>
));
RadioButton.displayName = 'RadioButton';

const SectionHeader = memo(({ title, icon }) => (
    <div className="flex items-center gap-4 mb-8 pt-8 border-t border-slate-100 first:border-0 first:pt-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-[#800000] flex items-center justify-center text-white shadow-lg shadow-red-200/50 border border-white">
            {icon}
        </div>
        <div className="flex flex-col">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">{title}</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fill in the details below</span>
        </div>
    </div>
));
SectionHeader.displayName = 'SectionHeader';

const FileUploadGroup = memo(({ label, onUploadComplete, onRemove, required = false, existingUrl }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(existingUrl || null);

    useEffect(() => {
        setPreview(existingUrl);
    }, [existingUrl]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large! Please upload a file smaller than 5MB.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

        if (!uploadPreset || !cloudName) {
            console.error("Missing Cloudinary configuration in .env file");
            alert("System configuration error. Please contact admin.");
            setUploading(false);
            return;
        }

        formData.append("upload_preset", uploadPreset);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            
            if (data.secure_url) {
                setPreview(data.secure_url);
                onUploadComplete(data.secure_url);
            } else {
                console.error("Upload Error:", data);
                alert("Upload failed. Please check console.");
            }
        } catch (err) {
            console.error("Error uploading:", err);
            alert("Error uploading file.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = (e) => {
        e.preventDefault();
        if (window.confirm("Are you sure you want to remove this file?")) {
            setPreview(null);
            onRemove(); 
        }
    };

    return (
        <div className="flex flex-col md:col-span-2 group">
            <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className={`relative flex items-center gap-4 p-4 rounded-2xl border border-dashed transition-all duration-300
                ${preview ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 bg-slate-50/50 hover:bg-white hover:border-slate-400'}`}>
                
                {!preview ? (
                    <label className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-3 py-6 cursor-pointer transition-all
                        ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors 
                            ${uploading ? 'bg-slate-200' : 'bg-white border border-slate-200 text-red-500 shadow-sm'}`}>
                            {uploading ? (
                                <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"/>
                            ) : (
                                Icons.upload
                            )}
                        </div>
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                {uploading ? 'Uploading...' : 'Click to Upload File'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Max 5MB (Image/PDF)</span>
                        </div>
                        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} disabled={uploading} className="hidden" />
                    </label>
                ) : (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                                {Icons.check}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-emerald-700 truncate">Upload Complete</span>
                                <a href={preview} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:underline transition-colors mt-0.5">
                                    {Icons.eye} View Document
                                </a>
                            </div>
                        </div>
                        <button 
                            onClick={handleRemove} 
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
                            title="Remove File"
                        >
                            {Icons.trash}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});
FileUploadGroup.displayName = 'FileUploadGroup';

// ==========================================
// 3. FORM SECTIONS (MEMOIZED)
// ==========================================

const EnrollmentSettings = memo(({ data, handleChange, schoolYearOptions, ageRule, ageError }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-8">Enrollment Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="col-span-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">School Year</label>
                <div className="relative group">
                    <select name="schoolYear" value={data.schoolYear} onChange={handleChange} className="w-full font-bold text-slate-700 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl p-4 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none appearance-none cursor-pointer transition-all shadow-sm">
                        {schoolYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400 text-xs">▼</div>
                </div>
            </div>

            <div className="col-span-1 lg:col-span-1">
                <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 block">Grade Level</label>
                <div className="relative group">
                    <select name="gradeLevel" value={data.gradeLevel} onChange={handleChange} required className="w-full font-bold text-slate-700 bg-amber-50/50 backdrop-blur-sm border border-amber-200 rounded-2xl p-4 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none appearance-none shadow-sm cursor-pointer transition-all">
                        <option value="">-- Select Level --</option>
                        <option value="Pre-Kindergarten 1">Pre-Kindergarten 1</option>
                        <option value="Pre-Kindergarten 2">Pre-Kindergarten 2</option>
                        <option value="Kinder">Kinder</option>
                        {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map(g => (<option key={g} value={g}>{g}</option>))}
                        <option value="Grade 11 (SHS)">Grade 11 (SHS)</option>
                        <option value="Grade 12 (SHS)">Grade 12 (SHS)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-amber-600 text-xs">▼</div>
                </div>
                {ageRule && !ageError && <div className="mt-3 text-[10px] text-amber-700 font-bold bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2"><span>💡</span> {ageRule}</div>}
                {ageError && <div className="mt-3 text-[10px] text-red-600 font-bold bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-2 animate-pulse"><span>🚫</span> Requirement not met</div>}
            </div>

            <div className="col-span-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Student Type</label>
                <div className="grid grid-cols-2 gap-3">
                    {['New', 'Old', 'Transferee', 'Returning'].map((type) => (
                        <RadioButton key={type} name="studentType" value={type} label={type} checked={data.studentType === type} onChange={handleChange} />
                    ))}
                </div>
            </div>

            <div className="col-span-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">LRN Status</label>
                <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200">
                    {['With LRN', 'No LRN'].map((status) => (
                        <label key={status} className={`flex-1 cursor-pointer text-center text-[10px] font-bold uppercase py-3 rounded-xl transition-all 
                            ${data.lrnStatus === status 
                                ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200' 
                                : 'text-slate-400 hover:text-slate-600'}`}>
                            <input type="radio" name="lrnStatus" value={status} checked={data.lrnStatus === status} onChange={handleChange} className="hidden" />
                            {status}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    </div>
));
EnrollmentSettings.displayName = 'EnrollmentSettings';

const StudentProfile = memo(({ data, handleChange, onPhotoUpload, onPhotoRemove, onPsaUpload, onPsaRemove }) => {
    const [showPage2, setShowPage2] = useState(false);

    return (
        <div className="mb-10">
            <SectionHeader title="Student Profile" icon={Icons.user} />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* --- DOCUMENTS UPLOAD SECTION --- */}
                <div className="md:col-span-4 bg-slate-50/50 rounded-3xl p-6 md:p-8 border border-slate-200 mb-4 shadow-inner">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                        {Icons.upload} Documents (Optional)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FileUploadGroup 
                            label="Student 2x2 ID Photo" 
                            onUploadComplete={onPhotoUpload} 
                            onRemove={onPhotoRemove}
                            required={false} 
                            existingUrl={data.studentPhotoUrl} 
                        />
                        
                        <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-1">
                            <FileUploadGroup 
                                label="Scanned PSA Birth Certificate (Page 1)" 
                                onUploadComplete={(url) => onPsaUpload(url, 1)} 
                                onRemove={() => onPsaRemove(1)}
                                existingUrl={data.psaScanUrl} 
                            />

                            {data.psaScanUrl2 || showPage2 ? (
                                <div className="animate-fade-in-down">
                                    <FileUploadGroup 
                                        label="Scanned PSA Birth Certificate (Page 2)" 
                                        onUploadComplete={(url) => onPsaUpload(url, 2)} 
                                        onRemove={() => { onPsaRemove(2); setShowPage2(false); }}
                                        existingUrl={data.psaScanUrl2} 
                                    />
                                </div>
                            ) : (
                                <div>
                                    <button 
                                        type="button"
                                        onClick={() => setShowPage2(true)}
                                        className="text-[10px] font-bold text-red-600 flex items-center gap-2 hover:underline opacity-80 hover:opacity-100 transition-all bg-white px-4 py-2 rounded-xl border border-dashed border-red-200 hover:border-red-500 shadow-sm"
                                    >
                                        {Icons.plus} Add Page 2 (Back Page)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <InputGroup label="PSA Birth Certificate No." name="psaCert" value={data.psaCert} onChange={handleChange} width="md:col-span-2" />
                <InputGroup label="Learner Reference No. (LRN)" name="lrn" value={data.lrn} onChange={handleChange} width="md:col-span-2" placeholder="12-digit number" />
                
                <InputGroup label="Last Name" name="lastName" value={data.lastName} onChange={handleChange} required width="md:col-span-1" />
                <InputGroup label="First Name" name="firstName" value={data.firstName} onChange={handleChange} required width="md:col-span-1" />
                <InputGroup label="Middle Name" name="middleName" value={data.middleName} onChange={handleChange} width="md:col-span-1" />
                <InputGroup label="Extension (Jr/II)" name="extension" value={data.extension} onChange={handleChange} width="md:col-span-1" />
                
                <InputGroup label="Date of Birth" name="dob" type="date" value={data.dob} onChange={handleChange} required width="md:col-span-1" />
                
                <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1 block">Sex</label>
                    <div className="flex gap-3">
                        <RadioButton name="sex" value="Male" label="Male" checked={data.sex === 'Male'} onChange={handleChange} />
                        <RadioButton name="sex" value="Female" label="Female" checked={data.sex === 'Female'} onChange={handleChange} />
                    </div>
                </div>
                
                <InputGroup label="Age" name="age" type="number" value={data.age} onChange={handleChange} width="md:col-span-1" />
                <InputGroup label="Mother Tongue" name="motherTongue" value={data.motherTongue} onChange={handleChange} width="md:col-span-1" />
                
                <div className="md:col-span-4 bg-slate-50/50 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center gap-6 shadow-sm">
                    <div className="flex-shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Belong to Indigenous People (IP)?</span>
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${!data.isIP ? 'border-red-500 bg-white' : 'border-slate-300 bg-white'}`}>
                                {!data.isIP && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                            </div>
                            <input type="radio" name="isIP" value="false" checked={!data.isIP} onChange={handleChange} className="hidden" />
                            <span className="text-xs font-bold uppercase text-slate-700">No</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${data.isIP ? 'border-red-500 bg-white' : 'border-slate-300 bg-white'}`}>
                                {data.isIP && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                            </div>
                            <input type="radio" name="isIP" value="true" checked={data.isIP} onChange={handleChange} className="hidden" />
                            <span className="text-xs font-bold uppercase text-slate-700">Yes</span>
                        </label>
                    </div>
                    {data.isIP && (
                        <input 
                            type="text" 
                            placeholder="SPECIFY COMMUNITY" 
                            value={data.ipCommunity} 
                            onChange={(e) => handleChange({ target: { name: 'ipCommunity', value: e.target.value }})}
                            className="flex-1 bg-transparent border-b-2 border-slate-300 focus:border-red-500 outline-none px-2 py-1 text-sm font-bold text-red-600 uppercase placeholder:text-slate-400 animate-fade-in" 
                        />
                    )}
                </div>
            </div>
        </div>
    );
});
StudentProfile.displayName = 'StudentProfile';

const AddressInfo = memo(({ data, handleChange }) => (
    <div className="mb-10">
        <SectionHeader title="Home Address" icon={Icons.home} />
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <InputGroup label="House # / Street / Sitio" name="addressStreet" value={data.addressStreet} onChange={handleChange} width="md:col-span-2" />
            <InputGroup label="Barangay" name="addressBarangay" value={data.addressBarangay} onChange={handleChange} width="md:col-span-2" />
            <InputGroup label="City / Municipality" name="addressCity" value={data.addressCity} onChange={handleChange} width="md:col-span-2" />
            <InputGroup label="Province" name="addressProvince" value={data.addressProvince} onChange={handleChange} width="md:col-span-3" />
            <InputGroup label="Zip Code" name="addressZip" value={data.addressZip} onChange={handleChange} type="number" width="md:col-span-3" />
        </div>
    </div>
));
AddressInfo.displayName = 'AddressInfo';

const ParentInfo = memo(({ data, handleChange }) => (
    <div className="mb-10">
        <SectionHeader title="Parent / Guardian" icon={Icons.family} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Father's Full Name" name="fatherName" value={data.fatherName} onChange={handleChange} placeholder="LAST, FIRST, MIDDLE" required />
            <InputGroup label="Mother's Maiden Name" name="motherName" value={data.motherName} onChange={handleChange} placeholder="LAST, FIRST, MIDDLE" required />
            <InputGroup label="Guardian's Name" name="guardianName" value={data.guardianName} onChange={handleChange} placeholder="IF APPLICABLE" />
            
            <div className="grid grid-cols-2 gap-4">
                <InputGroup 
                    label="Mobile No. 1" 
                    name="contactNumber1" 
                    value={data.contactNumber1} 
                    onChange={handleChange} 
                    type="tel" 
                    required 
                    placeholder="09XXXXXXXXX"
                    pattern="^09\d{9}$" // Regex: Starts with 09, followed by 9 digits
                />
                <InputGroup label="Mobile No. 2" name="contactNumber2" value={data.contactNumber2} onChange={handleChange} type="tel" placeholder="Optional" />
            </div>
        </div>
    </div>
));
ParentInfo.displayName = 'ParentInfo';

const PreviousSchoolInfo = memo(({ data, handleChange, show }) => {
    if (!show) return null;
    return (
        <div className="bg-blue-50/50 rounded-2xl p-6 md:p-8 border border-blue-100 mb-10 animate-fade-in-up">
            <SectionHeader title="Previous School" icon={Icons.school} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <InputGroup label="Last School Attended" name="lastSchoolName" value={data.lastSchoolName} onChange={handleChange} required />
                <InputGroup label="School Address" name="lastSchoolAddress" value={data.lastSchoolAddress} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-blue-200">
                <InputGroup label="Last Grade Level" name="lastGradeLevel" value={data.lastGradeLevel} onChange={handleChange} />
                <InputGroup label="Last School Year" name="lastSchoolYear" value={data.lastSchoolYear} onChange={handleChange} />
                <InputGroup label="School ID (If Known)" name="lastSchoolID" value={data.lastSchoolID || ''} onChange={handleChange} />
            </div>
        </div>
    );
});
PreviousSchoolInfo.displayName = 'PreviousSchoolInfo';

const SHSDetails = memo(({ data, handleChange, isTrackDisabled, showStrand }) => {
    if (!data.gradeLevel.includes('SHS')) return null;
    return (
        <div className="bg-amber-50/50 rounded-2xl p-6 md:p-8 border border-amber-200 relative overflow-hidden mb-8 animate-fade-in shadow-lg shadow-amber-100/50">
             <div className="absolute top-0 right-0 text-amber-500/10 text-[10rem] font-black -mt-8 -mr-8 select-none pointer-events-none">SHS</div>
             <div className="relative z-10">
                <h3 className="text-xl font-black text-amber-600 uppercase tracking-tight mb-8 flex items-center gap-3">
                    <span className="text-3xl">🎓</span> Senior High School Track
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <label className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-3 block">Semester</label>
                        <div className="flex gap-3">
                            <RadioButton name="semester" value="1ST SEMESTER" label="1st Sem" checked={data.semester === '1ST SEMESTER'} onChange={handleChange} />
                            <RadioButton name="semester" value="2ND SEMESTER" label="2nd Sem" checked={data.semester === '2ND SEMESTER'} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <InputGroup label="Track" name="track" value={data.track} onChange={handleChange} placeholder="E.G. ACADEMIC" disabled={isTrackDisabled} />
                        {showStrand && (<div className="animate-fade-in-down"><InputGroup label="Strand" name="strand" value={data.strand} onChange={handleChange} placeholder="E.G. STEM / ABM" /></div>)}
                    </div>
                </div>
             </div>
        </div>
    );
});
SHSDetails.displayName = 'SHSDetails';

// ==========================================
// 4. HELPERS
// ==========================================

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

// ==========================================
// 5. MAIN PAGE LOGIC
// ==========================================
const EnrollmentForm = () => {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [existingId, setExistingId] = useState(null);
    const [captchaToken, setCaptchaToken] = useState(null);
    
    // NEW: State for the generated Reference Number
    const [referenceNumber, setReferenceNumber] = useState(null);

    // Config
    const currentYear = new Date().getFullYear();
    
    // MEMOIZED: Prevent array recreation on every render
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

    // MEMOIZED: Stabilize function identity so child components don't re-render
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
    }, []); // No dependencies needed due to functional state update

    // MEMOIZED: File handlers
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
            alert("Please complete the 'I am not a robot' verification.");
            return;
        }

        if (!isFormValid()) {
            alert("Please fix errors in the form (e.g., Invalid Phone Number)");
            return;
        }
        
        setShowReview(true);
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            const { website_url, ...submissionData } = data;

            // Generate Reference Number
            let finalRefNumber = referenceNumber;
            if (!existingId) {
                finalRefNumber = generateReferenceNumber();
            }

            const payload = {
                ...submissionData,
                referenceNumber: finalRefNumber, // Save to DB
                updatedAt: new Date()
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

                const uniqueId = `${cleanStr(data.lastName)}-${cleanStr(data.firstName)}-${data.dob}`;
                
                await setDoc(doc(db, "enrollments", uniqueId), { 
                    ...payload, 
                    createdAt: new Date(),
                    status: 'Pending'
                });
            }
            
            // Set the generated ref number to state so we can display it in the success screen
            setReferenceNumber(finalRefNumber);
            setShowReview(false);
            setSubmitted(true);
            window.scrollTo(0, 0);
        } catch (error) {
            console.error("Submission Error:", error);
            
            if (error.code === 'permission-denied') {
                alert("Submission Failed: It appears this student is already enrolled. Please contact the Registrar.");
            } else {
                alert("Error submitting form. Please check your internet connection.");
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
                    
                    {/* --- NEW REFERENCE NUMBER CARD --- */}
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
                                        alert("Reference number copied to clipboard!");
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
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans text-slate-800 pb-20 relative selection:bg-indigo-100 selection:text-indigo-900 bg-slate-50">

            {showReview && (
                <ReviewModal
                    data={data}
                    loading={loading}
                    isUpdateMode={!!existingId}
                    onCancel={() => setShowReview(false)}
                    onConfirm={handleFinalSubmit}
                />
            )}

            {/* LIGHT AURORA BACKGROUND */}
            <AuroraBackground />

            {/* HEADER */}
            <div className="relative z-10 pt-12 pb-10 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white">
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
                <form onSubmit={handleInitialSubmit} className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] p-6 md:p-12 shadow-2xl shadow-indigo-100/40">

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
                    <div className="bg-slate-50/50 backdrop-blur-sm rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-inner mt-12 mb-4">
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
                            className={`w-full h-14 rounded-2xl font-black text-lg text-white shadow-xl transform transition-all duration-300 flex items-center justify-center gap-3 active:scale-95
                                ${!isFormValid() || loading || (!existingId && !captchaToken)
                                    ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                                    : 'bg-gradient-to-r from-[#800000] to-red-600 hover:to-red-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-200'
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

const ReviewModal = ({ data, onCancel, onConfirm, loading, isUpdateMode }) => {
    const DataRow = ({ label, value }) => (
        <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-100 py-3 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-0">{label}</span>
            <span className="text-sm font-bold text-slate-900 text-right break-words">{value || <span className="text-slate-400 font-normal italic">N/A</span>}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-white overflow-hidden">
                {/* Modal Header */}
                <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#800000] text-white rounded-full flex items-center justify-center shadow-lg shadow-red-100">
                            {isUpdateMode ? '🔄' : '📋'}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{isUpdateMode ? 'Update Record' : 'Confirm Enrollment'}</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Verify Details</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors">✕</button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar bg-slate-50/50">
                    <div className="space-y-6">
                        {/* WARNING NOTICE */}
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h4 className="text-amber-600 font-black text-xs uppercase mb-1">Final Review Required</h4>
                                <p className="text-amber-700/80 text-[11px] leading-relaxed">
                                    Please double-check all information below. 
                                    <strong className="text-amber-800"> Once submitted, you cannot edit these details </strong> 
                                    unless you visit the Registrar's Office.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                            <h4 className="text-red-500 font-bold uppercase text-[10px] tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Enrollment Details
                            </h4>
                            <DataRow label="SY / Grade" value={`${data.schoolYear} - ${data.gradeLevel}`} />
                            <DataRow label="Type / Status" value={`${data.studentType} (${data.lrnStatus})`} />
                        </div>

                        <div>
                            <h4 className="text-slate-800 font-bold uppercase text-[10px] tracking-widest mb-4 border-b border-slate-200 pb-2">Student Profile</h4>
                            <div className="flex justify-center mb-6">
                                {data.studentPhotoUrl ? (
                                    <img src={data.studentPhotoUrl} alt="Student" className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-xl" />
                                ) : (
                                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-xs text-slate-400 border-4 border-white shadow-inner">No Photo</div>
                                )}
                            </div>
                            <DataRow label="Full Name" value={`${data.lastName}, ${data.firstName} ${data.middleName} ${data.extension}`} />
                            <DataRow label="LRN" value={data.lrn} />
                            <DataRow label="PSA Cert" value={data.psaCert} />
                            <DataRow label="Birth Details" value={`${data.dob} (${data.age} yrs) - ${data.sex}`} />
                            <DataRow label="Address" value={`${data.addressBarangay}, ${data.addressCity}`} />
                        </div>

                        <div>
                            <h4 className="text-slate-800 font-bold uppercase text-[10px] tracking-widest mb-4 border-b border-slate-200 pb-2">Contacts</h4>
                            <DataRow label="Parents" value={`F: ${data.fatherName} / M: ${data.motherName}`} />
                            <DataRow label="Contact Number" value={data.contactNumber1} />
                        </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-xs text-red-600 text-center leading-relaxed font-medium">
                        By clicking confirm, I hereby certify that the above information is true and correct.
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white flex gap-4">
                    <button onClick={onCancel} className="flex-1 py-4 rounded-xl font-bold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                        Back to Edit
                    </button>
                    <button onClick={onConfirm} disabled={loading} className="flex-1 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#800000] to-red-600 hover:to-red-500 shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95">
                        {loading ? <span className="animate-pulse">Processing...</span> : (isUpdateMode ? 'Update Now' : 'Submit Enrollment')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnrollmentForm;