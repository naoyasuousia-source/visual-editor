import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { HELP_CONTENT } from '../../ui/help-info';

export const SubHelpDialog: React.FC = () => {
    const { subHelpData, closeSubHelp } = useAppStore();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (subHelpData.isOpen) {
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
    }, [subHelpData.isOpen]);

    // Handle Closing
    const handleClose = () => {
        closeSubHelp();
    };

    const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        // Close if clicked outside
        const rect = e.currentTarget.getBoundingClientRect();
        const isInDialog = (
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
            handleClose();
        }
    };

    const content = subHelpData.type ? HELP_CONTENT[subHelpData.type] : '';
    const isLegal = subHelpData.type === '特定商取引法に基づく表記';
    const isSmall = subHelpData.type !== '詳細情報'; // Default detail title? 

    return (
        <dialog
            id="sub-help-dialog"
            ref={dialogRef}
            onClick={handleDialogClick}
            onCancel={(e) => { e.preventDefault(); handleClose(); }}
            className={subHelpData.isOpen ? 'open' : ''}
        >
            <form method="dialog">
                <div className="hint-header">
                    <h1 id="sub-help-dialog-label">{subHelpData.type || '詳細情報'}</h1>
                    <button type="button" className="close-button" onClick={handleClose} aria-label="閉じる">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 4L4 20M4 4l16 16"></path>
                        </svg>
                    </button>
                </div>
                <div
                    className={`hint-body ${isSmall ? 'is-small' : ''} ${isLegal ? 'is-legal' : ''}`}
                    id="sub-help-content"
                    ref={contentRef}
                    dangerouslySetInnerHTML={{ __html: content || '<p>詳細情報は現在準備中です。</p>' }}
                />
            </form>
        </dialog>
    );
};
