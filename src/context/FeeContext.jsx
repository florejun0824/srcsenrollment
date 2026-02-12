import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { FEE_SCHEDULE as DEFAULT_FEES, SUBSIDIES as DEFAULT_SUBSIDIES } from '../utils/FeeConstants';

const FeeContext = createContext();

export const useFees = () => useContext(FeeContext);

export const FeeProvider = ({ children }) => {
    const [feeSchedule, setFeeSchedule] = useState(DEFAULT_FEES);
    const [subsidies, setSubsidies] = useState(DEFAULT_SUBSIDIES);
    const [gcashQrUrl, setGcashQrUrl] = useState(''); // Store QR Code URL
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to real-time updates from Firestore
        const unsub = onSnapshot(doc(db, "settings", "schoolFees"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setFeeSchedule(data.feeSchedule || DEFAULT_FEES);
                setSubsidies(data.subsidies || DEFAULT_SUBSIDIES);
                setGcashQrUrl(data.gcashQrUrl || '');
            } else {
                // Initialize DB with defaults if empty
                setDoc(doc(db, "settings", "schoolFees"), {
                    feeSchedule: DEFAULT_FEES,
                    subsidies: DEFAULT_SUBSIDIES,
                    gcashQrUrl: ''
                });
            }
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const updateSettings = async (newFees, newSubsidies, newQrUrl) => {
        await setDoc(doc(db, "settings", "schoolFees"), {
            feeSchedule: newFees,
            subsidies: newSubsidies,
            gcashQrUrl: newQrUrl
        });
    };

    // Dynamic calculator replacing the static one
    const calculateFees = (gradeLevel) => {
        let category = null;
        if (['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(gradeLevel)) category = 'JHS';
        else if (['Grade 11 (SHS)', 'Grade 12 (SHS)'].includes(gradeLevel)) category = 'SHS';

        if (!category || !feeSchedule[category]) return null;

        const fees = feeSchedule[category];
        const standardTotal = Object.values(fees.standard || {}).reduce((a, b) => a + Number(b), 0);
        const nonStandardTotal = Object.values(fees.nonStandard || {}).reduce((a, b) => a + Number(b), 0);

        return {
            ...fees,
            totalAssessment: Number(fees.tuition) + standardTotal + nonStandardTotal
        };
    };

    return (
        <FeeContext.Provider value={{ feeSchedule, subsidies, gcashQrUrl, calculateFees, updateSettings, loading }}>
            {children}
        </FeeContext.Provider>
    );
};