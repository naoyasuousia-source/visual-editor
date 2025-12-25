import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';

interface ImageTagDialogProps {
    editor: Editor;
    onClose: () => void;
}

export const ImageTagDialog: React.FC<ImageTagDialogProps> = ({ editor, onClose }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [tags, setTags] = useState('');

    useEffect(() => {
        if (dialogRef.current && !dialogRef.current.open) {
            dialogRef.current.showModal();
        }
    }, []);

    useEffect(() => {
        const attrs = editor.getAttributes('image');
        if (attrs.tags) setTags(attrs.tags); // Assuming 'tags' attribute is used
    }, [editor]);

    const handleApply = () => {
        // Tiptap image extension needs to support 'tags' attribute
        editor.chain().focus().updateAttributes('image', { tags }).run();
        handleClose();
    };

    const handleClose = () => {
        if (dialogRef.current) dialogRef.current.close();
        onClose();
    };

    return (
        <dialog ref={dialogRef} id="image-tag-dialog" aria-labelledby="image-tag-dialog-label" onClose={onClose}>
            <form method="dialog" onSubmit={(e) => { e.preventDefault(); handleApply(); }}>
                <p id="image-tag-dialog-label">画像タグ</p>
                <label htmlFor="image-tag-input">
                    タグ (カンマ区切り)
                    <input
                        type="text"
                        id="image-tag-input"
                        name="image-tag-input"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="A,B,C"
                    />
                </label>
                <div className="dialog-actions">
                    <button type="button" data-action="cancel-image-tag" onClick={handleClose}>キャンセル</button>
                    <button type="submit" data-action="apply-image-tag">適用</button>
                </div>
            </form>
        </dialog>
    );
};
