import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { BaseDialog } from './ui/BaseDialog';
import { useJumpNavigation } from '../hooks/useJumpNavigation';
import { useAppStore } from '../store/useAppStore';
import { Hash, ArrowRight } from 'lucide-react';

interface ParagraphJumpDialogProps {
    open: boolean;
    editor: Editor;
    onClose: () => void;
}

/**
 * 段落ジャンプダイアログ（Radix UI版）
 * useJumpNavigationフックを使用してロジックを分離
 */
export const ParagraphJumpDialog: React.FC<ParagraphJumpDialogProps> = ({ open, editor, onClose }) => {
    const [target, setTarget] = useState('');
    const { isWordMode } = useAppStore();
    const { jumpTo } = useJumpNavigation(editor, isWordMode);

    const handleJump = () => {
        jumpTo(target.trim());
        onClose();
    };

    return (
        <BaseDialog
            open={open}
            onOpenChange={onClose}
            title="段落へジャンプ"
            description={isWordMode ? "段落番号を入力してください（例: 15）" : "段落番号を入力してください（例: 1-1）"}
            maxWidth="sm"
        >
            <form onSubmit={(e) => { e.preventDefault(); handleJump(); }} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 px-1">
                        {isWordMode ? "段落番号 (例: 15)" : "段落番号 (例: 1-1)"}
                    </label>
                    <input
                        type="text"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                        placeholder={isWordMode ? "15" : "1-1"}
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
                        <span>移動する</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </form>
        </BaseDialog>
    );
};
