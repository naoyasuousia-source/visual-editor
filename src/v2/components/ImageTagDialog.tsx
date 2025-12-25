import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { BaseDialog } from './ui/BaseDialog';
import { Tag, Save } from 'lucide-react';

interface ImageTagDialogProps {
    open: boolean;
    editor: Editor;
    onClose: () => void;
}

/**
 * 画像タグ編集ダイアログ（Radix UI版）
 */
export const ImageTagDialog: React.FC<ImageTagDialogProps> = ({ open, editor, onClose }) => {
    const [tags, setTags] = useState('');

    useEffect(() => {
        if (open) {
            const attrs = editor.getAttributes('image');
            if (attrs.tags) setTags(attrs.tags);
        }
    }, [editor, open]);

    const handleApply = () => {
        // タグをカンマまたは全角カンマで分割し、トリム
        const tagArray = tags.split(/[,、]/).map(t => t.trim()).filter(t => t.length > 0);
        const normalizedTags = tagArray.join(',');
        
        editor.chain().focus().updateAttributes('image', {
            tags: normalizedTags
        }).run();
        onClose();
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={onClose}
            title="画像タグ編集"
            description="カンマ区切りでタグを入力してください"
            maxWidth="sm"
        >
            <form onSubmit={(e) => { e.preventDefault(); handleApply(); }} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 px-1">
                        タグ
                    </label>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        placeholder="例: 風景, 自然, 山"
                        autoFocus
                    />
                    <p className="text-[10px] text-gray-400 px-1">
                        ※カンマ（,）または全角カンマ（、）で区切ってください
                    </p>
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
