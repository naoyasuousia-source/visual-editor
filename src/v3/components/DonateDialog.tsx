import React from 'react';

interface DonateDialogProps {
    onClose: () => void;
}

export const DonateDialog: React.FC<DonateDialogProps> = ({ onClose }) => {
    return (
        <dialog id="donate-dialog" className="open" style={{ display: 'block' }}>
            <form method="dialog">
                <div className="hint-header">
                    <h1>開発と運営を応援する</h1>
                    <button type="button" className="close-button" onClick={onClose} aria-label="閉じる">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div className="hint-body">
                    <p style={{ textAlign: 'center', marginBottom: '1.5em', lineHeight: '1.8' }}>
                        いつも AI-Link Editor をご利用いただきありがとうございます。<br />
                        個人での開発・サーバー維持のため、温かいご支援をお願いしております。
                    </p>
                    <div style={{ textAlign: 'center' }}>
                        {/* 寄付ボタンやQRコードなどのプレースホルダー */}
                        <p>（ここに決済リンクなどのボタンを配置）</p>
                    </div>
                </div>
            </form>
        </dialog>
    );
};
