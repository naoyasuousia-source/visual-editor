import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { BaseDialog } from './ui/BaseDialog';
import { MessageSquare, Save } from 'lucide-react';

interface ImageCaptionDialogProps {
    open: boolean;
    editor: Editor;
    onClose: () => void;
}

/**
 * 画像キャプション編集ダイアログ（Radix UI版）
 */
export const ImageCaptionDialog: React.FC<ImageCaptionDialogProps> = ({ open, editor, onClose }) => {
    const [caption, setCaption] = useState('');

    useEffect(() => {
        if (open) {
            const attrs = editor.getAttributes('image');
            if (attrs.caption) setCaption(attrs.caption);
        }
    }, [editor, open]);

    const handleApply = () => {
        editor.chain().focus().updateAttributes('image', {
            caption: caption.trim()
        }).run();
        onClose();
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={onClose}
            title="画像キャプション編集"
            description="画像の説明文を入力してください"
            maxWidth="sm"
        >
            <form onSubmit={(e) => { e.preventDefault(); handleApply(); }} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 px-1">
                        キャプション
                    </label>
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                        placeholder="画像の詳細な説明を入力..."
                        rows={4}
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
            </form>
        </BaseDialog>
    );
};
