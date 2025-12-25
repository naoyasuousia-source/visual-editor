import React from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';

interface ImageBubbleMenuProps {
    editor: Editor;
}

export const ImageBubbleMenu: React.FC<ImageBubbleMenuProps> = ({ editor }) => {
    if (!editor) return null;

    const setSize = (size: string) => {
        editor.chain().focus().updateAttributes('image', { size }).run();
    };

    const toggleBorder = () => {
        const isBordered = editor.getAttributes('image').hasBorder;
        editor.chain().focus().updateAttributes('image', { hasBorder: !isBordered }).run();
    };

    const removeImage = () => {
        editor.chain().focus().deleteSelection().run();
    };

    return (
        <BubbleMenu
            editor={editor}
            shouldShow={({ editor }) => editor.isActive('image')}
            tippyOptions={{
                duration: 100,
                placement: 'bottom',
                offset: [0, 10],
            }}
        >
            <div className="image-context-menu open">
                <div className="menu-group">
                    {['xs', 's', 'm', 'l', 'xl'].map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setSize(s)}
                            className={editor.getAttributes('image').size === s ? 'active' : ''}
                        >{s.toUpperCase()}</button>
                    ))}
                </div>
                <div className="menu-separator"></div>
                <button type="button" onClick={toggleBorder}>
                    {editor.getAttributes('image').hasBorder ? '枠線なし' : '枠線あり'}
                </button>
                <button type="button" onClick={removeImage} className="danger">削除</button>
            </div>
        </BubbleMenu>
    );
};
