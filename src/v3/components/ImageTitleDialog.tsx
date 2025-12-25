import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';

interface ImageTitleDialogProps {
    editor: Editor;
    onClose: () => void;
}

export const ImageTitleDialog: React.FC<ImageTitleDialogProps> = ({ editor, onClose }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [title, setTitle] = useState('');
    const [fontSize, setFontSize] = useState<'default' | 'mini'>('default');

    useEffect(() => {
        if (dialogRef.current && !dialogRef.current.open) {
            dialogRef.current.showModal();
        }
    }, []);

    useEffect(() => {
        const attrs = editor.getAttributes('image');
        if (attrs.title) setTitle(attrs.title);
        if (attrs.titleSize) setFontSize(attrs.titleSize);
    }, [editor]);

    const handleApply = () => {
        editor.chain().focus().updateAttributes('image', {
            title: title,
            titleSize: fontSize
        }).run();
        handleClose();
    };

    const handleClose = () => {
        if (dialogRef.current) dialogRef.current.close();
        onClose();
    };

    return (
        <dialog ref={dialogRef} id="image-title-dialog" aria-labelledby="image-title-dialog-label" onClose={onClose}>
            <form method="dialog" onSubmit={(e) => { e.preventDefault(); handleApply(); }}>
                <p id="image-title-dialog-label">画像タイトル</p>
                <label>
                    タイトル
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="タイトルを入力"
                    />
                </label>
                <fieldset>
                    <legend>フォントサイズ</legend>
                    <label>
                        <input
                            type="radio"
                            name="image-title-font-size"
                            value="default"
                            checked={fontSize === 'default'}
                            onChange={() => setFontSize('default')}
                        />
                        本文サイズ
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="image-title-font-size"
                            value="mini"
                            checked={fontSize === 'mini'}
                            onChange={() => setFontSize('mini')}
                        />
                        サブテキスト
                    </label>
                </fieldset>
                <div className="dialog-actions">
                    <button type="button" onClick={handleClose}>キャンセル</button>
                    <button type="submit">適用</button>
                </div>
            </form>
        </dialog>
    );
};
