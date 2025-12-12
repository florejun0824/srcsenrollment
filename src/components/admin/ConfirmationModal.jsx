import React from 'react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform scale-100 transition-all">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    <span className="text-xl font-bold">!</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 text-center mb-2">{title}</h3>
                <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                    {message}
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className={`flex-1 py-3 rounded-xl text-white font-bold text-sm shadow-lg transition-all transform hover:-translate-y-0.5 ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;