import React from 'react';
import { Editor } from '@tiptap/react';

interface ParagraphMenuProps {
    editor: Editor;
}

export const ParagraphMenu: React.FC<ParagraphMenuProps> = ({ editor }) => {
    const setAlign = (align: string) => {
        editor.chain().focus().updateAttributes('paragraph', { align }).run();
        editor.chain().focus().updateAttributes('heading', { align }).run();
    };

    const setSpacing = (spacing: string) => {
        editor.chain().focus().updateAttributes('paragraph', { spacing }).run();
        editor.chain().focus().updateAttributes('heading', { spacing }).run();
    };

    const setLineHeight = (lineHeight: string) => {
        // Line height could also be a custom attribute in StyleAttributes
        editor.chain().focus().updateAttributes('paragraph', { lineHeight }).run();
    };

    const adjustIndent = (delta: number) => {
        const current = editor.getAttributes('paragraph').indent || 0;
        const next = Math.max(0, current + delta);
        editor.chain().focus().updateAttributes('paragraph', { indent: next }).run();
    };

    const toggleHanging = () => {
        const current = editor.getAttributes('paragraph').hanging;
        editor.chain().focus().updateAttributes('paragraph', { hanging: !current }).run();
    };

    return (
        <div className="paragraph-panel open" role="menu">
            <div className="paragraph-submenu" data-submenu="align">
                <button type="button" className="paragraph-submenu-trigger" title="配置">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                    </svg>
                </button>
                <div className="paragraph-submenu-panel" role="menu">
                    <div className="align-buttons">
                        <button type="button" className="align-icon-button" onClick={() => setAlign('left')} title="左揃え">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="15" y1="10" x2="3" y2="10"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
                        </button>
                        <button type="button" className="align-icon-button" onClick={() => setAlign('center')} title="中央揃え">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="17" y1="10" x2="7" y2="10"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="7" y2="18"></line></svg>
                        </button>
                        <button type="button" className="align-icon-button" onClick={() => setAlign('right')} title="右揃え">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="10" x2="9" y2="10"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="paragraph-submenu" data-submenu="spacing">
                <button type="button" className="paragraph-submenu-trigger" title="段落下の余白">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 18h16M12 9v6M9 12l3 3 3-3" /></svg>
                </button>
                <div className="paragraph-submenu-panel" role="menu">
                    <div className="spacing-buttons">
                        {['xs', 's', 'm', 'l', 'xl'].map(size => (
                            <button key={size} type="button" className="spacing-button" onClick={() => setSpacing(size)}>{size.toUpperCase()}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="paragraph-submenu" data-submenu="line-height">
                <button type="button" className="paragraph-submenu-trigger" title="行間">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11 6h11v2H11zm0 5h11v2H11zm0 5h11v2H11zM6 3L3 6h2v12H3l3 3 3-3H7V6h2z" /></svg>
                </button>
                <div className="paragraph-submenu-panel" role="menu">
                    <div className="spacing-buttons">
                        {['s', 'm', 'l'].map(size => (
                            <button key={size} type="button" className="spacing-button" onClick={() => setLineHeight(size)}>{size.toUpperCase()}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="paragraph-submenu" data-submenu="indent">
                <button type="button" className="paragraph-submenu-trigger" title="インデント">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 4h18v2H3zm0 14h18v2H3zm8-9h10v2H11zm0 4h10v2H11zM5 8v8l5-4z" /></svg>
                </button>
                <div className="paragraph-submenu-panel" role="menu">
                    <div className="spacing-buttons">
                        <button type="button" className="spacing-button" onClick={() => adjustIndent(1)}>＋</button>
                        <button type="button" className="spacing-button" onClick={() => adjustIndent(-1)}>ー</button>
                    </div>
                    <div className="indent-option">
                        <label>
                            <input
                                type="checkbox"
                                checked={!!editor.getAttributes('paragraph').hanging}
                                onChange={toggleHanging}
                            /> ぶら下げ
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};
