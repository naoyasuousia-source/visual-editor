import React from 'react';
import { Editor } from '@tiptap/react';
import { 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    ChevronRight,
    MoveVertical,
    Indent as IndentIcon,
    Outdent,
    ArrowDownWideNarrow,
    Check
} from 'lucide-react';

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

    const itemCls = "w-full text-left px-4 py-1.5 hover:bg-gray-100 flex justify-between items-center text-sm transition-colors group relative";
    const subMenuCls = "absolute left-full top-0 ml-0.5 bg-white border border-gray-300 shadow-xl rounded py-1 min-w-[120px] hidden group-hover:flex flex-col z-[2100]";
    const iconBtnCls = "p-2 hover:bg-gray-200 rounded transition-colors flex-1 flex justify-center items-center";

    return (
        <div className="bg-white border border-gray-300 shadow-xl rounded py-1 min-w-[200px] z-[2001] flex flex-col animate-in fade-in zoom-in-95 duration-100">
            {/* Alignment Row */}
            <div className="px-3 py-2 border-b border-gray-100 flex gap-1">
                <button type="button" className={`${iconBtnCls} ${editor.isActive({ align: 'left' }) ? 'bg-gray-200' : ''}`} onClick={() => setAlign('left')} title="左揃え"><AlignLeft className="w-4 h-4" /></button>
                <button type="button" className={`${iconBtnCls} ${editor.isActive({ align: 'center' }) ? 'bg-gray-200' : ''}`} onClick={() => setAlign('center')} title="中央揃え"><AlignCenter className="w-4 h-4" /></button>
                <button type="button" className={`${iconBtnCls} ${editor.isActive({ align: 'right' }) ? 'bg-gray-200' : ''}`} onClick={() => setAlign('right')} title="右揃え"><AlignRight className="w-4 h-4" /></button>
            </div>

            {/* Spacing */}
            <div className={itemCls}>
                <div className="flex items-center gap-2">
                    <ArrowDownWideNarrow className="w-4 h-4 text-gray-500" />
                    <span>段落下の余白</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <div className={subMenuCls}>
                    {['xs', 's', 'm', 'l', 'xl'].map(size => (
                        <button 
                            key={size} 
                            type="button" 
                            className="px-4 py-1.5 hover:bg-gray-100 text-xs text-left flex justify-between items-center" 
                            onClick={() => setSpacing(size)}
                        >
                            {size.toUpperCase()}
                            {editor.getAttributes('paragraph').spacing === size && <Check className="w-3 h-3 text-blue-500" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Line Height */}
            <div className={itemCls}>
                <div className="flex items-center gap-2">
                    <MoveVertical className="w-4 h-4 text-gray-500" />
                    <span>行間</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <div className={subMenuCls}>
                    {['s', 'm', 'l'].map(size => (
                        <button 
                            key={size} 
                            type="button" 
                            className="px-4 py-1.5 hover:bg-gray-100 text-xs text-left flex justify-between items-center" 
                            onClick={() => setLineHeight(size)}
                        >
                            {size.toUpperCase()}
                            {editor.getAttributes('paragraph').lineHeight === size && <Check className="w-3 h-3 text-blue-500" />}
                        </button>
                    ))}
                </div>
            </div>

            <hr className="my-1 border-gray-100" />

            {/* Indent Actions */}
            <button type="button" className={itemCls} onClick={() => adjustIndent(1)}>
                <div className="flex items-center gap-2">
                    <IndentIcon className="w-4 h-4 text-gray-500" />
                    <span>インデントを増やす</span>
                </div>
            </button>
            <button type="button" className={itemCls} onClick={() => adjustIndent(-1)}>
                <div className="flex items-center gap-2">
                    <Outdent className="w-4 h-4 text-gray-500" />
                    <span>インデントを減らす</span>
                </div>
            </button>

            <label className={`${itemCls} cursor-pointer`}>
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={!!editor.getAttributes('paragraph').hanging}
                        onChange={toggleHanging}
                    />
                    <span>ぶら下げインデント</span>
                </div>
            </label>
        </div>
    );
};
