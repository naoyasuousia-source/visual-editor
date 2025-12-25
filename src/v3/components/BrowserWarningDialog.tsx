import React, { useEffect, useRef } from 'react';

interface BrowserWarningDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BrowserWarningDialog: React.FC<BrowserWarningDialogProps> = ({ isOpen, onClose }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
            } else {
                dialog.setAttribute('open', 'true');
            }
        } else {
            if (typeof dialog.close === 'function') {
                dialog.close();
            } else {
                dialog.removeAttribute('open');
            }
        }
    }, [isOpen]);

    return (
        <dialog
            id="browser-warning-dialog"
            ref={dialogRef}
            aria-labelledby="browser-warning-label"
            onCancel={(e) => { e.preventDefault(); onClose(); }}
        >
            <form method="dialog">
                <p
                    id="browser-warning-label"
                    style={{ color: '#d9534f', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    推奨環境のお知らせ
                </p>
                <div className="dialog-content" style={{ textAlign: 'center', lineHeight: 1.6 }}>
                    <p>このツールはPC環境のGoogle Chrome・Microsoft Edgeに最適化されています。<br />他環境・他ブラウザでは正しく動作しない場合があります。</p>
                </div>
                <div className="dialog-actions" style={{ justifyContent: 'center' }}>
                    <button type="submit" onClick={onClose}>閉じる</button>
                </div>
            </form>
        </dialog>
    );
};
