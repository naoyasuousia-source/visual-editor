import React from 'react';
import { Editor } from '@tiptap/react';
import { ChevronDown } from 'lucide-react';
import { BaseDropdownMenu, MenuItem, SubMenu } from '@/components/ui/BaseDropdownMenu';

interface FontMenuProps {
    editor: Editor | null;
}

const fontFamilies = [
    { name: '游ゴシック', value: '"Yu Gothic", "YuGothic", sans-serif' },
    { name: '游明朝', value: '"Yu Mincho", "YuMincho", serif' },
    { name: 'メイリオ', value: 'Meiryo, sans-serif' },
    { name: 'BIZ UDゴシック', value: '"BIZ UDGothic", "BIZ UDゴシック", sans-serif' },
    { name: 'BIZ UD明朝', value: '"BIZ UDMincho", "BIZ UD明朝", serif' },
    { name: 'Noto Sans JP', value: '"Noto Sans JP", sans-serif' },
    { name: 'Noto Serif JP', value: '"Noto Serif JP", serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Courier New', value: '"Courier New", monospace' },
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
 */
export const FontMenu: React.FC<FontMenuProps> = ({ editor }) => {
    if (!editor) return null;

    return (
        <BaseDropdownMenu
            id="font"
            trigger={
                <button
                    type="button"
                    className="px-2 py-1 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center gap-1 text-sm h-[36px]"
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
                <MenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}>
                    サブテキスト
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
                <div className="flex flex-col gap-1 p-1">
                    {fontFamilies.map(font => (
                        <MenuItem 
                            key={font.value}
                            onSelect={() => editor.chain().focus().setFontFamily(font.value).run()}
                            className="px-2 py-1.5 outline-none rounded hover:bg-gray-100 cursor-default"
                        >
                            <span 
                                className="text-[13px] text-gray-700"
                                style={{ fontFamily: font.value }}
                            >
                                {font.name}
                            </span>
                        </MenuItem>
                    ))}
                </div>
            </SubMenu>
        </BaseDropdownMenu>
    );
};
