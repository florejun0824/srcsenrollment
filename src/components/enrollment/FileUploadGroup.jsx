import { useState, useEffect, memo } from 'react';
import { Icons } from './SharedUI';

const FileUploadGroup = memo(({ label, onUploadComplete, onRemove, required = false, existingUrl, setModal }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(existingUrl || null);

    useEffect(() => {
        setPreview(existingUrl);
    }, [existingUrl]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setModal({
                isOpen: true,
                type: 'error',
                title: 'File Too Large',
                message: 'Please upload a file smaller than 5MB.'
            });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

        if (!uploadPreset || !cloudName) {
            console.error("Missing Cloudinary configuration in .env file");
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Configuration Error',
                message: 'System configuration error. Please contact admin.'
            });
            setUploading(false);
            return;
        }

        formData.append("upload_preset", uploadPreset);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            
            if (data.secure_url) {
                setPreview(data.secure_url);
                onUploadComplete(data.secure_url);
            } else {
                console.error("Upload Error:", data);
                setModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Upload Failed',
                    message: 'Upload failed. Please check your internet connection or try again later.'
                });
            }
        } catch (err) {
            console.error("Error uploading:", err);
            setModal({
                isOpen: true,
                type: 'error',
                title: 'Upload Error',
                message: 'An unexpected error occurred while uploading.'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = (e) => {
        e.preventDefault();
        setPreview(null);
        onRemove(); 
    };

    return (
        <div className="flex flex-col md:col-span-2 group">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className={`relative flex items-center gap-4 p-4 rounded-xl border border-dashed transition-all duration-300
                ${preview ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 bg-slate-50/50 hover:bg-white hover:border-red-300 hover:shadow-sm'}`}>
                
                {!preview ? (
                    <label className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-3 py-4 cursor-pointer transition-all
                        ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors 
                            ${uploading ? 'bg-slate-200' : 'bg-white border border-slate-200 text-red-500 shadow-sm group-hover:scale-110 transition-transform'}`}>
                            {uploading ? (
                                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"/>
                            ) : (
                                Icons.upload
                            )}
                        </div>
                        <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide group-hover:text-red-600 transition-colors">
                                {uploading ? 'Uploading...' : 'Click to Upload File'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Max 5MB (Image/PDF)</span>
                        </div>
                        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} disabled={uploading} className="hidden" />
                    </label>
                ) : (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                                {Icons.check}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-emerald-700 truncate">File Attached</span>
                                <a href={preview} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-emerald-600 hover:underline transition-colors mt-0.5">
                                    {Icons.eye} View
                                </a>
                            </div>
                        </div>
                        <button 
                            onClick={handleRemove} 
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-red-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all shadow-sm"
                            title="Remove File"
                        >
                            {Icons.trash}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

export default FileUploadGroup;