import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface BrowserWarningDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BrowserWarningDialog: React.FC<BrowserWarningDialogProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Overlay with high-end glassmorphism */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}></div>
            
            {/* Dialog Content: Premium Card Design */}
            <div className="relative bg-white/95 border border-white/20 w-full max-w-sm rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-400">
                {/* Visual Header Part */}
                <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400" />
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-base font-black text-slate-800 tracking-tight">
                                推奨環境のお知らせ
                            </h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Environment Notice</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <p className="text-slate-700 text-sm font-medium leading-relaxed">
                            本エディタは、最高の編集体験を提供するため、<br />
                            <span className="text-blue-600 font-bold">PC版 Google Chrome / Microsoft Edge</span> 
                            に最適化されています。
                        </p>
                        <p className="text-slate-500 text-[12px] leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            スマートフォン、タブレット、または Safari / Firefox 等のブラウザでは、一部の機能が正しく動作しない可能性があります。
                        </p>
                    </div>

                    <button 
                        type="button"
                        className="group relative w-full py-3 px-4 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg hover:shadow-slate-200"
                        onClick={onClose}
                    >
                        <span className="relative z-10">内容を理解して閉じる</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>
        </div>
    );
};
