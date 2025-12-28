import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { BaseDialog } from '@/components/ui/BaseDialog';
import { Save } from 'lucide-react';

interface ImageTagDialogProps {
    open: boolean;
    editor: Editor;
    onClose: () => void;
}

/**
 * 画像タグ編集ダイアログ
 * 
 * 【重要】selectable: falseの画像に対応するため、
 * キャレットの直前のノード（$from.nodeBefore）から画像を特定します。
 * 
 * 注意: 属性名は「tag」（単数形）です。
 */
export const ImageTagDialog: React.FC<ImageTagDialogProps> = ({ open, editor, onClose }) => {
    const [tag, setTag] = useState('');

    useEffect(() => {
        if (open) {
            // キャレットの直前のノードから画像属性を取得
            const { state } = editor;
            const { $from } = state.selection;
            const nodeBefore = $from.nodeBefore;
            
            if (nodeBefore?.type.name === 'image') {
                setTag(nodeBefore.attrs.tag || '');
            } else {
                // フォールバック
                const attrs = editor.getAttributes('image');
                if (attrs.tag) setTag(attrs.tag);
            }
        }
    }, [editor, open]);

    const handleApply = () => {
        // タグをカンマまたは全角カンマで分割し、トリム
        const tagArray = tag.split(/[,、]/).map(t => t.trim()).filter(t => t.length > 0);
        const normalizedTag = tagArray.join(',');
        
        const { state, view } = editor;
        const { $from, empty } = state.selection;
        
        // キャレットの直前のノードが画像かチェック
        if (empty && $from.nodeBefore?.type.name === 'image') {
            const imagePos = $from.pos - $from.nodeBefore.nodeSize;
            const tr = state.tr.setNodeMarkup(imagePos, undefined, {
                ...$from.nodeBefore.attrs,
                tag: normalizedTag
            });
            view.dispatch(tr);
        } else {
            // フォールバック
            editor.chain().focus().updateAttributes('image', {
                tag: normalizedTag
            }).run();
        }
        
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
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
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

