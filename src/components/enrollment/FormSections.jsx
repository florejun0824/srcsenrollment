import { useState, memo } from 'react';
import { Icons, InputGroup, RadioButton, SectionHeader } from './SharedUI';
import FileUploadGroup from './FileUploadGroup';

// ==========================================
// 1. Enrollment Settings
// ==========================================
export const EnrollmentSettings = memo(({ data, handleChange, schoolYearOptions, ageRule, ageError }) => {
    // Determine grade level for showing info
    const isJHS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(data.gradeLevel);
    const isSHS = ['Grade 11 (SHS)', 'Grade 12 (SHS)'].includes(data.gradeLevel);

    return (
        <div className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight mb-6 md:mb-8 border-l-4 border-red-600 pl-4">Enrollment Details</h2>
            
            <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 border border-white shadow-sm ring-1 ring-slate-900/5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                    <div className="col-span-1">
                        <label className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">School Year</label>
                        <div className="relative group">
                            <select name="schoolYear" value={data.schoolYear} onChange={handleChange} className="w-full font-bold text-slate-700 text-sm bg-white border border-slate-200 rounded-xl px-4 py-3.5 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none appearance-none cursor-pointer transition-all shadow-sm hover:border-slate-300">
                                {schoolYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400 text-xs">▼</div>
                        </div>
                    </div>

                    <div className="col-span-1 lg:col-span-1">
                        <label className="text-[10px] md:text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-1.5 block ml-1">Grade Level</label>
                        <div className="relative group">
                            <select name="gradeLevel" value={data.gradeLevel} onChange={handleChange} required className="w-full font-bold text-slate-700 text-sm bg-amber-50/50 border border-amber-200 rounded-xl px-4 py-3.5 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none appearance-none shadow-sm cursor-pointer transition-all">
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
                        {ageRule && !ageError && <div className="mt-2 text-[10px] text-amber-700 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center gap-2"><span>💡</span> {ageRule}</div>}
                        {ageError && <div className="mt-2 text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2 animate-pulse"><span>🚫</span> Requirement not met</div>}
                    </div>

                    <div className="col-span-1">
                        <label className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">Student Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['New', 'Old', 'Transferee', 'Returning'].map((type) => (
                                <RadioButton key={type} name="studentType" value={type} label={type} checked={data.studentType === type} onChange={handleChange} />
                            ))}
                        </div>
                    </div>

                    <div className="col-span-1">
                        <label className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">LRN Status</label>
                        <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 h-[52px] items-center shadow-inner">
                            {['With LRN', 'No LRN'].map((status) => (
                                <label key={status} className={`flex-1 h-full flex items-center justify-center cursor-pointer text-center text-[10px] font-bold uppercase rounded-lg transition-all 
                                    ${data.lrnStatus === status 
                                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200 ring-1 ring-black/5' 
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}`}>
                                    <input type="radio" name="lrnStatus" value={status} checked={data.lrnStatus === status} onChange={handleChange} className="hidden" />
                                    {status}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* --- INFORMATIONAL NOTICE FOR GRANTS/VOUCHERS --- */}
                    {(isJHS || isSHS) && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
                            <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-100 rounded-full -mr-6 -mt-6 opacity-50 pointer-events-none"></div>
                                <div className="text-indigo-600 mt-0.5 shrink-0 relative z-10">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div className="relative z-10">
                                    <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-wide mb-1 flex items-center gap-2">
                                        {isJHS ? 'ESC Grant Availability' : 'Senior High School Voucher'}
                                        {isJHS && (
                                             <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] rounded border border-red-200">
                                                Limited Slots
                                             </span>
                                        )}
                                    </h4>
                                    <p className="text-[10px] md:text-[11px] text-indigo-700 leading-relaxed font-medium">
                                        Eligible students may apply for the {isJHS ? 'ESC Grant' : 'SHS Voucher'} upon submission of requirements to the Registrar.
                                        Assessment of eligibility will be done by the school administration.
                                    </p>
                                    
                                    {isJHS && (
                                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-indigo-100 shadow-sm">
                                            <span className="relative flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                                150 Slots Available (First-come, First-served)
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
});

// ==========================================
// 2. Student Profile
// ==========================================
export const StudentProfile = memo(({ data, handleChange, onPhotoUpload, onPhotoRemove, onPsaUpload, onPsaRemove, setModal }) => {
    const [showPage2, setShowPage2] = useState(false);

    return (
        <div className="mb-10">
            <SectionHeader title="Student Profile" icon={Icons.user} />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
                
                {/* --- DOCUMENTS UPLOAD SECTION --- */}
                <div className="md:col-span-4 bg-slate-50/50 rounded-2xl p-5 md:p-6 border border-slate-200 mb-2 shadow-sm">
                    <h4 className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                        {Icons.upload} Documents (Optional)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FileUploadGroup 
                            label="Student 2x2 ID Photo" 
                            onUploadComplete={onPhotoUpload} 
                            onRemove={onPhotoRemove}
                            required={false} 
                            existingUrl={data.studentPhotoUrl}
                            setModal={setModal}
                        />
                        
                        <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-1">
                            <FileUploadGroup 
                                label="Scanned PSA Birth Certificate (Page 1)" 
                                onUploadComplete={(url) => onPsaUpload(url, 1)} 
                                onRemove={() => onPsaRemove(1)}
                                existingUrl={data.psaScanUrl} 
                                setModal={setModal}
                            />

                            {data.psaScanUrl2 || showPage2 ? (
                                <div className="animate-fade-in-down">
                                    <FileUploadGroup 
                                        label="Scanned PSA Birth Certificate (Page 2)" 
                                        onUploadComplete={(url) => onPsaUpload(url, 2)} 
                                        onRemove={() => { onPsaRemove(2); setShowPage2(false); }}
                                        existingUrl={data.psaScanUrl2} 
                                        setModal={setModal}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <button 
                                        type="button"
                                        onClick={() => setShowPage2(true)}
                                        className="text-[10px] font-bold text-slate-500 flex items-center gap-2 hover:text-red-600 transition-all bg-white px-4 py-3 rounded-xl border border-dashed border-slate-300 hover:border-red-400 shadow-sm w-full justify-center group"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-red-50 flex items-center justify-center text-slate-400 group-hover:text-red-500 transition-colors">
                                            {Icons.plus}
                                        </div>
                                        Add Page 2 (Back Page)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="md:col-span-4 h-px bg-slate-100 my-2" />

                <InputGroup label="PSA Birth Certificate No." name="psaCert" value={data.psaCert} onChange={handleChange} width="md:col-span-2" />
                <InputGroup label="Learner Reference No. (LRN)" name="lrn" value={data.lrn} onChange={handleChange} width="md:col-span-2" placeholder="12-digit number" />
                
                <InputGroup label="Last Name" name="lastName" value={data.lastName} onChange={handleChange} required width="md:col-span-1" />
                <InputGroup label="First Name" name="firstName" value={data.firstName} onChange={handleChange} required width="md:col-span-1" />
                <InputGroup label="Middle Name" name="middleName" value={data.middleName} onChange={handleChange} width="md:col-span-1" />
                <InputGroup label="Extension (Jr/II)" name="extension" value={data.extension} onChange={handleChange} width="md:col-span-1" />
                
                <InputGroup label="Date of Birth" name="dob" type="date" value={data.dob} onChange={handleChange} required width="md:col-span-1" />
                
                <div className="md:col-span-1">
                    <label className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block">Sex</label>
                    <div className="flex gap-2">
                        <RadioButton name="sex" value="Male" label="Male" checked={data.sex === 'Male'} onChange={handleChange} />
                        <RadioButton name="sex" value="Female" label="Female" checked={data.sex === 'Female'} onChange={handleChange} />
                    </div>
                </div>
                
                <InputGroup label="Age" name="age" type="number" value={data.age} onChange={handleChange} width="md:col-span-1" />
                <InputGroup label="Mother Tongue" name="motherTongue" value={data.motherTongue} onChange={handleChange} width="md:col-span-1" />
                
                <div className="md:col-span-4 bg-slate-50/50 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 shadow-sm mt-2">
                    <div className="flex-shrink-0">
                        <span className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase tracking-widest">Belong to Indigenous People (IP)?</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <label className="flex items-center gap-2 cursor-pointer group select-none py-1">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${!data.isIP ? 'border-red-500 bg-white ring-2 ring-red-100' : 'border-slate-300 bg-white'}`}>
                                {!data.isIP && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                            </div>
                            <input type="radio" name="isIP" value="false" checked={!data.isIP} onChange={handleChange} className="hidden" />
                            <span className={`text-xs font-bold uppercase ${!data.isIP ? 'text-slate-800' : 'text-slate-500'}`}>No</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group select-none py-1">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${data.isIP ? 'border-red-500 bg-white ring-2 ring-red-100' : 'border-slate-300 bg-white'}`}>
                                {data.isIP && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                            </div>
                            <input type="radio" name="isIP" value="true" checked={data.isIP} onChange={handleChange} className="hidden" />
                            <span className={`text-xs font-bold uppercase ${data.isIP ? 'text-slate-800' : 'text-slate-500'}`}>Yes</span>
                        </label>
                    </div>
                    {data.isIP && (
                        <input 
                            type="text" 
                            placeholder="SPECIFY COMMUNITY" 
                            value={data.ipCommunity} 
                            onChange={(e) => handleChange({ target: { name: 'ipCommunity', value: e.target.value }})}
                            className="w-full md:w-auto flex-1 bg-transparent border-b-2 border-slate-300 focus:border-red-500 outline-none px-2 py-1 text-sm font-bold text-red-600 uppercase placeholder:text-slate-400 animate-fade-in transition-colors" 
                        />
                    )}
                </div>
            </div>
        </div>
    );
});

// ==========================================
// 3. Address Info
// ==========================================
export const AddressInfo = memo(({ data, handleChange }) => (
    <div className="mb-10">
        <SectionHeader title="Home Address" icon={Icons.home} />
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5">
            <InputGroup label="House # / Street / Sitio" name="addressStreet" value={data.addressStreet} onChange={handleChange} width="md:col-span-2" />
            <InputGroup label="Barangay" name="addressBarangay" value={data.addressBarangay} onChange={handleChange} width="md:col-span-2" />
            <InputGroup label="City / Municipality" name="addressCity" value={data.addressCity} onChange={handleChange} width="md:col-span-2" />
            <InputGroup label="Province" name="addressProvince" value={data.addressProvince} onChange={handleChange} width="md:col-span-3" />
            <InputGroup label="Zip Code" name="addressZip" value={data.addressZip} onChange={handleChange} type="number" width="md:col-span-3" />
        </div>
    </div>
));

// ==========================================
// 4. Parent Info
// ==========================================
export const ParentInfo = memo(({ data, handleChange }) => (
    <div className="mb-10">
        <SectionHeader title="Parent / Guardian" icon={Icons.family} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
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
                    pattern="^09\d{9}$" 
                />
                <InputGroup label="Mobile No. 2" name="contactNumber2" value={data.contactNumber2} onChange={handleChange} type="tel" placeholder="Optional" />
            </div>
        </div>
    </div>
));

// ==========================================
// 5. Previous School Info
// ==========================================
export const PreviousSchoolInfo = memo(({ data, handleChange, show }) => {
    if (!show) return null;
    return (
        <div className="bg-blue-50/60 rounded-2xl p-6 md:p-8 border border-blue-100 mb-10 animate-fade-in-up shadow-sm">
            <SectionHeader title="Previous School" icon={Icons.school} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-6">
                <InputGroup label="Last School Attended" name="lastSchoolName" value={data.lastSchoolName} onChange={handleChange} required />
                <InputGroup label="School Address" name="lastSchoolAddress" value={data.lastSchoolAddress} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 pt-6 border-t border-blue-200/50">
                <InputGroup label="Last Grade Level" name="lastGradeLevel" value={data.lastGradeLevel} onChange={handleChange} />
                <InputGroup label="Last School Year" name="lastSchoolYear" value={data.lastSchoolYear} onChange={handleChange} />
                <InputGroup label="School ID (If Known)" name="lastSchoolID" value={data.lastSchoolID || ''} onChange={handleChange} />
            </div>
        </div>
    );
});

// ==========================================
// 6. SHS Details
// ==========================================
export const SHSDetails = memo(({ data, handleChange, isTrackDisabled, showStrand }) => {
    if (!data.gradeLevel.includes('SHS')) return null;
    return (
        <div className="bg-amber-50/80 rounded-2xl p-6 md:p-8 border border-amber-200 relative overflow-hidden mb-8 animate-fade-in shadow-md shadow-amber-100/50">
             {/* Decorative Background Text */}
             <div className="absolute top-0 right-0 text-amber-500/10 text-[6rem] md:text-[10rem] font-black -mt-4 md:-mt-8 -mr-4 md:-mr-8 select-none pointer-events-none z-0">SHS</div>
             
             <div className="relative z-10">
                <h3 className="text-lg md:text-xl font-black text-amber-700 uppercase tracking-tight mb-8 flex items-center gap-3">
                    <span className="text-2xl md:text-3xl">🎓</span> Senior High School Track
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <div>
                        <label className="text-[10px] md:text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-3 block">Semester</label>
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