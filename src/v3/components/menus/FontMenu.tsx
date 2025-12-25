import React from 'react';
import { Editor } from '@tiptap/react';
import { 
    Heading1, 
    Heading2, 
    Heading3, 
    Text, 
    Baseline, 
    ChevronRight,
    Type,
    Check
} from 'lucide-react';

interface FontMenuProps {
    editor: Editor;
}

export const FontMenu: React.FC<FontMenuProps> = ({ editor }) => {
    const setBlock = (type: string, level?: number) => {
        if (type === 'paragraph') {
            editor.chain().focus().setParagraph().run();
        } else if (type === 'heading' && level) {
            editor.chain().focus().toggleHeading({ level: level as any }).run();
        }
    };

    const setColor = (color: string) => {
        editor.chain().focus().setColor(color).run();
    };

    const setFontFamily = (fontFamily: string) => {
        editor.chain().focus().setFontFamily(fontFamily).run();
    };

    const getBlockLabel = () => {
        if (editor.isActive('heading', { level: 1 })) return '見出し１';
        if (editor.isActive('heading', { level: 2 })) return '見出し２';
        if (editor.isActive('heading', { level: 3 })) return '見出し３';
        if (editor.isActive('heading', { level: 6 })) return 'サブテキスト';
        return '本文';
    };

    const colors = [
        '#000000', '#D92C2C', '#E67F22', '#F1C40F', '#27AE60', 
        '#2E86C1', '#1F618D', '#7D3C98', '#95A5A6', '#FFFFFF'
    ];

    const fonts = [
        { label: '游ゴシック', value: "'Yu Gothic', '游ゴシック体', sans-serif" },
        { label: '游明朝', value: "'Yu Mincho', '游明朝', serif" },
        { label: 'メイリオ', value: "'Meiryo', 'メイリオ', sans-serif" },
        { label: 'BIZ UDゴシック', value: "'BIZ UDGothic', 'BIZ UDゴシック', sans-serif" },
        { label: 'BIZ UD明朝', value: "'BIZ UDMincho', 'BIZ UD明朝', serif" },
        { label: 'Noto Sans JP', value: "'Noto Sans JP', sans-serif" },
        { label: 'Arial', value: "Arial, sans-serif" },
        { label: 'Times New Roman', value: "'Times New Roman', serif" },
    ];

    const itemCls = "w-full text-left px-4 py-1.5 hover:bg-gray-100 flex justify-between items-center text-sm transition-colors group relative";
    const subMenuCls = "absolute left-full top-0 ml-0.5 bg-white border border-gray-300 shadow-xl rounded py-1 min-w-[140px] hidden group-hover:flex flex-col z-[2100]";

    return (
        <div className="bg-white border border-gray-300 shadow-xl rounded py-1 min-w-[220px] z-[2001] flex flex-col animate-in fade-in zoom-in-95 duration-100">
            {/* Block Elements */}
            <div className={itemCls}>
                <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-gray-500" />
                    <span>スタイル: {getBlockLabel()}</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <div className={subMenuCls}>
                    <button type="button" className={itemCls} onClick={() => setBlock('heading', 1)}>
                        <div className="flex items-center gap-2"><Heading1 className="w-4 h-4" /> 見出し１</div>
                    </button>
                    <button type="button" className={itemCls} onClick={() => setBlock('heading', 2)}>
                        <div className="flex items-center gap-2"><Heading2 className="w-4 h-4" /> 見出し２</div>
                    </button>
                    <button type="button" className={itemCls} onClick={() => setBlock('heading', 3)}>
                        <div className="flex items-center gap-2"><Heading3 className="w-4 h-4" /> 見出し３</div>
                    </button>
                    <button type="button" className={itemCls} onClick={() => setBlock('paragraph')}>
                        <div className="flex items-center gap-2"><Text className="w-4 h-4" /> 本文</div>
                    </button>
                </div>
            </div>

            {/* Colors */}
            <div className={itemCls}>
                <div className="flex items-center gap-2">
                    <Baseline className="w-4 h-4 text-gray-500" />
                    <span>文字色</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <div className={`${subMenuCls} p-2 grid grid-cols-5 gap-1`}>
                    {colors.map(color => (
                        <button 
                            key={color} 
                            type="button" 
                            className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-sm" 
                            style={{ backgroundColor: color }}
                            onClick={() => setColor(color)}
                            title={color}
                        />
                    ))}
                </div>
            </div>

            {/* Font Family */}
            <div className={itemCls}>
                <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-gray-500">A</span>
                    <span>フォント</span>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <div className={`${subMenuCls} min-w-[180px]`}>
                    {fonts.map(font => (
                        <button 
                            key={font.value} 
                            type="button" 
                            className="w-full text-left px-4 py-1.5 hover:bg-gray-100 text-xs flex justify-between items-center" 
                            style={{ fontFamily: font.value }}
                            onClick={() => setFontFamily(font.value)}
                        >
                            {font.label}
                            {editor.getAttributes('textStyle').fontFamily === font.value && <Check className="w-3 h-3 text-blue-500" />}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
