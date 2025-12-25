import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Hash, X, ArrowRight } from 'lucide-react';

interface ParagraphJumpDialogProps {
    editor: Editor;
    onClose: () => void;
}

export const ParagraphJumpDialog: React.FC<ParagraphJumpDialogProps> = ({ editor, onClose }) => {
    const [target, setTarget] = useState('');

    const handleJump = () => {
        let targetId = target.trim();
        if (!targetId) return;

        // Simple heuristic: if it looks like "1-1", prepend "p" -> "p1-1"
        if (/^\d+-\d+$/.test(targetId)) {
            targetId = 'p' + targetId;
        } else if (/^\d+$/.test(targetId)) {
            // Document-wide numbering in Word Mode
            targetId = 'p' + targetId;
        }

        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            alert('指定された段落が見つかりませんでした: ' + targetId);
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
            
            {/* Dialog Content */}
            <form 
                onSubmit={(e) => { e.preventDefault(); handleJump(); }}
                className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h1 className="text-sm font-bold flex items-center gap-2 text-gray-700">
                        <Hash className="w-4 h-4 text-blue-500" />
                        段落へジャンプ
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
                            段落番号 (例: 1-1)
                        </label>
                        <input
                            type="text"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            placeholder="p1-1"
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
                </div>
            </form>
        </div>
    );
};
