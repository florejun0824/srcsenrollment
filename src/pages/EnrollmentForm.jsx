// src/pages/EnrollmentForm.jsx
import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// --- MODERN UI COMPONENTS ---

const InputGroup = ({ label, name, value, onChange, type="text", required=false, placeholder="", width="col-span-1", disabled=false }) => (
  <div className={`flex flex-col ${width}`}>
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
      {label} {required && <span className="text-red-600">*</span>}
    </label>
    <input 
      type={type} 
      name={name} 
      value={value} 
      onChange={onChange} 
      required={required && !disabled} 
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] focus:bg-white block p-3 transition-all duration-200 outline-none ${disabled ? 'bg-gray-200 cursor-not-allowed opacity-60 text-gray-400' : ''}`}
    />
  </div>
);

const SectionHeader = ({ title, icon }) => (
  <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-6 mt-2">
    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[#800000] text-lg">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">{title}</h3>
  </div>
);

const RadioButton = ({ name, value, label, checked, onChange }) => (
  <label className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border transition-all duration-200 ${checked ? 'border-[#800000] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${checked ? 'border-[#800000]' : 'border-gray-400'}`}>
      {checked && <div className="w-2.5 h-2.5 rounded-full bg-[#800000]" />}
    </div>
    <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="hidden" />
    <span className={`text-sm font-bold uppercase ${checked ? 'text-[#800000]' : 'text-gray-600'}`}>{label}</span>
  </label>
);

