import React from 'react';
import { X, Heart, Coffee } from 'lucide-react';

interface DonateDialogProps {
    onClose: () => void;
}

export const DonateDialog: React.FC<DonateDialogProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
            
            {/* Dialog Content */}
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-pink-50 to-white">
                    <h1 className="text-lg font-bold flex items-center gap-2 text-pink-600">
                        <Heart className="w-5 h-5 fill-current" />
                        開発と運営を応援する
                    </h1>
                    <button 
                        type="button" 
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" 
                        onClick={onClose}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="p-4 bg-pink-50 rounded-full">
                            <Coffee className="w-10 h-10 text-pink-500" />
                        </div>
                    </div>
                    
                    <p className="text-gray-600 leading-relaxed text-sm">
                        いつも AI-Link Editor をご利用いただきありがとうございます。<br />
                        個人での開発・サーバー維持のため、温かいご支援をお願いしております。
                    </p>

                    <div className="pt-4">
                        <button 
                            type="button"
                            className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={() => window.open('https://github.com/sponsors/naoyasuousia', '_blank')}
                        >
                            応援ページへ進む
                        </button>
                    </div>

                    <p className="text-[10px] text-gray-400">
                        ※リンク先は外部の決済・支援ページへ移動します。
                    </p>
                </div>
            </div>
        </div>
    );
};
