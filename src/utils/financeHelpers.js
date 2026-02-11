// src/utils/financeHelpers.js
import { calculateTotalFee } from './fees';

/**
 * Generates the initial Finance Account payload for Firestore.
 * * NOTE: By default, this calculates the FULL FEE (Standard Rate).
 * Subsidies (ESC/Vouchers) are applied by the Admin later to ensure 
 * slot availability and document verification.
 * * @param {Object} data - The raw form data from EnrollmentForm
 * @param {string} referenceNumber - The generated Ref # (e.g. SRCS-2026-XYZ)
 * @returns {Object} - The formatted finance object ready for DB insertion
 */
export const createFinancePayload = (data, referenceNumber) => {
    // 1. Calculate Full Fees (Affiliation set to 'None' for initial assessment)
    const feeDetails = calculateTotalFee(data.gradeLevel, 'None');

    return {
        // --- IDENTITY ---
        studentName: `${data.lastName}, ${data.firstName} ${data.middleName || ''}`.trim(),
        referenceNumber: referenceNumber,
        gradeLevel: data.gradeLevel,
        schoolYear: data.schoolYear,

        // --- STATUS ---
        // Initially 'Pending Application' because subsidies aren't guaranteed until Admin approval
        affiliation: 'Pending Application', 
        
        // --- FINANCIAL ASSESSMENT (Full Amount) ---
        tuitionFee: feeDetails.tuition,
        miscFee: feeDetails.miscTotal,
        grossAssessment: feeDetails.grossTotal,
        
        // --- SUBSIDY (None applied yet) ---
        subsidyAmount: 0,
        
        // --- TOTAL DUE ---
        totalAssessment: feeDetails.grossTotal,
        
        // --- LEDGER STATUS ---
        totalPaid: 0,
        outstandingBalance: feeDetails.grossTotal, // Balance starts at Full Amount
        
        // --- SNAPSHOTS & LOGS ---
        feeBreakdown: feeDetails.breakdown, // Save specific rates used at time of enrollment
        paymentHistory: [],
        createdAt: new Date(),
        lastUpdated: new Date()
    };
};