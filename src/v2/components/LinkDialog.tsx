import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { BaseDialog } from './ui/BaseDialog';
import { Link, Link2Off, Check } from 'lucide-react';

interface LinkDialogProps {
    open: boolean;
    editor: Editor;
    onClose: () => void;
}

/**
 * リンク編集ダイアログ（Radix UI版）
 */
export const LinkDialog: React.FC<LinkDialogProps> = ({ open, editor, onClose }) => {
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (open) {
            const previousUrl = editor.getAttributes('link').href;
            if (previousUrl) {
                setUrl(previousUrl);
            }
        }
    }, [editor, open]);

    const setLink = () => {
        if (url.trim() === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
        }
        onClose();
    };

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        onClose();
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={onClose}
            title="リンクの挿入 / 編集"
            maxWidth="sm"
        >
            <form onSubmit={(e) => { e.preventDefault(); setLink(); }} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 px-1">
                        URL (外部リンクまたはアンカー)
                    </label>
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        placeholder="https://example.com"
                        autoFocus
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <button 
                        type="button"
                        className="flex-1 py-2.5 px-4 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl hover:bg-rose-50 flex items-center justify-center gap-1.5 transition-all"
                        onClick={removeLink}
                    >
                        <Link2Off className="w-3.5 h-3.5" />
                        <span>リンク解除</span>
                    </button>
                    <button 
                        type="submit"
                        className="flex-1 py-2.5 px-4 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-1.5 transition-all"
                    >
                        <Check className="w-3.5 h-3.5" />
                        <span>適用する</span>
                    </button>
                </div>
            </form>
        </BaseDialog>
    );
};
