import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';

interface LinkDialogProps {
    editor: Editor;
    onClose: () => void;
}

export const LinkDialog: React.FC<LinkDialogProps> = ({ editor, onClose }) => {
    const [url, setUrl] = useState('');

    useEffect(() => {
        const previousUrl = editor.getAttributes('link').href;
        if (previousUrl) {
            setUrl(previousUrl);
        }
    }, [editor]);

    const setLink = () => {
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
        onClose();
    };

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        onClose();
    };

    return (
        <dialog id="link-dialog" className="open" style={{ display: 'block' }}>
            <div className="hint-header">
                <h1>リンクの挿入/編集</h1>
                <button type="button" className="close-button" onClick={onClose}>×</button>
            </div>
            <div className="hint-body">
                <div style={{ marginBottom: '1em' }}>
                    <label>URL:</label>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        style={{ width: '100%', padding: '4px', marginTop: '4px' }}
                    />
                </div>
                <div style={{ textAlign: 'right', gap: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={removeLink} className="danger">リンク解除</button>
                    <button type="button" onClick={setLink}>適用</button>
                </div>
            </div>
        </dialog>
    );
};
