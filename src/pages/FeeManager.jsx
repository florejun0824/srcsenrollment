import React, { useState, useEffect } from 'react';
import { useFees } from '../context/FeeContext';
import { Save, Plus, Trash2, Printer, QrCode, ArrowLeft } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import FeeBreakdownPDF from '../components/admin/FeeBreakdownPDF'; // Defined in step 3
import { useNavigate } from 'react-router-dom'; // Assuming you use react-router

const FeeManager = () => {
    const { feeSchedule, subsidies, gcashQrUrl, updateSettings } = useFees();
    const [localFees, setLocalFees] = useState(null);
    const [localSubsidies, setLocalSubsidies] = useState(null);
    const [localQr, setLocalQr] = useState('');
    const navigate = useNavigate();

    // Sync local state with context when data loads
    useEffect(() => {
        if (feeSchedule) setLocalFees(JSON.parse(JSON.stringify(feeSchedule)));
        if (subsidies) setLocalSubsidies({ ...subsidies });
        if (gcashQrUrl) setLocalQr(gcashQrUrl);
    }, [feeSchedule, subsidies, gcashQrUrl]);

    if (!localFees) return <div>Loading...</div>;

    const handleSave = async () => {
        if (window.confirm("Save changes to fees and subsidies? This will affect new enrollments.")) {
            await updateSettings(localFees, localSubsidies, localQr);
            alert("Settings saved successfully!");
        }
    };

    const handleFeeChange = (category, type, key, value) => {
        setLocalFees(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [type]: type === 'tuition' ? Number(value) : {
                    ...prev[category][type],
                    [key]: Number(value)
                }
            }
        }));
    };

    const addFeeItem = (category, type) => {
        const name = prompt("Enter Fee Name:");
        if (name) {
            setLocalFees(prev => ({
                ...prev,
                [category]: {
                    ...prev[category],
                    [type]: { ...prev[category][type], [name]: 0 }
                }
            }));
        }
    };

    const addSubsidy = () => {
        const name = prompt("Enter Scholarship/Grant Name:");
        if (name) {
            setLocalSubsidies(prev => ({ ...prev, [name]: 0 }));
        }
    };

    const handlePrintBreakdown = async () => {
        const blob = await pdf(<FeeBreakdownPDF fees={localFees} />).toBlob();
        window.open(URL.createObjectURL(blob), '_blank');
    };

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                         <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft className="w-5 h-5"/></button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">Fee & Scholarship Manager</h1>
                            <p className="text-sm text-slate-500">Manage tuition, miscellaneous fees, and grants.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handlePrintBreakdown} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-50">
                            <Printer className="w-4 h-4" /> Print Schedule
                        </button>
                        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                            <Save className="w-4 h-4" /> Save Changes
                        </button>
                    </div>
                </div>

                {/* GCash Settings */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                     <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <QrCode className="w-4 h-4"/> GCash Configuration
                    </h2>
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 mb-1 block">QR Code Image URL</label>
                            <input 
                                type="text" 
                                value={localQr}
                                onChange={(e) => setLocalQr(e.target.value)}
                                placeholder="https://example.com/my-qr-code.png"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold"
                            />
                        </div>
                        {localQr && <img src={localQr} alt="QR Preview" className="w-16 h-16 rounded-lg border border-slate-200 object-cover" />}
                    </div>
                </div>

                {/* Scholarship Grants */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Scholarships & Grants</h2>
                        <button onClick={addSubsidy} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"><Plus className="w-3 h-3"/> Add Grant</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(localSubsidies).map(([name, amount]) => (
                            <div key={name} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-sm font-bold text-slate-700">{name}</span>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        value={amount} 
                                        onChange={(e) => setLocalSubsidies(prev => ({ ...prev, [name]: Number(e.target.value) }))}
                                        className="w-24 text-right bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                                    />
                                    <button onClick={() => {
                                        const newSub = { ...localSubsidies };
                                        delete newSub[name];
                                        setLocalSubsidies(newSub);
                                    }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fee Schedule (Iterate JHS/SHS) */}
                {['JHS', 'SHS'].map(level => (
                    <div key={level} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-black text-slate-800 mb-4 border-b border-slate-100 pb-2">{level === 'JHS' ? 'Junior High School' : 'Senior High School'}</h2>
                        
                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Tuition Fee</label>
                            <input 
                                type="number" 
                                value={localFees[level].tuition} 
                                onChange={(e) => handleFeeChange(level, 'tuition', null, e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-lg font-black text-indigo-600 w-full md:w-48"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Standard Fees */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase">Standard Fees</h3>
                                    <button onClick={() => addFeeItem(level, 'standard')} className="text-[10px] font-bold text-indigo-600 hover:underline">+ Add Item</button>
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(localFees[level].standard).map(([key, val]) => (
                                        <div key={key} className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600">{key}</span>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    value={val} 
                                                    onChange={(e) => handleFeeChange(level, 'standard', key, e.target.value)}
                                                    className="w-24 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                                                />
                                                <button onClick={() => {
                                                    const newFees = { ...localFees };
                                                    delete newFees[level].standard[key];
                                                    setLocalFees(newFees);
                                                }} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Non-Standard Fees */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase">Non-Standard / Membership</h3>
                                    <button onClick={() => addFeeItem(level, 'nonStandard')} className="text-[10px] font-bold text-indigo-600 hover:underline">+ Add Item</button>
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(localFees[level].nonStandard).map(([key, val]) => (
                                        <div key={key} className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600">{key}</span>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    value={val} 
                                                    onChange={(e) => handleFeeChange(level, 'nonStandard', key, e.target.value)}
                                                    className="w-24 text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold"
                                                />
                                                <button onClick={() => {
                                                    const newFees = { ...localFees };
                                                    delete newFees[level].nonStandard[key];
                                                    setLocalFees(newFees);
                                                }} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeeManager;