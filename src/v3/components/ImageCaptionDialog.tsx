import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';

interface ImageCaptionDialogProps {
    editor: Editor;
    onClose: () => void;
}

export const ImageCaptionDialog: React.FC<ImageCaptionDialogProps> = ({ editor, onClose }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [caption, setCaption] = useState('');

    useEffect(() => {
        if (dialogRef.current && !dialogRef.current.open) {
            dialogRef.current.showModal();
        }
    }, []);

    useEffect(() => {
        const attrs = editor.getAttributes('image');
        if (attrs.caption) setCaption(attrs.caption);
    }, [editor]);

    const handleApply = () => {
        editor.chain().focus().updateAttributes('image', { caption }).run();
        handleClose();
    };

    const handleClose = () => {
        if (dialogRef.current) dialogRef.current.close();
        onClose();
    };

    return (
        <dialog ref={dialogRef} id="image-caption-dialog" aria-labelledby="image-caption-dialog-label" onClose={onClose}>
            <form method="dialog" onSubmit={(e) => { e.preventDefault(); handleApply(); }}>
                <p id="image-caption-dialog-label">画像キャプション</p>
                <label>
                    キャプション
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="キャプションを入力"
                        rows={5}
                        style={{ width: '100%', resize: 'vertical' }}
                    ></textarea>
                </label>
                <div className="dialog-actions">
                    <button type="button" onClick={handleClose}>キャンセル</button>
                    <button type="submit">適用</button>
                </div>
            </form>
        </dialog>
    );
};
