import React from 'react';
import { Editor } from '@tiptap/react';

interface FontMenuProps {
    editor: Editor;
}

export const FontMenu: React.FC<FontMenuProps> = ({ editor }) => {
    const setBlock = (type: string, level?: number) => {
        if (type === 'paragraph') {
            editor.chain().focus().setParagraph().run();
        } else if (type === 'heading' && level) {
            editor.chain().focus().toggleHeading({ level: level as any }).run();
        }
    };

    const setColor = (color: string) => {
        editor.chain().focus().setColor(color).run();
    };

    return (
        <div className="font-chooser-panel open" role="menu">
            <div className="font-submenu" data-submenu="block-element">
                <button type="button" className="font-submenu-trigger">本文 ▾</button>
                <div className="font-submenu-panel" role="menu">
                    <button type="button" onClick={() => setBlock('paragraph')}>本文</button>
                    <button type="button" onClick={() => setBlock('heading', 1)}>見出し1</button>
                    <button type="button" onClick={() => setBlock('heading', 2)}>見出し2</button>
                    <button type="button" onClick={() => setBlock('heading', 3)}>見出し3</button>
                </div>
            </div>

            <div className="font-submenu" data-submenu="font-color">
                <button type="button" className="font-submenu-trigger" title="文字色">
                    <div className="color-preview" style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000' }}></div>
                </button>
                <div className="font-submenu-panel color-grid" role="menu">
                    {['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                        <button
                            key={color}
                            type="button"
                            className="color-swatch"
                            style={{ backgroundColor: color }}
                            onClick={() => setColor(color)}
                        />
                    ))}
                </div>
            </div>

            <div className="font-submenu" data-submenu="font-family">
                <button type="button" className="font-submenu-trigger">Font ▾</button>
                <div className="font-submenu-panel" role="menu">
                    <button type="button" onClick={() => editor.chain().focus().unsetFontFamily().run()}>デフォルト</button>
                    {/* ... フォントファミリーの追加 */}
                </div>
            </div>
        </div>
    );
};
