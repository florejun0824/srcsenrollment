// src/components/SubsidyNotice.jsx
import React, { memo } from 'react';

const SubsidyNotice = memo(({ gradeLevel }) => {
    // Only show for JHS (Grades 7-10) as per your requirement
    const isJHS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(gradeLevel);

    if (!isJHS) return null;

    return (
        <div className="col-span-1 md:col-span-4 bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex gap-4 mt-4 animate-fade-in">
            <div className="shrink-0 text-blue-500 mt-1">
                 {/* Simple Info Icon */}
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div>
                <h4 className="text-sm font-bold text-blue-900 uppercase tracking-tight mb-1">
                    Government Subsidy Notice (ESC / Voucher)
                </h4>
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    Eligibility for the ESC Grant or Voucher Program is <strong>First-Come, First-Served</strong> (approx. 150 slots available). 
                    <br/><br/>
                    Please note that this pre-enrollment does <strong>not</strong> guarantee a slot. Parents must submit the required documents to the Registrar during orientation to qualify. 
                    The subsidy will only be deducted from your account once officially approved/enrolled.
                </p>
            </div>
        </div>
    );
});

SubsidyNotice.displayName = 'SubsidyNotice';

export default SubsidyNotice;