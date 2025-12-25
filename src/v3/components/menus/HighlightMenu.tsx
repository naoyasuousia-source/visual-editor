import React from 'react';
import { Editor } from '@tiptap/react';

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
        <div className="highlight-palette" role="group" aria-label="ハイライトカラー">
            <button type="button" className="highlight-color-button" onClick={() => setHighlight('#FFFF00')} style={{ color: '#FFFF00' }} title="黄色" aria-label="黄色"></button>
            <button type="button" className="highlight-color-button" onClick={() => setHighlight('#FFB7B7')} style={{ color: '#FFB7B7' }} title="薄ピンク" aria-label="薄ピンク"></button>
            <button type="button" className="highlight-color-button" onClick={() => setHighlight('#B7E1FF')} style={{ color: '#B7E1FF' }} title="薄青" aria-label="薄青"></button>
            <button type="button" className="highlight-color-button" onClick={() => setHighlight('#C4F0C5')} style={{ color: '#C4F0C5' }} title="薄緑" aria-label="薄緑"></button>
            <button type="button" className="highlight-reset-button" onClick={unsetHighlight} title="ハイライトを取り消す">取消</button>
        </div>
    );
};
