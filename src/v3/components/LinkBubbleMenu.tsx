import React from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';
import { Edit2, Link2Off } from 'lucide-react';

interface LinkBubbleMenuProps {
    editor: Editor;
    onEdit: () => void;
}

export const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ editor, onEdit }) => {
    if (!editor) return null;

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
    };

    const btnCls = "flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 text-sm transition-colors whitespace-nowrap text-gray-700";

    return (
        <BubbleMenu
            editor={editor}
            shouldShow={({ editor }) => editor.isActive('link')}
            tippyOptions={{ duration: 100 }}
        >
            <div className="bg-white border border-gray-300 shadow-xl rounded-lg py-1 flex items-center divide-x divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
                <button type="button" className={btnCls} onClick={onEdit}>
                    <Edit2 className="w-4 h-4 text-blue-500" />
                    <span>編集</span>
                </button>
                <button type="button" className={`${btnCls} text-red-600 hover:bg-red-50`} onClick={removeLink}>
                    <Link2Off className="w-4 h-4" />
                    <span>解除</span>
                </button>
            </div>
        </BubbleMenu>
    );
};
