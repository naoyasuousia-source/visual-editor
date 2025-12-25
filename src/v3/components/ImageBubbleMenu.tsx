import React from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';

interface ImageBubbleMenuProps {
    editor: Editor;
    onEditTitle?: () => void;
    onEditCaption?: () => void;
    onEditTag?: () => void;
}

export const ImageBubbleMenu: React.FC<ImageBubbleMenuProps> = ({ editor, onEditTitle, onEditCaption, onEditTag }) => {
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
                <div className="image-context-dropdown">
                    <button type="button" className="image-context-trigger" aria-haspopup="menu" aria-expanded="false">サイズ</button>
                    <div className="image-context-submenu" role="menu">
                        {['xs', 's', 'm', 'l', 'xl'].map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setSize(s)}
                                data-action="image-size"
                                data-size={s}
                                className={editor.getAttributes('image').size === s ? 'active' : ''}
                            >{s.toUpperCase()}</button>
                        ))}
                    </div>
                </div>
                <button type="button" onClick={toggleBorder} data-action="image-border">
                    {editor.getAttributes('image').hasBorder ? '枠線なし' : '枠線あり'}
                </button>
                <button type="button" onClick={onEditTitle} data-action="image-title">タイトル</button>
                <button type="button" onClick={onEditCaption} data-action="image-caption">キャプション</button>
                <button type="button" onClick={onEditTag} data-action="image-tag">タグ</button>
                <button type="button" onClick={removeImage} className="danger" style={{ color: '#dc2626' }}>削除</button>
            </div>
        </BubbleMenu>
    );
};
