import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface BrowserWarningDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BrowserWarningDialog: React.FC<BrowserWarningDialogProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
            
            {/* Dialog Content */}
            <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-yellow-50">
                    <h1 className="text-sm font-bold flex items-center gap-2 text-yellow-700">
                        <AlertTriangle className="w-4 h-4" />
                        推奨環境のお知らせ
                    </h1>
                    <button 
                        type="button" 
                        className="p-1 rounded-full hover:bg-yellow-100 text-yellow-600 transition-colors" 
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 text-center space-y-4">
                    <p className="text-gray-600 text-xs leading-relaxed">
                        このツールはPC環境のGoogle Chrome・Microsoft Edgeに最適化されています。<br />
                        他環境・他ブラウザでは正しく動作しない場合があります。
                    </p>

                    <button 
                        type="button"
                        className="w-full py-2 px-4 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all"
                        onClick={onClose}
                    >
                        理解して閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};
