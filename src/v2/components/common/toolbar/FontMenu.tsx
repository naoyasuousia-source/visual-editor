import React from 'react';
import { Editor } from '@tiptap/react';
import { ChevronDown } from 'lucide-react';
import { BaseDropdownMenu, MenuItem, SubMenu } from '../../ui/BaseDropdownMenu';

interface FontMenuProps {
    editor: Editor | null;
}

const fonts = [
    'serif',
    'sans-serif', 
    'monospace',
    'cursive',
    'fantasy',
    'system-ui',
    'ui-serif',
    'ui-sans-serif',
    'ui-monospace',
    'ui-rounded'
];

const colors = [
    { name: '黒', value: '#000000' },
    { name: '赤', value: '#ff0000' },
    { name: '青', value: '#0000ff' },
    { name: '緑', value: '#008000' },
    { name: 'オレンジ', value: '#ffa500' },
    { name: '紫', value: '#800080' }
];

/**
 * フォントメニュー（Radix UI版）
 * 
 * 【改善点】
 * - Radix Dropdown Menuで完全置き換え
 * - ロジックはすべてTiptapのコマンドを使用
 * - 直接DOM操作なし
 */
export const FontMenu: React.FC<FontMenuProps> = ({ editor }) => {
    if (!editor) return null;

    return (
        <BaseDropdownMenu
            trigger={
                <button
                    type="button"
                    className="px-2 py-1 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center gap-1 text-sm h-[32px]"
                >
                    フォント <ChevronDown className="w-3 h-3" />
                </button>
            }
        >
            <SubMenu trigger="ブロック要素">
                <MenuItem onSelect={() => editor.chain().focus().setParagraph().run()}>
                    段落
                </MenuItem>
                <MenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                    見出し1
                </MenuItem>
                <MenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                    見出し2
                </MenuItem>
                <MenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                    見出し3
                </MenuItem>
                <MenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
                    見出し4
                </MenuItem>
                <MenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}>
                    見出し5
                </MenuItem>
                <MenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}>
                    見出し6
                </MenuItem>
            </SubMenu>

            <SubMenu trigger="文字色">
                {colors.map(color => (
                    <MenuItem 
                        key={color.value}
                        onSelect={() => editor.chain().focus().setColor(color.value).run()}
                    >
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-4 h-4 rounded border border-gray-300" 
                                style={{ backgroundColor: color.value }}
                            />
                            <span>{color.name}</span>
                        </div>
                    </MenuItem>
                ))}
            </SubMenu>

            <SubMenu trigger="フォントファミリー">
                {fonts.map(font => (
                    <MenuItem 
                        key={font}
                        onSelect={() => editor.chain().focus().setFontFamily(font).run()}
                    >
                        <span style={{ fontFamily: font }}>{font}</span>
                    </MenuItem>
                ))}
            </SubMenu>
        </BaseDropdownMenu>
    );
};
