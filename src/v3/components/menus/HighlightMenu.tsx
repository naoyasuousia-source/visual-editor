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
        <div className="highlight-palette" role="group" aria-label="ハイライトカラー" style={{ display: 'flex', gap: '4px', padding: '8px', background: '#fff', border: '1px solid #ddd', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', position: 'absolute', top: '100%', left: 0, zIndex: 100 }}>
            <button type="button" className="highlight-color-button" onClick={() => setHighlight('#FFFF00')} style={{ backgroundColor: '#FFFF00', width: '24px', height: '24px', border: '1px solid #ccc', cursor: 'pointer' }} title="黄色" aria-label="黄色"></button>
            <button type="button" className="highlight-color-button" onClick={() => setHighlight('#FFB7B7')} style={{ backgroundColor: '#FFB7B7', width: '24px', height: '24px', border: '1px solid #ccc', cursor: 'pointer' }} title="薄ピンク" aria-label="薄ピンク"></button>
            <button type="button" className="highlight-color-button" onClick={() => setHighlight('#B7E1FF')} style={{ backgroundColor: '#B7E1FF', width: '24px', height: '24px', border: '1px solid #ccc', cursor: 'pointer' }} title="薄青" aria-label="薄青"></button>
            <button type="button" className="highlight-color-button" onClick={() => setHighlight('#C4F0C5')} style={{ backgroundColor: '#C4F0C5', width: '24px', height: '24px', border: '1px solid #ccc', cursor: 'pointer' }} title="薄緑" aria-label="薄緑"></button>
            <button type="button" className="highlight-reset-button" onClick={unsetHighlight} style={{ padding: '0 8px', fontSize: '12px', cursor: 'pointer', border: '1px solid #ccc', background: '#f0f0f0' }} title="ハイライトを取り消す">取消</button>
        </div>
    );
};
