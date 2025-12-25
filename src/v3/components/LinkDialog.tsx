import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Link, X, Link2Off, Check } from 'lucide-react';

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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
            
            {/* Dialog Content */}
            <form 
                onSubmit={(e) => { e.preventDefault(); setLink(); }}
                className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h1 className="text-sm font-bold flex items-center gap-2 text-gray-700">
                        <Link className="w-4 h-4 text-blue-500" />
                        リンクの挿入 / 編集
                    </h1>
                    <button 
                        type="button" 
                        className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors" 
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
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
                </div>
            </form>
        </div>
    );
};