const EnrollmentForm = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // --- CONFIGURATION ---
  const currentYear = new Date().getFullYear(); // 2025
  const schoolYearOptions = Array.from({ length: 10 }, (_, i) => {
    const start = currentYear + 1 + i; // Adds 1 to start at 2026
    return `${start}-${start + 1}`;
  });

  // --- STATE MANAGEMENT ---
  const [data, setData] = useState({
    // Header Data
    schoolYear: schoolYearOptions[0], 
    gradeLevel: '', 
    lrnStatus: 'No LRN', 
    
    // Student Information
    psaCert: '', lrn: '', 
    lastName: '', firstName: '', middleName: '', extension: '',
    dob: '', sex: 'Male', age: '', motherTongue: '',
    
    // IP Community
    isIP: false, 
    ipCommunity: '',

    // Address
    addressStreet: '', addressBarangay: '', addressCity: '', addressProvince: '', addressZip: '',

    // Parent/Guardian
    fatherName: '', motherName: '', guardianName: '', 
    contactNumber1: '', contactNumber2: '',
    
    // Signatory Selection
    signatory: 'Father',

    // Returning / Transferee
    lastGradeLevel: '', lastSchoolYear: '', lastSchoolName: '', lastSchoolID: '', lastSchoolAddress: '',

    // SHS Details
    semester: '', track: '', strand: ''
  });

  // --- LOGIC: TRACK & STRAND DISABLING ---
  const startYear = parseInt(data.schoolYear.split('-')[0]); // Extract 2026 from "2026-2027"
  const isG11 = data.gradeLevel === 'Grade 11 (SHS)';
  const isG12 = data.gradeLevel === 'Grade 12 (SHS)';

  let isTrackDisabled = false;

  // Rule 1: SY 2026-2027
  if (startYear === 2026) {
     if (isG11) isTrackDisabled = true; // Disabled for G11
     if (isG12) isTrackDisabled = false; // Enabled for G12
  } 
  // Rule 2: SY 2027 Onwards
  else if (startYear >= 2027) {
     isTrackDisabled = true; // Disabled for EVERYONE
  }

  // Strand Visibility: Show only if Track is enabled AND it's Grade 12 (as per previous specific add request)
  // or generally enabled if not restricted.
  // Based on your specific "add it if Grade 12 2026" rule:
  const showStrand = !isTrackDisabled && isG12 && startYear === 2026;

  // Auto-clear data if disabled
  useEffect(() => {
    if (isTrackDisabled) {
      setData(prev => ({ ...prev, track: '', strand: '' }));
    }
    // Also clear strand if hidden
    if (!showStrand && data.strand !== '') {
      setData(prev => ({ ...prev, strand: '' }));
    }
  }, [isTrackDisabled, showStrand, data.strand]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    if (name === 'isIP') {
        setData(prev => ({ ...prev, isIP: value === 'true', ipCommunity: value === 'false' ? '' : prev.ipCommunity }));
    } else {
        setData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "enrollments"), { ...data, createdAt: new Date() });
      setSubmitted(true);
      window.scrollTo(0,0);
    } catch (error) {
      console.error(error);
      alert("Error submitting form. Please check your connection.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border-t-8 border-[#800000]">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">✓</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-3">Enrollment Successful!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">The student data has been officially recorded in the system.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-[#800000] text-white font-bold py-4 rounded-xl hover:bg-[#600000] transition-colors shadow-lg"
          >
            Enroll Another Student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* HEADER */}
        <div className="bg-[#800000] py-10 px-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#FFD700] rounded-full -translate-x-10 -translate-y-10 opacity-20"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#FFD700] rounded-full translate-x-10 translate-y-10 opacity-20"></div>
          <div className="relative z-10 flex flex-col items-center">
            <img src="/logo.png" alt="San Ramon Logo" className="w-24 h-24 mb-4 drop-shadow-lg object-contain" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">SAN RAMON CATHOLIC SCHOOL</h1>
            <p className="text-[#FFD700] mt-2 font-bold uppercase tracking-widest text-sm">Official Enrollment System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-12">

          {/* 1. ENROLLMENT STATUS & GRADE LEVEL */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">School Year</label>
                <div className="relative">
                  <select name="schoolYear" value={data.schoolYear} onChange={handleChange} className="w-full font-bold text-gray-800 bg-gray-50 border border-gray-200 rounded-lg p-3.5 focus:ring-2 focus:ring-[#800000] outline-none appearance-none">
                    {schoolYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">▼</div>
                </div>
              </div>

              <div className="col-span-1">
                 <label className="text-xs font-bold text-[#800000] uppercase tracking-wider mb-2 block">Grade Level to Enroll</label>
                 <div className="relative">
                   <select name="gradeLevel" value={data.gradeLevel} onChange={handleChange} required className="w-full font-bold text-gray-800 bg-white border border-[#FFD700] rounded-lg p-3.5 focus:ring-2 focus:ring-[#800000] outline-none appearance-none">
                      <option value="">-- Select Grade --</option>
                      <option value="Kinder">Kinder</option>
                      {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].map(g => (<option key={g} value={g}>{g}</option>))}
                      <option value="Grade 11 (SHS)">Grade 11 (SHS)</option>
                      <option value="Grade 12 (SHS)">Grade 12 (SHS)</option>
                   </select>
                   <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">▼</div>
                 </div>
              </div>

              <div className="col-span-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Student Status</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['No LRN', 'With LRN', 'Returning'].map((status) => (
                    <div key={status} onClick={() => setData({...data, lrnStatus: status})} 
                      className={`cursor-pointer text-center py-3 px-2 rounded-lg border text-xs font-bold uppercase transition-all
                      ${data.lrnStatus === status ? 'bg-[#800000] text-white border-[#800000]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      {status}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. STUDENT INFO */}
          <section>
            <SectionHeader title="Student Information" icon="👤" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <InputGroup label="PSA Birth Certificate No." name="psaCert" value={data.psaCert} onChange={handleChange} width="md:col-span-2" />
              <InputGroup label="Learner Reference No. (LRN)" name="lrn" value={data.lrn} onChange={handleChange} width="md:col-span-2" />
              <InputGroup label="Last Name" name="lastName" value={data.lastName} onChange={handleChange} required />
              <InputGroup label="First Name" name="firstName" value={data.firstName} onChange={handleChange} required />
              <InputGroup label="Middle Name" name="middleName" value={data.middleName} onChange={handleChange} />
              <InputGroup label="Extension (Jr.)" name="extension" value={data.extension} onChange={handleChange} />
              <InputGroup label="Date of Birth" name="dob" type="date" value={data.dob} onChange={handleChange} required width="md:col-span-1" />
              
              <div className="md:col-span-1">
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1 block">Sex</label>
                 <div className="flex gap-3">
                    <RadioButton name="sex" value="Male" label="Male" checked={data.sex === 'Male'} onChange={handleChange} />
                    <RadioButton name="sex" value="Female" label="Female" checked={data.sex === 'Female'} onChange={handleChange} />
                 </div>
              </div>
              <InputGroup label="Age" name="age" type="number" value={data.age} onChange={handleChange} width="md:col-span-1" />
              <InputGroup label="Mother Tongue" name="motherTongue" value={data.motherTongue} onChange={handleChange} width="md:col-span-1" />
            
              <div className="md:col-span-4 bg-gray-50 rounded-xl p-6 border border-gray-200 mt-2">
                 <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <span className="text-sm font-bold text-gray-700 uppercase">Belonging to any Indigenous People (IP) Community?</span>
                    <div className="flex gap-4">
                       <RadioButton name="isIP" value="false" label="No" checked={data.isIP === false} onChange={handleChange} />
                       <RadioButton name="isIP" value="true" label="Yes" checked={data.isIP === true} onChange={handleChange} />
                    </div>
                    {data.isIP && (
                      <input type="text" placeholder="Please specify community" value={data.ipCommunity}
                        onChange={(e) => setData({...data, ipCommunity: e.target.value})}
                        className="flex-1 border-b-2 border-gray-300 bg-transparent outline-none px-2 py-1 text-sm focus:border-[#800000] transition-colors"
                      />
                    )}
                 </div>
              </div>
            </div>
          </section>

          {/* 3. ADDRESS */}
          <section>
            <SectionHeader title="Home Address" icon="🏠" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <InputGroup label="House # / Street" name="addressStreet" value={data.addressStreet} onChange={handleChange} />
               <InputGroup label="Barangay" name="addressBarangay" value={data.addressBarangay} onChange={handleChange} />
               <InputGroup label="City / Municipality" name="addressCity" value={data.addressCity} onChange={handleChange} />
               <InputGroup label="Province" name="addressProvince" value={data.addressProvince} onChange={handleChange} />
               <InputGroup label="Zip Code" name="addressZip" value={data.addressZip} onChange={handleChange} type="number" />
            </div>
          </section>

          {/* 4. PARENTS */}
          <section>
            <SectionHeader title="Parent / Guardian Details" icon="👨‍👩‍👦" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Father's Full Name" name="fatherName" value={data.fatherName} onChange={handleChange} placeholder="Last, First, Middle" />
              <InputGroup label="Mother's Maiden Name" name="motherName" value={data.motherName} onChange={handleChange} placeholder="Last, First, Middle" />
              <InputGroup label="Guardian's Name" name="guardianName" value={data.guardianName} onChange={handleChange} placeholder="Last, First, Middle" />
              
              <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Contact No. 1" name="contactNumber1" value={data.contactNumber1} onChange={handleChange} type="tel" required />
                 <InputGroup label="Contact No. 2" name="contactNumber2" value={data.contactNumber2} onChange={handleChange} type="tel" />
              </div>
            </div>
          </section>

          {/* 5. BALIK-ARAL */}
          <section className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
               <span className="text-blue-800 text-xl">🔄</span>
               <h3 className="text-lg font-bold text-blue-900 uppercase tracking-tight">For Returning Learners (Balik-Aral) & Transferees</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <InputGroup label="Last Grade Level Completed" name="lastGradeLevel" value={data.lastGradeLevel} onChange={handleChange} />
              <InputGroup label="Last School Year Completed" name="lastSchoolYear" value={data.lastSchoolYear} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputGroup label="Last School Name" name="lastSchoolName" value={data.lastSchoolName} onChange={handleChange} />
              <InputGroup label="School ID" name="lastSchoolID" value={data.lastSchoolID} onChange={handleChange} />
              <InputGroup label="School Address" name="lastSchoolAddress" value={data.lastSchoolAddress} onChange={handleChange} />
            </div>
          </section>

          {/* 6. SHS DETAILS (CONDITIONAL) */}
          {data.gradeLevel.includes('SHS') && (
            <div className="bg-[#FFF8E1] rounded-2xl p-8 border border-[#FFD700] relative overflow-hidden transition-all duration-500 animate-fade-in-down">
                <div className="absolute top-0 right-0 text-[#FFECB3] text-9xl font-bold -mt-10 -mr-10 select-none opacity-50">SHS</div>
                <SectionHeader title="Senior High School Details" icon="🎓" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div className="col-span-1">
                        <label className="text-xs font-bold text-[#800000] uppercase tracking-wider mb-2 block">Semester</label>
                        <div className="flex gap-3">
                            <RadioButton name="semester" value="1st Semester" label="1st Sem" checked={data.semester === '1st Semester'} onChange={handleChange} />
                            <RadioButton name="semester" value="2nd Semester" label="2nd Sem" checked={data.semester === '2nd Semester'} onChange={handleChange} />
                        </div>
                    </div>
                    
                    {/* TRACK & STRAND INPUTS */}
                    <div className="col-span-1 space-y-4">
                        <InputGroup 
                          label="Track" 
                          name="track" 
                          value={data.track} 
                          onChange={handleChange} 
                          placeholder="e.g. Academic" 
                          disabled={isTrackDisabled}
                        />
                        
                        {/* Strand only shows if Track is enabled (and matches criteria) */}
                        {showStrand && (
                          <div className="animate-fade-in-down">
                            <InputGroup 
                              label="Strand" 
                              name="strand" 
                              value={data.strand} 
                              onChange={handleChange} 
                              placeholder="e.g. STEM" 
                            />
                          </div>
                        )}
                    </div>
                </div>
            </div>
          )}
          
          {/* SIGNATORY SELECTION & SUBMIT */}
          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
             <div className="mb-6">
                <label className="text-xs font-bold text-[#800000] uppercase tracking-wider mb-3 block">
                    Whose name should appear on the printed form as Parent/Guardian?
                </label>
                <div className="flex flex-wrap gap-6">
                    <RadioButton name="signatory" value="Father" label="Father" checked={data.signatory === 'Father'} onChange={handleChange} />
                    <RadioButton name="signatory" value="Mother" label="Mother" checked={data.signatory === 'Mother'} onChange={handleChange} />
                    <RadioButton name="signatory" value="Guardian" label="Guardian" checked={data.signatory === 'Guardian'} onChange={handleChange} />
                </div>
             </div>
             
             <button type="submit" disabled={loading} className={`w-full py-4 px-6 rounded-xl font-black text-lg text-white shadow-xl transform transition-all duration-200 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#800000] hover:bg-[#600000] hover:-translate-y-1 hover:shadow-2xl active:scale-[0.99]'}`}>
               {loading ? 'PROCESSING...' : 'SUBMIT OFFICIAL ENROLLMENT'}
             </button>
             <p className="text-center text-gray-400 text-xs mt-6 px-4">
               By clicking submit, I certify that the information above is true and correct to the best of my knowledge and consent to the Data Privacy Act of 2012.
             </p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EnrollmentForm;