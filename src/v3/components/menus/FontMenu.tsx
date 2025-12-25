import React, { useState } from 'react';
import { Editor } from '@tiptap/react';

interface FontMenuProps {
    editor: Editor;
}

export const FontMenu: React.FC<FontMenuProps> = ({ editor }) => {
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

    const setBlock = (type: string, level?: number) => {
        if (type === 'paragraph') {
            editor.chain().focus().setParagraph().run();
        } else if (type === 'heading' && level) {
            editor.chain().focus().toggleHeading({ level: level as any }).run();
        }
        setActiveSubmenu(null);
    };

    const setColor = (color: string) => {
        editor.chain().focus().setColor(color).run();
        setActiveSubmenu(null);
    };

    const setFontFamily = (fontFamily: string) => {
        (editor.chain().focus() as any).setFontFamily(fontFamily).run();
        setActiveSubmenu(null);
    };

    const toggleSubmenu = (submenu: string) => {
        setActiveSubmenu(activeSubmenu === submenu ? null : submenu);
    };

    const handleMouseEnter = (submenu: string) => {
        setActiveSubmenu(submenu);
    };

    // Close menu when clicking outside - handled by global click listener in parent or App ideally,
    // but for now relying on hover/toggle logic.

    return (
        <div className="font-chooser-panel open" role="menu">
            <div
                className={`font-submenu ${activeSubmenu === 'block-element' ? 'is-open' : ''}`}
                data-submenu="block-element"
                onMouseEnter={() => handleMouseEnter('block-element')}
            >
                <button
                    type="button"
                    className="font-submenu-trigger"
                    aria-haspopup="true"
                    aria-expanded={activeSubmenu === 'block-element'}
                    title="ブロック要素"
                    onClick={() => toggleSubmenu('block-element')}
                >
                    <span className="current-block-label" style={{ fontSize: '12px', marginRight: '4px' }}>本文</span>
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
                        <path d="M7 10l5 5 5-5z" />
                    </svg>
                </button>
                <div className="font-submenu-panel" role="menu">
                    <button type="button" onClick={() => setBlock('paragraph')}>本文</button>
                    <button type="button" onClick={() => setBlock('heading', 1)}>見出し1</button>
                    <button type="button" onClick={() => setBlock('heading', 2)}>見出し2</button>
                    <button type="button" onClick={() => setBlock('heading', 3)}>見出し3</button>
                </div>
            </div>

            <div
                className={`font-submenu ${activeSubmenu === 'font-color' ? 'is-open' : ''}`}
                data-submenu="font-color"
                onMouseEnter={() => handleMouseEnter('font-color')}
            >
                <button
                    type="button"
                    className="font-submenu-trigger"
                    title="フォントカラー"
                    aria-haspopup="true"
                    aria-expanded={activeSubmenu === 'font-color'}
                    onClick={() => toggleSubmenu('font-color')}
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2 5 17h2l1-4h8l1 4h2L12 2zm-3 11 3-8 3 8H9z" />
                        <path d="M2 21h20" strokeWidth="3" stroke="#D92C2C" />
                    </svg>
                </button>
                <div className="font-submenu-panel" role="menu">
                    <div className="color-palette" role="group" aria-label="フォントカラー">
                        <button type="button" className="color-swatch-button" data-action="font-color-default" title="デフォルトカラー" aria-label="デフォルトカラー" style={{ color: '#000000' }} onClick={() => setColor('#000000')}></button>
                        <button type="button" className="color-swatch-button" data-action="font-color-swatch" data-color="#D92C2C" style={{ color: '#D92C2C' }} title="#D92C2C" aria-label="#D92C2C" onClick={() => setColor('#D92C2C')}></button>
                        <button type="button" className="color-swatch-button" data-action="font-color-swatch" data-color="#E67F22" style={{ color: '#E67F22' }} title="#E67F22" aria-label="#E67F22" onClick={() => setColor('#E67F22')}></button>
                        <button type="button" className="color-swatch-button" data-action="font-color-swatch" data-color="#2E86C1" style={{ color: '#2E86C1' }} title="#2E86C1" aria-label="#2E86C1" onClick={() => setColor('#2E86C1')}></button>
                        <button type="button" className="color-swatch-button" data-action="font-color-swatch" data-color="#1F618D" style={{ color: '#1F618D' }} title="#1F618D" aria-label="#1F618D" onClick={() => setColor('#1F618D')}></button>
                        <button type="button" className="color-swatch-button" data-action="font-color-swatch" data-color="#17A589" style={{ color: '#17A589' }} title="#17A589" aria-label="#17A589" onClick={() => setColor('#17A589')}></button>
                        <button type="button" className="color-swatch-button" data-action="font-color-swatch" data-color="#7D3C98" style={{ color: '#7D3C98' }} title="#7D3C98" aria-label="#7D3C98" onClick={() => setColor('#7D3C98')}></button>
                    </div>
                </div>
            </div>

            <div
                className={`font-submenu ${activeSubmenu === 'font-family' ? 'is-open' : ''}`}
                data-submenu="font-family"
                onMouseEnter={() => handleMouseEnter('font-family')}
            >
                <button
                    type="button"
                    className="font-submenu-trigger"
                    aria-haspopup="true"
                    aria-expanded={activeSubmenu === 'font-family'}
                    title="フォントファミリー"
                    onClick={() => toggleSubmenu('font-family')}
                >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <text x="10" y="20" fontFamily="sans-serif" fontSize="20" fontWeight="bold" fill="currentColor" stroke="none" opacity="0.4">A</text>
                        <text x="2" y="20" fontFamily="serif" fontSize="20" fontWeight="bold" fill="currentColor" stroke="none">A</text>
                    </svg>
                </button>
                <div className="font-submenu-panel" role="menu">
                    <div className="font-family-list">
                        <button type="button" className="font-family-option" data-family="'Yu Gothic', '游ゴシック体', sans-serif" style={{ fontFamily: "'Yu Gothic', '游ゴシック体', sans-serif" }} onClick={() => setFontFamily("'Yu Gothic', '游ゴシック体', sans-serif")}>游ゴシック</button>
                        <button type="button" className="font-family-option" data-family="'Yu Mincho', '游明朝', serif" style={{ fontFamily: "'Yu Mincho', '游明朝', serif" }} onClick={() => setFontFamily("'Yu Mincho', '游明朝', serif")}>游明朝</button>
                        <button type="button" className="font-family-option" data-family="'Meiryo', 'メイリオ', sans-serif" style={{ fontFamily: "'Meiryo', 'メイリオ', sans-serif" }} onClick={() => setFontFamily("'Meiryo', 'メイリオ', sans-serif")}>メイリオ</button>
                        <button type="button" className="font-family-option" data-family="'BIZ UDGothic', 'BIZ UDゴシック', sans-serif" style={{ fontFamily: "'BIZ UDGothic', 'BIZ UDゴシック', sans-serif" }} onClick={() => setFontFamily("'BIZ UDGothic', 'BIZ UDゴシック', sans-serif")}>BIZ UDゴシック</button>
                        <button type="button" className="font-family-option" data-family="'BIZ UDMincho', 'BIZ UD明朝', serif" style={{ fontFamily: "'BIZ UDMincho', 'BIZ UD明朝', serif" }} onClick={() => setFontFamily("'BIZ UDMincho', 'BIZ UD明朝', serif")}>BIZ UD明朝</button>
                        <button type="button" className="font-family-option" data-family="'Noto Sans JP', sans-serif" style={{ fontFamily: "'Noto Sans JP', sans-serif" }} onClick={() => setFontFamily("'Noto Sans JP', sans-serif")}>Noto Sans JP</button>
                        <button type="button" className="font-family-option" data-family="'Noto Serif JP', serif" style={{ fontFamily: "'Noto Serif JP', serif" }} onClick={() => setFontFamily("'Noto Serif JP', serif")}>Noto Serif JP</button>
                        <button type="button" className="font-family-option" data-family="'Arial', sans-serif" style={{ fontFamily: "'Arial', sans-serif" }} onClick={() => setFontFamily("'Arial', sans-serif")}>Arial</button>
                        <button type="button" className="font-family-option" data-family="'Times New Roman', serif" style={{ fontFamily: "'Times New Roman', serif" }} onClick={() => setFontFamily("'Times New Roman', serif")}>Times New Roman</button>
                        <button type="button" className="font-family-option" data-family="'Courier New', monospace" style={{ fontFamily: "'Courier New', monospace" }} onClick={() => setFontFamily("'Courier New', monospace")}>Courier New</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
