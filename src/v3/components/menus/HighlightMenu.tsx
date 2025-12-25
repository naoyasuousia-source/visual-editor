import React from 'react';
import { Editor } from '@tiptap/react';
import { RotateCcw } from 'lucide-react';

interface HighlightMenuProps {
    editor: Editor;
}

export const HighlightMenu: React.FC<HighlightMenuProps> = ({ editor }) => {

    const setHighlight = (color: string) => {
        editor.chain().focus().toggleHighlight({ color }).run();
    };

    const unsetHighlight = () => {
        editor.chain().focus().unsetHighlight().run();
    };

    return (
        <div className="bg-white border border-gray-300 shadow-xl rounded p-2 flex gap-2 items-center animate-in fade-in zoom-in-95 duration-100">
            <button type="button" className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform bg-[#FFFF00]" onClick={() => setHighlight('#FFFF00')} title="黄色"></button>
            <button type="button" className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform bg-[#FFB7B7]" onClick={() => setHighlight('#FFB7B7')} title="薄ピンク"></button>
            <button type="button" className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform bg-[#B7E1FF]" onClick={() => setHighlight('#B7E1FF')} title="薄青"></button>
            <button type="button" className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform bg-[#C4F0C5]" onClick={() => setHighlight('#C4F0C5')} title="薄緑"></button>
            <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
            <button 
                type="button" 
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-xs text-gray-600 transition-colors" 
                onClick={unsetHighlight} 
                title="ハイライトを取り消す"
            >
                <RotateCcw className="w-3 h-3" />
                <span>取消</span>
            </button>
        </div>
    );
};
