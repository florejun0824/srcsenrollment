import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { X } from 'lucide-react';

const EditAccountModal = ({ account, onClose, onSuccess }) => {
    const [form, setForm] = useState({ 
        studentName: account.studentName, 
        username: account.username, 
        password: account.password 
    });

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, "student_accounts", account.id), {
                studentName: form.studentName.toUpperCase(),
                username: form.username,
                password: form.password
            });
            onSuccess();
            onClose();
        } catch (e) { alert(e.message); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white uppercase">Edit Account</h2>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Student Name</label>
                        <input type="text" value={form.studentName} onChange={e=>setForm({...form, studentName: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold w-full" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Username</label>
                        <input type="text" value={form.username} onChange={e=>setForm({...form, username: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold w-full" />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-1">Password</label>
                        <input type="text" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold w-full" />
                    </div>
                    <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold uppercase tracking-widest mt-2">Save Changes</button>
                </form>
            </div>
        </div>
    );
};
export default EditAccountModal;