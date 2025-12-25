import React from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';

interface LinkBubbleMenuProps {
    editor: Editor;
    onEdit: () => void;
}

export const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ editor, onEdit }) => {
    if (!editor) return null;

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
    };

    return (
        <BubbleMenu
            editor={editor}
            shouldShow={({ editor }) => editor.isActive('link')}
            tippyOptions={{ duration: 100 }}
        >
            <div className="image-context-menu open">
                <button type="button" onClick={onEdit}>編集</button>
                <button type="button" onClick={removeLink} className="danger">解除</button>
            </div>
        </BubbleMenu>
    );
};
