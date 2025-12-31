import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { 
    ChevronDown 
} from 'lucide-react';
import { BaseDropdownMenu, MenuItem, MenuSeparator } from '@/components/ui/BaseDropdownMenu';

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
    const [expanded, setExpanded] = useState<'style' | 'color' | 'family' | null>(null);

    if (!editor) return null;

    const boxBase = "flex items-center justify-center rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all cursor-pointer outline-none bg-white m-0 min-w-[32px] h-8 px-1";
    const activeBox = "border-blue-500 bg-blue-50 text-blue-600";
    
    const getCurrentBlockLabel = () => {
        if (editor.isActive('heading', { level: 1 })) return '見出し1';
        if (editor.isActive('heading', { level: 2 })) return '見出し2';
        if (editor.isActive('heading', { level: 3 })) return '見出し3';
        if (editor.isActive('heading', { level: 6 })) return 'サブテキスト';
        return '本文';
    };

    const toggleExpanded = (section: 'style' | 'color' | 'family') => {
        setExpanded(expanded === section ? null : section);
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
            <div className="flex flex-col min-w-[150px]">
                {/* アイコンストリップ */}
                <div className="flex items-center gap-1.5 p-1">
                    {/* ブロック要素選択 */}
                    <button
                        type="button"
                        onClick={() => toggleExpanded('style')}
                        className={`${boxBase} px-2 justify-between gap-1.5 ${expanded === 'style' ? activeBox : ''}`}
                        title="ブロックスタイル"
                    >
                        <span className="text-[12px] font-bold leading-none">{getCurrentBlockLabel()}</span>
                        <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${expanded === 'style' ? 'rotate-180' : ''}`} />
                    </button>

                    {/* 文字色 */}
                    <button
                        type="button"
                        onClick={() => toggleExpanded('color')}
                        className={`${boxBase} ${expanded === 'color' ? activeBox : ''}`}
                        title="文字色"
                    >
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-lg font-serif font-bold -mb-1 mt-0.5 leading-none">A</span>
                            <div 
                                className="w-3.5 h-[2.5px] rounded-full" 
                                style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000' }}
                            />
                        </div>
                    </button>

                    {/* フォントファミリー */}
                    <button
                        type="button"
                        onClick={() => toggleExpanded('family')}
                        className={`${boxBase} px-2 justify-between gap-1.5 min-w-[80px] ${expanded === 'family' ? activeBox : ''}`}
                        title="フォントファミリー"
                    >
                        <span className="text-[12px] font-bold leading-none truncate max-w-[80px]">
                            {fontFamilies.find(f => f.value === editor.getAttributes('textStyle').fontFamily)?.name || 'フォント'}
                        </span>
                        <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${expanded === 'family' ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* 展開されたコンテンツ */}
                {expanded && <MenuSeparator />}
                
                <div className="overflow-hidden transition-all">
                    {expanded === 'style' && (
                        <div className="py-1">
                            <MenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().setParagraph().run(); }}>本文</MenuItem>
                            <MenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run(); }}>見出し 1</MenuItem>
                            <MenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}>見出し 2</MenuItem>
                            <MenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}>見出し 3</MenuItem>
                            <MenuItem onSelect={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 6 }).run(); }}>サブテキスト</MenuItem>
                        </div>
                    )}

                    {expanded === 'color' && (
                        <div className="py-1 min-w-[140px]">
                            {colors.map(color => (
                                <MenuItem 
                                    key={color.value}
                                    onSelect={(e) => { e.preventDefault(); editor.chain().focus().setColor(color.value).run(); }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: color.value }} />
                                        <span>{color.name}</span>
                                    </div>
                                </MenuItem>
                            ))}
                        </div>
                    )}

                    {expanded === 'family' && (
                        <div className="py-1 max-h-[250px] overflow-y-auto">
                            {fontFamilies.map(font => (
                                <MenuItem 
                                    key={font.value}
                                    onSelect={(e) => { e.preventDefault(); editor.chain().focus().setFontFamily(font.value).run(); }}
                                >
                                    <span style={{ fontFamily: font.value }} className="text-[13px]">{font.name}</span>
                                </MenuItem>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </BaseDropdownMenu>
    );
};
