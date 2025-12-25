import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { MessageSquare, X, Save } from 'lucide-react';

interface ImageCaptionDialogProps {
    editor: Editor;
    onClose: () => void;
}

export const ImageCaptionDialog: React.FC<ImageCaptionDialogProps> = ({ editor, onClose }) => {
    const [caption, setCaption] = useState('');

    useEffect(() => {
        const attrs = editor.getAttributes('image');
        if (attrs.caption) setCaption(attrs.caption);
    }, [editor]);

    const handleApply = () => {
        editor.chain().focus().updateAttributes('image', { caption: caption.trim() }).run();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
            
            {/* Dialog Content */}
            <form 
                onSubmit={(e) => { e.preventDefault(); handleApply(); }}
                className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h1 className="text-sm font-bold flex items-center gap-2 text-gray-700">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        キャプション編集
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
                            キャプションの入力
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm min-h-[120px] resize-none"
                            placeholder="画像の下部に表示される説明文を入力..."
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button 
                            type="button"
                            className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all"
                            onClick={onClose}
                        >
                            キャンセル
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 py-2.5 px-4 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>適用する</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};
