// src/pages/EnrollmentForm.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

// ==========================================
// 1. ENHANCED ICONS (SVG)
// ==========================================
const Icons = {
    user: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    home: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    family: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    school: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    ),
    check: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
    alert: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
    ),
    upload: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
    ),
    trash: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
    eye: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
    plus: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
    )
};

// ==========================================
// 2. REUSABLE UI COMPONENTS
// ==========================================

const InputGroup = ({ label, name, value, onChange, type = "text", required = false, placeholder = "", width = "col-span-1", disabled = false }) => (
    <div className={`flex flex-col ${width} group relative`}>
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1 group-focus-within:text-[#800000] transition-colors">
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
            className={`w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-xl px-4 py-3.5 
            focus:ring-2 focus:ring-[#800000]/10 focus:border-[#800000] 
            hover:border-gray-300 transition-all duration-200 outline-none shadow-sm 
            placeholder:text-gray-300 placeholder:text-xs placeholder:uppercase
            ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60 text-gray-500' : ''}`}
        />
    </div>
);

const RadioButton = ({ name, value, label, checked, onChange }) => (
    <label className={`relative flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all duration-200 flex-1 
        ${checked 
            ? 'border-[#800000] bg-red-50/50 text-[#800000] shadow-md shadow-red-100 ring-1 ring-[#800000]' 
            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
        }`}>
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        {checked && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-[#800000] rounded-full animate-ping" />
        )}
    </label>
);

const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-[#800000] shadow-sm border border-red-100">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">{title}</h3>
    </div>
);

// --- FILE UPLOAD COMPONENT (With Remove & Preview) ---
const FileUploadGroup = ({ label, onUploadComplete, onRemove, required = false, existingUrl }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(existingUrl || null);

    // Sync preview state if the parent passes a new URL (e.g. from existing DB record)
    useEffect(() => {
        setPreview(existingUrl);
    }, [existingUrl]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic Validation: Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert("File is too large! Please upload a file smaller than 5MB.");
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        
        // --- ENV VARIABLES ---
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
            onRemove(); // Trigger parent handler to clear state
        }
    };

    return (
        <div className="flex flex-col md:col-span-2 group">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className={`relative flex items-center gap-4 p-3 rounded-xl border border-dashed transition-all duration-300
                ${preview ? 'border-green-300 bg-green-50/30' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400'}`}>
                
                {!preview ? (
                    // --- UPLOAD STATE ---
                    <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-xs uppercase tracking-wide cursor-pointer transition-all shadow-sm
                        ${uploading 
                            ? 'bg-gray-200 text-gray-400 cursor-wait' 
                            : 'bg-white text-[#800000] border border-gray-200 hover:border-[#800000] hover:bg-[#800000] hover:text-white'
                        }`}>
                        {uploading ? (
                            <>
                                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>
                                Uploading...
                            </>
                        ) : (
                            <>
                                {Icons.upload} Choose File
                            </>
                        )}
                        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} disabled={uploading} className="hidden" />
                    </label>
                ) : (
                    // --- PREVIEW STATE ---
                    <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                {Icons.check}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-green-800 truncate">Uploaded Successfully</span>
                                <a href={preview} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-[#800000] hover:underline transition-colors">
                                    {Icons.eye} View
                                </a>
                            </div>
                        </div>
                        <button 
                            onClick={handleRemove} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            title="Remove File"
                        >
                            {Icons.trash}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ==========================================
// 3. SUB-COMPONENTS (Form Sections)
// ==========================================

const EnrollmentSettings = ({ data, handleChange, schoolYearOptions, ageRule, ageError }) => (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 p-6 md:p-8 border border-white">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-gray-300"></span> 
            Enrollment Configuration 
            <span className="flex-1 h-[1px] bg-gray-300"></span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">School Year</label>
                <div className="relative">
                    <select name="schoolYear" value={data.schoolYear} onChange={handleChange} className="w-full font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-xl p-3.5 focus:ring-2 focus:ring-[#800000]/10 focus:border-[#800000] outline-none appearance-none transition-shadow cursor-pointer">
                        {schoolYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
            </div>

            <div className="col-span-1 lg:col-span-1">
                <label className="text-[10px] font-bold text-[#800000] uppercase tracking-widest mb-2 block">Grade Level</label>
                <div className="relative">
                    <select name="gradeLevel" value={data.gradeLevel} onChange={handleChange} required className="w-full font-bold text-gray-800 bg-white border-2 border-[#FFD700] rounded-xl p-3.5 focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] outline-none appearance-none shadow-sm transition-all cursor-pointer">
                        <option value="">-- Select Level --</option>
                        <option value="Pre-Kindergarten 1">Pre-Kindergarten 1</option>
                        <option value="Pre-Kindergarten 2">Pre-Kindergarten 2</option>
                        <option value="Kinder">Kinder</option>
                        {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map(g => (<option key={g} value={g}>{g}</option>))}
                        <option value="Grade 11 (SHS)">Grade 11 (SHS)</option>
                        <option value="Grade 12 (SHS)">Grade 12 (SHS)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
                {ageRule && !ageError && <div className="mt-2 text-[10px] text-yellow-700 font-bold bg-yellow-50 p-2 rounded-lg border border-yellow-100 flex items-center gap-1"><span>💡</span> {ageRule}</div>}
                {ageError && <div className="mt-2 text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-1 animate-pulse"><span>🚫</span> Requirement not met</div>}
            </div>

            <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Student Type</label>
                <div className="grid grid-cols-2 gap-2">
                    {['New', 'Old', 'Transferee', 'Returning'].map((type) => (
                        <label key={type} className={`cursor-pointer text-center text-[10px] font-bold uppercase py-3 rounded-lg border transition-all 
                            ${data.studentType === type 
                                ? 'bg-[#800000] text-white border-[#800000] shadow-md shadow-red-200' 
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                            <input type="radio" name="studentType" value={type} checked={data.studentType === type} onChange={handleChange} className="hidden" />
                            {type}
                        </label>
                    ))}
                </div>
            </div>

            <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">LRN Status</label>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                    {['With LRN', 'No LRN'].map((status) => (
                        <label key={status} className={`flex-1 cursor-pointer text-center text-[10px] font-bold uppercase py-2.5 rounded-lg transition-all 
                            ${data.lrnStatus === status 
                                ? 'bg-white text-[#800000] shadow-sm ring-1 ring-gray-200' 
                                : 'text-gray-400 hover:text-gray-600'}`}>
                            <input type="radio" name="lrnStatus" value={status} checked={data.lrnStatus === status} onChange={handleChange} className="hidden" />
                            {status}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const StudentProfile = ({ data, handleChange, onPhotoUpload, onPhotoRemove, onPsaUpload, onPsaRemove }) => {
    // Local state to handle UI toggle for page 2
    const [showPage2, setShowPage2] = useState(false);

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 p-6 md:p-8 border border-white">
            <SectionHeader title="Student Profile" icon={Icons.user} />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* --- DOCUMENTS UPLOAD SECTION --- */}
                <div className="md:col-span-4 bg-gray-50/50 rounded-2xl p-6 border border-gray-100 mb-2">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        {Icons.upload} Required Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. ID Photo */}
                        <FileUploadGroup 
                            label="Student 2x2 ID Photo" 
                            onUploadComplete={onPhotoUpload} 
                            onRemove={onPhotoRemove}
                            required={true} 
                            existingUrl={data.studentPhotoUrl} 
                        />
                        
                        {/* 2. PSA Birth Certificate (Handles 2 Pages) */}
                        <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-1">
                            {/* Page 1 */}
                            <FileUploadGroup 
                                label="Scanned PSA Birth Certificate (Page 1)" 
                                onUploadComplete={(url) => onPsaUpload(url, 1)} 
                                onRemove={() => onPsaRemove(1)}
                                existingUrl={data.psaScanUrl} 
                            />

                            {/* Logic: Show Page 2 input if URL exists OR user clicked "Add Page 2" */}
                            {data.psaScanUrl2 || showPage2 ? (
                                <div className="animate-fade-in-down">
                                    <FileUploadGroup 
                                        label="Scanned PSA Birth Certificate (Page 2)" 
                                        onUploadComplete={(url) => onPsaUpload(url, 2)} 
                                        onRemove={() => {
                                            onPsaRemove(2);
                                            setShowPage2(false); // Hide field on remove if desired
                                        }}
                                        existingUrl={data.psaScanUrl2} 
                                    />
                                </div>
                            ) : (
                                // Add Page 2 Button
                                <div>
                                    <button 
                                        type="button"
                                        onClick={() => setShowPage2(true)}
                                        className="text-[10px] font-bold text-[#800000] flex items-center gap-1 hover:underline opacity-70 hover:opacity-100 transition-opacity bg-white px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200"
                                    >
                                        {Icons.plus} Add Page 2 (Back/Next Page)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- TEXT INPUTS --- */}
                <InputGroup label="PSA Birth Certificate No." name="psaCert" value={data.psaCert} onChange={handleChange} width="md:col-span-2" />
                <InputGroup label="Learner Reference No. (LRN)" name="lrn" value={data.lrn} onChange={handleChange} width="md:col-span-2" placeholder="12-digit number" />
                
                <InputGroup label="Last Name" name="lastName" value={data.lastName} onChange={handleChange} required width="md:col-span-1" />
                <InputGroup label="First Name" name="firstName" value={data.firstName} onChange={handleChange} required width="md:col-span-1" />
                <InputGroup label="Middle Name" name="middleName" value={data.middleName} onChange={handleChange} width="md:col-span-1" />
                <InputGroup label="Extension (Jr/II)" name="extension" value={data.extension} onChange={handleChange} width="md:col-span-1" />
                
                <InputGroup label="Date of Birth" name="dob" type="date" value={data.dob} onChange={handleChange} required width="md:col-span-1" />
                
                <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1 block">Sex</label>
                    <div className="flex gap-2 h-[46px]">
                        <RadioButton name="sex" value="Male" label="Male" checked={data.sex === 'Male'} onChange={handleChange} />
                        <RadioButton name="sex" value="Female" label="Female" checked={data.sex === 'Female'} onChange={handleChange} />
                    </div>
                </div>
                
                <InputGroup label="Age" name="age" type="number" value={data.age} onChange={handleChange} width="md:col-span-1" />
                <InputGroup label="Mother Tongue" name="motherTongue" value={data.motherTongue} onChange={handleChange} width="md:col-span-1" />
                
                <div className="md:col-span-4 bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-shrink-0">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Belong to Indigenous People (IP)?</span>
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${!data.isIP ? 'border-[#800000]' : 'border-gray-300'}`}>
                                {!data.isIP && <div className="w-2.5 h-2.5 bg-[#800000] rounded-full" />}
                            </div>
                            <input type="radio" name="isIP" value="false" checked={!data.isIP} onChange={handleChange} className="hidden" />
                            <span className={`text-xs font-bold uppercase ${!data.isIP ? 'text-gray-800' : 'text-gray-400'}`}>No</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${data.isIP ? 'border-[#800000]' : 'border-gray-300'}`}>
                                {data.isIP && <div className="w-2.5 h-2.5 bg-[#800000] rounded-full" />}
                            </div>
                            <input type="radio" name="isIP" value="true" checked={data.isIP} onChange={handleChange} className="hidden" />
                            <span className={`text-xs font-bold uppercase ${data.isIP ? 'text-gray-800' : 'text-gray-400'}`}>Yes</span>
                        </label>
                    </div>
                    {data.isIP && (
                        <input 
                            type="text" 
                            placeholder="SPECIFY COMMUNITY" 
                            value={data.ipCommunity} 
                            onChange={(e) => handleChange({ target: { name: 'ipCommunity', value: e.target.value }})}
                            className="flex-1 bg-transparent border-b-2 border-gray-300 focus:border-[#800000] outline-none px-2 py-1 text-sm font-bold text-[#800000] uppercase placeholder:text-gray-300 animate-fade-in" 
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

const AddressInfo = ({ data, handleChange }) => (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 p-6 md:p-8 border border-white">
        <SectionHeader title="Home Address" icon={Icons.home} />
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <InputGroup label="House # / Street / Sitio" name="addressStreet" value={data.addressStreet} onChange={handleChange} width="md:col-span-2" />
            <InputGroup label="Barangay" name="addressBarangay" value={data.addressBarangay} onChange={handleChange} width="md:col-span-2" />
            <InputGroup label="City / Municipality" name="addressCity" value={data.addressCity} onChange={handleChange} width="md:col-span-2" />
            <InputGroup label="Province" name="addressProvince" value={data.addressProvince} onChange={handleChange} width="md:col-span-3" />
            <InputGroup label="Zip Code" name="addressZip" value={data.addressZip} onChange={handleChange} type="number" width="md:col-span-3" />
        </div>
    </div>
);

const ParentInfo = ({ data, handleChange }) => (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 p-6 md:p-8 border border-white">
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
);

const PreviousSchoolInfo = ({ data, handleChange, show }) => {
    if (!show) return null;
    return (
        <div className="bg-gradient-to-br from-blue-50/80 to-white rounded-2xl shadow-xl shadow-blue-100/50 p-6 md:p-8 border border-blue-100 animate-fade-in">
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
    );
};

const SHSDetails = ({ data, handleChange, isTrackDisabled, showStrand }) => {
    if (!data.gradeLevel.includes('SHS')) return null;
    return (
        <div className="bg-[#FFF8E1] rounded-2xl p-6 md:p-8 border border-[#FFD700] relative overflow-hidden animate-fade-in shadow-xl shadow-yellow-100/50">
             <div className="absolute top-0 right-0 text-[#FFECB3] text-9xl font-black -mt-4 -mr-4 select-none opacity-40 pointer-events-none">SHS</div>
             <div className="relative z-10">
                <h3 className="text-lg font-bold text-[#800000] uppercase tracking-tight mb-6 flex items-center gap-2">
                    <span className="text-2xl">🎓</span> Senior High School Track
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="text-[10px] font-bold text-[#800000] uppercase tracking-widest mb-2 block">Semester</label>
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
    );
};

// ==========================================
// 4. MAIN COMPONENT
// ==========================================
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
        semester: '', track: '', strand: '',
        studentPhotoUrl: '', 
        psaScanUrl: '',
        psaScanUrl2: '' // NEW FIELD FOR 2ND PAGE
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

    // --- HANDLER WITH AUTO-CAPS FIX ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let finalValue = value;
        if (typeof value === 'string' && 
            type !== 'date' && 
            type !== 'password' && 
            type !== 'email' && 
            type !== 'radio' && 
            type !== 'select-one') {
            finalValue = value.toUpperCase();
        }

        if (name === 'isIP') {
            setData(prev => ({ ...prev, isIP: value === 'true', ipCommunity: value === 'false' ? '' : prev.ipCommunity }));
        } else {
            setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : finalValue }));
        }
    };

    // --- FILE HANDLERS (UPDATED) ---
    const handlePhotoUpload = (url) => setData(prev => ({ ...prev, studentPhotoUrl: url }));
    const handlePhotoRemove = () => setData(prev => ({ ...prev, studentPhotoUrl: '' }));

    const handlePsaUpload = (url, page = 1) => {
        if (page === 1) setData(prev => ({ ...prev, psaScanUrl: url }));
        else setData(prev => ({ ...prev, psaScanUrl2: url }));
    };

    const handlePsaRemove = (page = 1) => {
        if (page === 1) setData(prev => ({ ...prev, psaScanUrl: '' }));
        else setData(prev => ({ ...prev, psaScanUrl2: '' }));
    };

    const isFormValid = () => {
        if (ageError) return false;
        if (!data.gradeLevel || !data.lastName || !data.firstName || !data.dob || !data.fatherName || !data.motherName || !data.contactNumber1) return false;
        if (!data.studentPhotoUrl) return false; // Photo is required
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
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl text-center max-w-md w-full border border-gray-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-sm animate-bounce">
                        {Icons.check}
                    </div>
                    {/* MODIFIED HEADER */}
                    <h2 className="text-2xl font-extrabold text-gray-800 mb-3">{existingId ? 'Updated Successfully!' : 'Pre-Enrolled Successfully!'}</h2>
                    
                    {/* MODIFIED CONTENT */}
                    <div className="text-left text-sm text-gray-700 leading-relaxed space-y-4 mb-8">
                        <p>You have successfully <strong>pre-enrolled</strong> to the San Ramon Catholic School, Inc.</p> 
                        <p className="font-bold text-[#800000] bg-red-50 p-2 rounded-lg border border-red-100">
                           Please note that this is not the final phase yet. You will still have to visit the school in person to submit the following requirements during the enrollment day:
                        </p>
                        
                        <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                            <li>Scanned/Photocopy of Your Child(ren)'s Baptismal Certificate(s)</li>
                            <li>Scanned/Photocopy of Your Child(ren)'s PSA Birth Certificate(s)</li>
                            <li>Scanned/Photocopy of Your Child(ren)'s Report Card(s)</li>
                            <li>Scanned/Photocopy of Your Child(ren)'s Diploma(s)</li>
                            <li>Scanned/Photocopy of Your Child(ren)'s Certificate(s) of Good Moral Character</li>
                            <li>Scanned/Photocopy of Your Child(ren)'s Certificate(s) of Honor if applicable</li>
                        </ul>
                        
                        <p className="text-xs text-gray-500 italic">
                            Kindly visit the <strong>Guidance Office</strong> to claim your Pre-enrollment Form before submitting your requirements at the registrar's office.
                        </p>
                        
                        <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                            No payment is accepted during the Pre-Enrollment Process. Payments will be made during the Enrollment Day.
                        </p>
                    </div>

                    {/* MODIFIED: Link to /enrollment-landing */}
                    <Link to="/enrollment-landing" className="w-full block bg-[#800000] text-white font-bold py-4 rounded-xl hover:bg-[#600000] transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:-translate-y-1">
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
            <div className="bg-[#800000] pt-12 pb-24 px-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-20 -translate-y-20 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#FFD700]/10 rounded-full translate-x-20 translate-y-20 blur-3xl"></div>

                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between relative z-10 gap-6">
                    <div className="flex items-center gap-6">
                        <div className="bg-white p-2.5 rounded-2xl shadow-xl shadow-black/20 transform hover:scale-105 transition-transform duration-300">
                            <img src="/1.png" alt="Logo" className="w-16 h-16 object-contain" />
                        </div>
                        <div className="text-white">
                            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none drop-shadow-md">SAN RAMON</h1>
                            <p className="text-[#FFD700] font-bold uppercase tracking-widest text-xs md:text-sm mt-1 drop-shadow-sm">Catholic School, Inc.</p>
                        </div>
                    </div>
                    {/* MODIFIED: Link to /enrollment-landing */}
                    <Link to="/enrollment-landing" className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs font-bold uppercase tracking-wider hover:bg-white/20 transition-all flex items-center gap-2 group">
                         <span className="opacity-70 group-hover:-translate-x-1 transition-transform">←</span> Back to Menu
                    </Link>
                </div>
            </div>

            {/* FORM CONTAINER */}
            <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20">
                <form onSubmit={handleInitialSubmit} className="space-y-6">

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
                    <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-xl shadow-gray-200/50 mt-8 mb-8">
                        <div className="mb-8">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block text-center">Printed Parent/Guardian Name</label>
                            <div className="flex flex-wrap justify-center gap-4">
                                <RadioButton name="signatory" value="Father" label="Father" checked={data.signatory === 'Father'} onChange={handleChange} />
                                <RadioButton name="signatory" value="Mother" label="Mother" checked={data.signatory === 'Mother'} onChange={handleChange} />
                                <RadioButton name="signatory" value="Guardian" label="Guardian" checked={data.signatory === 'Guardian'} onChange={handleChange} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!isFormValid() || loading}
                            className={`w-full py-4 px-6 rounded-xl font-black text-lg text-white shadow-xl shadow-red-900/20 transform transition-all duration-300 flex items-center justify-center gap-3
                                ${!isFormValid() || loading
                                    ? 'bg-gray-300 cursor-not-allowed opacity-70 grayscale'
                                    : 'bg-[#800000] hover:bg-[#600000] hover:-translate-y-1 hover:shadow-2xl active:scale-[0.99]'
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
                            <div className="flex items-center justify-center gap-2 text-center text-red-500 font-bold text-xs mt-4 bg-red-50 py-3 rounded-xl animate-pulse">
                                {Icons.alert} <span>Please complete all required fields (marked with *) to proceed.</span>
                            </div>
                        )}
                        <p className="text-center text-gray-400 text-[10px] mt-6 px-4 uppercase tracking-wide">
                            San Ramon Catholic School Enrollment System
                        </p>
                    </div>

                </form>
            </div>
        </div>
    );
};

// --- MODALS ---
const DuplicateModal = ({ onRetrieve, onCancel, studentName }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center transform transition-all scale-100 border border-gray-100">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                {Icons.alert}
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Record Found!</h2>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                We found an existing student named <br/><strong className="text-gray-800 text-lg">{studentName}</strong>.
            </p>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 text-left mb-6">
                <strong>Wait!</strong> Do not create a duplicate. Click "Retrieve" to load the existing data and update it.
            </div>
            <div className="flex flex-col gap-3">
                <button onClick={onRetrieve} className="w-full py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5">
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
        <div className="flex flex-col sm:flex-row sm:justify-between border-b border-gray-50 py-3 last:border-0 hover:bg-gray-50/50 transition-colors px-2 rounded-lg">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 sm:mb-0">{label}</span>
            <span className="text-sm font-bold text-gray-800 text-right break-words">{value || <span className="text-gray-300 font-normal italic">N/A</span>}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
                {/* Modal Header */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#800000] text-white rounded-full flex items-center justify-center shadow-lg shadow-red-100">
                            {isUpdateMode ? '🔄' : '📋'}
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-gray-900">{isUpdateMode ? 'Update Record' : 'Confirm Enrollment'}</h2>
                            <p className="text-xs text-gray-500 font-medium">Please verify the details below.</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">✕</button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
                    <div className="space-y-6">
                        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
                            <h4 className="text-[#800000] font-bold uppercase text-[10px] tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#800000]"></span> Enrollment Details
                            </h4>
                            <DataRow label="SY / Grade" value={`${data.schoolYear} - ${data.gradeLevel}`} />
                            <DataRow label="Type / Status" value={`${data.studentType} (${data.lrnStatus})`} />
                        </div>

                        <div>
                            <h4 className="text-gray-900 font-bold uppercase text-[10px] tracking-widest mb-3 border-b border-gray-100 pb-2">Student Profile</h4>
                            <div className="flex justify-center mb-6">
                                {data.studentPhotoUrl ? (
                                    <img src={data.studentPhotoUrl} alt="Student" className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg ring-1 ring-gray-200" />
                                ) : (
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-400 border-4 border-white shadow-inner">No Photo</div>
                                )}
                            </div>
                            <DataRow label="Full Name" value={`${data.lastName}, ${data.firstName} ${data.middleName} ${data.extension}`} />
                            <DataRow label="LRN" value={data.lrn} />
                            <DataRow label="PSA Cert" value={data.psaCert} />
                            <DataRow label="Birth Details" value={`${data.dob} (${data.age} yrs) - ${data.sex}`} />
                            <DataRow label="Address" value={`${data.addressBarangay}, ${data.addressCity}`} />
                        </div>

                        <div>
                            <h4 className="text-gray-900 font-bold uppercase text-[10px] tracking-widest mb-3 border-b border-gray-100 pb-2">Contacts</h4>
                            <DataRow label="Parents" value={`F: ${data.fatherName} / M: ${data.motherName}`} />
                            <DataRow label="Contact Number" value={data.contactNumber1} />
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-xs text-yellow-800 text-center leading-relaxed font-medium">
                        By clicking confirm, I hereby certify that the above information is true and correct.
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                        Back to Edit
                    </button>
                    <button onClick={onConfirm} disabled={loading} className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#800000] hover:bg-[#600000] shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5">
                        {loading ? <span className="animate-pulse">Processing...</span> : (isUpdateMode ? 'Update Now' : 'Submit Enrollment')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnrollmentForm;