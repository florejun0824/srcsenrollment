import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { X, Check } from 'lucide-react';

const AddAccountModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({ lastName: '', firstName: '', mi: '', username: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const miPart = form.mi ? `${form.mi.charAt(0)}.` : '';
            const fullName = `${form.lastName}, ${form.firstName} ${miPart}`.toUpperCase().trim();
            
            await addDoc(collection(db, "student_accounts"), {
                studentName: fullName,
                username: form.username,
                password: form.password,
                createdAt: new Date()
            });
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white uppercase">Add Account</h2>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="Last Name" required value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white uppercase text-sm font-bold w-full" />
                        <input type="text" placeholder="First Name" required value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white uppercase text-sm font-bold w-full" />
                    </div>
                    <input type="text" placeholder="M.I." maxLength={1} value={form.mi} onChange={e=>setForm({...form, mi: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white uppercase text-sm font-bold w-full" />
                    <hr className="border-white/5" />
                    <input type="text" placeholder="Username" required value={form.username} onChange={e=>setForm({...form, username: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold w-full" />
                    <input type="text" placeholder="Password" required value={form.password} onChange={e=>setForm({...form, password: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold w-full" />
                    
                    <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold uppercase tracking-widest mt-2">
                        {loading ? 'Saving...' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
};
export default AddAccountModal;