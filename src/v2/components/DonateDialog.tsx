import React from 'react';
import { BaseDialog } from './ui/BaseDialog';
import { Heart, Coffee } from 'lucide-react';

interface DonateDialogProps {
    open: boolean;
    onClose: () => void;
}

/**
 * 寄付ダイアログ（Radix UI版）
 */
export const DonateDialog: React.FC<DonateDialogProps> = ({ open, onClose }) => {
    return (
        <BaseDialog
            open={open}
            onOpenChange={onClose}
            title="開発と運営を応援する"
            maxWidth="sm"
        >
            <div className="text-center space-y-6">
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
        </BaseDialog>
    );
};
