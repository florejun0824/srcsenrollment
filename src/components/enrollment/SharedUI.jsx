import { memo } from 'react';

// --- ICONS ---
export const Icons = {
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
    copy: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
    pdf: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
};

// --- AURORA BACKGROUND ---
export const AuroraBackground = memo(() => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-slate-50/60 to-emerald-50/60" />
        <div 
            className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] opacity-[0.3]" 
            style={{
                mixBlendMode: 'multiply',
                filter: 'blur(90px)',
                background: `conic-gradient(from 180deg at 50% 50%, 
                    #0ea5e9 0deg, #10b981 80deg, #3b82f6 140deg, 
                    #2563eb 200deg, #881337 280deg, #0ea5e9 360deg)`
            }}
        />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
    </div>
));

// --- INPUT GROUP ---
export const InputGroup = memo(({ label, name, value, onChange, type = "text", required = false, placeholder = "", width = "col-span-1", disabled = false, pattern, errorMessage }) => (
    <div className={`flex flex-col ${width} group relative`}>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 group-focus-within:text-red-600 transition-colors">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                required={required && !disabled}
                disabled={disabled}
                placeholder={placeholder}
                pattern={pattern}
                className={`w-full bg-white/60 backdrop-blur-sm border border-slate-200 text-slate-900 text-sm font-semibold rounded-xl px-4 py-3.5
                focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 focus:shadow-lg focus:shadow-red-500/5
                hover:border-slate-300 transition-all duration-200 outline-none shadow-sm
                placeholder:text-slate-400 placeholder:text-[11px] placeholder:uppercase placeholder:font-bold placeholder:tracking-wide
                invalid:border-red-300 invalid:text-red-600
                disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100`}
            />
        </div>
        {errorMessage && (
            <span className="hidden peer-invalid:block text-[10px] text-red-500 mt-1 ml-1 font-medium">{errorMessage}</span>
        )}
    </div>
));

// --- RADIO BUTTON ---
export const RadioButton = memo(({ name, value, label, checked, onChange }) => (
    <label className={`relative flex items-center justify-center p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex-1 active:scale-95 select-none
        ${checked 
            ? 'border-red-500 bg-red-50 text-red-700 shadow-md shadow-red-100' 
            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50' 
        }`}>
        <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        {checked && (
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
        )}
    </label>
));

// --- SECTION HEADER ---
export const SectionHeader = memo(({ title, icon }) => (
    <div className="flex items-center gap-4 mb-6 pt-8 border-t border-slate-100 first:border-0 first:pt-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-[#800000] flex items-center justify-center text-white shadow-lg shadow-red-200/50 border border-white/20">
            {icon}
        </div>
        <div className="flex flex-col">
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight leading-none">{title}</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Required Information</span>
        </div>
    </div>
));