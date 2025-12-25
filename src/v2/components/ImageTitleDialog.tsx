import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Type, X, Check, Save } from 'lucide-react';

interface ImageTitleDialogProps {
    editor: Editor;
    onClose: () => void;
}

export const ImageTitleDialog: React.FC<ImageTitleDialogProps> = ({ editor, onClose }) => {
    const [title, setTitle] = useState('');
    const [fontSize, setFontSize] = useState<'default' | 'mini'>('default');

    useEffect(() => {
        const attrs = editor.getAttributes('image');
        if (attrs.title) setTitle(attrs.title);
        if (attrs.titleSize) setFontSize(attrs.titleSize);
    }, [editor]);

    const handleApply = () => {
        editor.chain().focus().updateAttributes('image', {
            title: title.trim(),
            titleSize: fontSize
        }).run();
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
                        <Type className="w-4 h-4 text-blue-500" />
                        画像タイトル編集
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
                <div className="p-6 space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500 px-1">
                            タイトル
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            placeholder="画像の説明を入力..."
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 px-1">フォントサイズ</p>
                        <div className="flex gap-2">
                            {(['default', 'mini'] as const).map(size => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => setFontSize(size)}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                                        fontSize === size 
                                        ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                    }`}
                                >
                                    {fontSize === size && <Check className="w-3 h-3" />}
                                    {size === 'default' ? '本文サイズ' : 'サブテキスト'}
                                </button>
                            ))}
                        </div>
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
