import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { BaseDialog } from '@/components/ui/BaseDialog';
import { Check, Save } from 'lucide-react';

interface ImageTitleDialogProps {
    open: boolean;
    editor: Editor;
    onClose: () => void;
}

/**
 * 画像タイトル編集ダイアログ
 * 
 * 【重要】selectable: falseの画像に対応するため、
 * ダイアログが開いたときに画像の位置を保存し、適用時にその位置を使用します。
 */
export const ImageTitleDialog: React.FC<ImageTitleDialogProps> = ({ open, editor, onClose }) => {
    const [title, setTitle] = useState('');
    const [fontSize, setFontSize] = useState<'default' | 'mini'>('default');
    
    // ダイアログが開いたときの画像位置を保存
    const imagePosRef = useRef<number | null>(null);

    useEffect(() => {
        if (open) {
            // ダイアログが開いたときに画像の位置と属性を保存
            const { state } = editor;
            const { $from } = state.selection;
            const nodeBefore = $from.nodeBefore;
            
            if (nodeBefore?.type.name === 'image') {
                // 画像の位置を保存
                imagePosRef.current = $from.pos - nodeBefore.nodeSize;
                setTitle(nodeBefore.attrs.title || '');
                setFontSize(nodeBefore.attrs.titleSize || 'default');
            } else {
                // フォールバック: 画像が見つからない場合
                imagePosRef.current = null;
                const attrs = editor.getAttributes('image');
                if (attrs.title) setTitle(attrs.title);
                if (attrs.titleSize) setFontSize(attrs.titleSize);
            }
        }
    }, [editor, open]);

    const handleApply = () => {
        const { state, view } = editor;
        
        // 保存した位置を使用して画像を更新
        if (imagePosRef.current !== null) {
            const node = state.doc.nodeAt(imagePosRef.current);
            if (node?.type.name === 'image') {
                const tr = state.tr.setNodeMarkup(imagePosRef.current, undefined, {
                    ...node.attrs,
                    title: title.trim(),
                    titleSize: fontSize
                });
                view.dispatch(tr);
                onClose();
                return;
            }
        }
        
        // フォールバック: 現在のキャレット位置から画像を探す
        const { $from, empty } = state.selection;
        if (empty && $from.nodeBefore?.type.name === 'image') {
            const imagePos = $from.pos - $from.nodeBefore.nodeSize;
            const tr = state.tr.setNodeMarkup(imagePos, undefined, {
                ...$from.nodeBefore.attrs,
                title: title.trim(),
                titleSize: fontSize
            });
            view.dispatch(tr);
        } else {
            // 最終フォールバック
            editor.chain().focus().updateAttributes('image', {
                title: title.trim(),
                titleSize: fontSize
            }).run();
        }
        
        onClose();
    };


    return (
        <BaseDialog
            open={open}
            onOpenChange={onClose}
            title="画像タイトル編集"
            maxWidth="sm"
        >
            <form onSubmit={(e) => { e.preventDefault(); handleApply(); }} className="space-y-6">
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
            </form>
        </BaseDialog>
    );
};

