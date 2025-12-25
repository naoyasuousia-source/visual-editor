import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';

interface ParagraphJumpDialogProps {
    editor: Editor;
    onClose: () => void;
}

export const ParagraphJumpDialog: React.FC<ParagraphJumpDialogProps> = ({ editor, onClose }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [target, setTarget] = useState('');

    useEffect(() => {
        if (dialogRef.current && !dialogRef.current.open) {
            dialogRef.current.showModal();
        }
    }, []);

    const handleJump = () => {
        // Logic to jump to paragraph ID (e.g. p1-1)
        // User enters "1-1", we look for "p1-1"
        // Or user enters "p1-1"
        let targetId = target;
        // Simple heuristic: if it looks like "1-1", prepend "p" -> "p1-1"
        if (/^\d+-\d+$/.test(targetId)) {
            targetId = 'p' + targetId;
        }

        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Ideally also move cursor there, but scrolling is the visual requirement
        } else {
            alert('指定された段落が見つかりませんでした: ' + targetId);
        }

        handleClose();
    };

    const handleClose = () => {
        if (dialogRef.current) dialogRef.current.close();
        onClose();
    };

    return (
        <dialog ref={dialogRef} id="paragraph-jump-dialog" onClose={onClose}>
            <form method="dialog" className="dialog-form" onSubmit={(e) => { e.preventDefault(); handleJump(); }}>
                <p>段落へジャンプ</p>
                <label className="standard-only">
                    段落番号 (例: 1-1):
                    <input
                        type="text"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder="p-n"
                    />
                </label>
                <div className="dialog-actions" style={{ display: 'flex', marginTop: '16px' }}>
                    <button type="button" onClick={handleClose} style={{ marginRight: '8px' }}>閉じる</button>
                    <button type="submit">ジャンプ</button>
                </div>
            </form>
        </dialog>
    );
};
