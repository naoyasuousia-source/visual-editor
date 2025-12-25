import React from 'react';
import { BubbleMenu, Editor } from '@tiptap/react';
import { 
    Maximize, 
    Square, 
    Type, 
    MessageSquare, 
    Tag, 
    Trash2, 
    ChevronRight,
    Check
} from 'lucide-react';

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

    const btnCls = "flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 text-sm transition-colors whitespace-nowrap";
    const subMenuBtnCls = "w-full text-left px-4 py-1.5 hover:bg-gray-100 flex justify-between items-center text-xs transition-colors";

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
            <div className="bg-white border border-gray-300 shadow-xl rounded-lg py-1 flex items-center divide-x divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
                {/* Size Dropdown */}
                <div className="relative group">
                    <button type="button" className={btnCls}>
                        <Maximize className="w-4 h-4 text-gray-500" />
                        <span>サイズ</span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                    </button>
                    <div className="absolute left-0 top-full mt-0.5 bg-white border border-gray-300 shadow-xl rounded py-1 min-w-[100px] hidden group-hover:flex flex-col z-[2100]">
                        {['xs', 's', 'm', 'l', 'xl'].map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setSize(s)}
                                className={subMenuBtnCls}
                            >
                                {s.toUpperCase()}
                                {editor.getAttributes('image').size === s && <Check className="w-3 h-3 text-blue-500" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center">
                    <button type="button" className={btnCls} onClick={toggleBorder} title="枠線切替">
                        <Square className={`w-4 h-4 ${editor.getAttributes('image').hasBorder ? 'fill-blue-100 stroke-blue-600' : 'text-gray-500'}`} />
                        <span>枠線</span>
                    </button>
                    <button type="button" className={btnCls} onClick={onEditTitle} title="タイトル編集">
                        <Type className="w-4 h-4 text-gray-500" />
                        <span>タイトル</span>
                    </button>
                    <button type="button" className={btnCls} onClick={onEditCaption} title="キャプション編集">
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span>キャプション</span>
                    </button>
                    <button type="button" className={btnCls} onClick={onEditTag} title="タグ編集">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <span>タグ</span>
                    </button>
                </div>

                <button type="button" className={`${btnCls} text-red-600 hover:bg-red-50`} onClick={removeImage}>
                    <Trash2 className="w-4 h-4" />
                    <span>削除</span>
                </button>
            </div>
        </BubbleMenu>
    );
};
