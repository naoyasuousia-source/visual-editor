import React from 'react';
import { Editor } from '@tiptap/react';
import { ChevronDown, Check } from 'lucide-react';
import { BaseDropdownMenu, MenuItem } from '@/components/ui/BaseDropdownMenu';

interface WordBlockMenuProps {
    editor: Editor | null;
}

export const WordBlockMenu: React.FC<WordBlockMenuProps> = ({ editor }) => {
    if (!editor) return null;

    const isActive = (type: string, attrs?: Record<string, unknown>) => editor.isActive(type, attrs);

    const blocks = [
        { label: '本文', value: 'p', action: () => editor.chain().focus().setParagraph().run() },
        { label: '見出し1', value: 'h1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
        { label: '見出し2', value: 'h2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { label: '見出し3', value: 'h3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { label: 'サブテキスト', value: 'h6', action: () => editor.chain().focus().toggleHeading({ level: 6 }).run() },
    ];

    const currentBlock = blocks.find(b => {
        if (b.value === 'p') return isActive('paragraph');
        if (b.value.startsWith('h')) return isActive('heading', { level: parseInt(b.value.substring(1)) });
        return false;
    }) || blocks[0];

    return (
        <BaseDropdownMenu
            id="word-block-selector"
            trigger={
                <button
                    type="button"
                    className="h-[36px] px-3 flex items-center gap-2 border border-gray-300 rounded bg-white hover:bg-gray-50 outline-none cursor-pointer min-w-[124px] text-sm font-medium text-gray-700 shadow-sm transition-all"
                >
                    <span className="flex-1 text-left">{currentBlock.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
            }
        >
            <div className="py-1 min-w-[140px]">
                {blocks.map((block) => {
                    const active = (block.value === 'p' && isActive('paragraph')) || 
                                 (block.value.startsWith('h') && isActive('heading', { level: parseInt(block.value.substring(1)) }));
                    
                    return (
                        <MenuItem
                            key={block.value}
                            onSelect={(e) => {
                                e.preventDefault(); // これでメニューが閉じないようにする
                                block.action();
                            }}
                            className="flex items-center justify-between gap-4 px-3 py-2 cursor-pointer hover:bg-blue-50 text-gray-700"
                        >
                            <span className={active ? 'font-bold text-blue-600' : ''}>{block.label}</span>
                            {active && <Check className="w-4 h-4 text-blue-600" />}
                        </MenuItem>
                    );
                })}
            </div>
        </BaseDropdownMenu>
    );
};
