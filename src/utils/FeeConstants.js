// src/utils/FeeConstants.js

export const FEE_SCHEDULE = {
    // Junior High School (Grades 7, 8, 9, 10)
    'JHS': { 
        tuition: 11850.00,
        standard: {
            "Registration": 220.00,
            "Science Laboratory": 75.00,
            "TLE Laboratory": 50.00,
            "Computer Fee": 1500.00,
            "Library": 300.00,
            "Medical/Dental": 200.00,
            "Testing Materials": 200.00,
            "Insurance": 50.00,
            "Sports and Cultural": 100.00,
            "ID and Validation": 150.00,
            "PTA": 25.00,
            "Instructional Materials (Quipper LMS)": 1800.00,
            "General Support Services": 10.00 
        },
        nonStandard: {
            "CEAP Membership": 50.00,
            "COE Membership": 70.00,
            "NIDACS": 100.00
        }
    },
    // Senior High School (Grades 11, 12) - PLACEHOLDER VALUES
    'SHS': {
        tuition: 15000.00, 
        standard: { 
            "Registration": 220.00,
            "Library": 300.00,
            "Medical/Dental": 200.00,
            "ID and Validation": 150.00,
            "Miscellaneous": 4130.00 
        },
        nonStandard: { 
            "CEAP Membership": 50.00,
            "NIDACS": 100.00 
        }
    }
};

export const SUBSIDIES = {
    "ESC Grantee": 9000.00,           // JHS (Grades 7-10)
    "SHS Voucher (Public)": 22500.00, // SHS (Public Completer)
    "SHS Voucher (Private)": 18000.00,// SHS (Private Completer)
    "None": 0
};

export const PAYMENT_MODES = [
    { label: 'Cash', value: 'Cash' },
    { label: 'Bank Transfer', value: 'Bank Transfer' },
    { label: 'Gcash', value: 'Gcash' }
];

// Helper to calculate totals based on Grade Level
export const calculateTotalFees = (gradeLevel) => {
    let category = null;

    if (['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(gradeLevel)) {
        category = 'JHS';
    } else if (['Grade 11 (SHS)', 'Grade 12 (SHS)'].includes(gradeLevel)) {
        category = 'SHS';
    } 

    // If grade level doesn't match JHS or SHS (e.g. Kinder), return null (No SOA generated yet)
    if (!category) return null;

    const fees = FEE_SCHEDULE[category];
    const standardTotal = Object.values(fees.standard).reduce((a, b) => a + b, 0);
    const nonStandardTotal = Object.values(fees.nonStandard).reduce((a, b) => a + b, 0);
    
    return {
        ...fees,
        totalAssessment: fees.tuition + standardTotal + nonStandardTotal
    };
};