import React from 'react';
import { Editor } from '@tiptap/react';
import { 
    Baseline, 
    Type, 
    ChevronDown 
} from 'lucide-react';
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
 * フォントメニュー（ビジュアル・直感UI版）
 */
export const FontMenu: React.FC<FontMenuProps> = ({ editor }) => {
    if (!editor) return null;

    const boxBase = "flex items-center justify-center rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all cursor-pointer outline-none bg-white";
    
    const getCurrentBlockLabel = () => {
        if (editor.isActive('heading', { level: 1 })) return '見出し1';
        if (editor.isActive('heading', { level: 2 })) return '見出し2';
        if (editor.isActive('heading', { level: 3 })) return '見出し3';
        if (editor.isActive('heading', { level: 6 })) return 'サブテキスト';
        return '本文';
    };

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
            <div className="flex items-center gap-1.5 p-1.5 bg-white rounded shadow-sm">
                {/* ブロック要素選択 */}
                <SubMenu
                    hideChevron
                    className="p-0 border-none hover:bg-transparent"
                    trigger={
                        <div className={`${boxBase} min-w-[80px] h-10 px-3 justify-between gap-2`} title="ブロックスタイル">
                            <span className="text-[13px] font-bold text-gray-700">{getCurrentBlockLabel()}</span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </div>
                    }
                >
                    <MenuItem onSelect={() => editor.chain().focus().setParagraph().run()}>段落 (本文)</MenuItem>
                    <MenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>見出し 1</MenuItem>
                    <MenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>見出し 2</MenuItem>
                    <MenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>見出し 3</MenuItem>
                    <MenuItem onSelect={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}>サブテキスト (H6)</MenuItem>
                </SubMenu>

                {/* 文字色 */}
                <SubMenu
                    hideChevron
                    className="p-0 border-none hover:bg-transparent"
                    trigger={
                        <div className={`${boxBase} w-10 h-10`} title="文字色">
                            <div className="relative">
                                <Baseline className="w-5 h-5" />
                                <div 
                                    className="absolute -bottom-1 left-0 right-0 h-1 rounded-full" 
                                    style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000' }}
                                />
                            </div>
                        </div>
                    }
                >
                    <div className="py-1 min-w-[120px]">
                        {colors.map(color => (
                            <MenuItem 
                                key={color.value}
                                onSelect={() => editor.chain().focus().setColor(color.value).run()}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: color.value }} />
                                    <span>{color.name}</span>
                                </div>
                            </MenuItem>
                        ))}
                        <div className="h-px bg-gray-100 my-1" />
                        <MenuItem onSelect={() => editor.chain().focus().unsetColor().run()}>色をリセット</MenuItem>
                    </div>
                </SubMenu>

                {/* フォントファミリー */}
                <SubMenu
                    hideChevron
                    className="p-0 border-none hover:bg-transparent"
                    trigger={
                        <div className={`${boxBase} w-10 h-10`} title="フォントファミリー">
                            <Type className="w-5 h-5" />
                        </div>
                    }
                >
                    <div className="py-1 max-h-[300px] overflow-y-auto">
                        {fontFamilies.map(font => (
                            <MenuItem 
                                key={font.value}
                                onSelect={() => editor.chain().focus().setFontFamily(font.value).run()}
                            >
                                <span style={{ fontFamily: font.value }} className="text-[13px]">{font.name}</span>
                            </MenuItem>
                        ))}
                    </div>
                </SubMenu>
            </div>
        </BaseDropdownMenu>
    );
};
