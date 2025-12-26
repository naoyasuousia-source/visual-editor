import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    Outdent, 
    Indent,
    ChevronDown,
    Check
} from 'lucide-react';
import { BaseDropdownMenu, MenuItem, MenuSeparator } from '@/components/ui/BaseDropdownMenu';
import { useFormattingActions } from '@/hooks/useFormattingActions';

interface ParagraphMenuProps {
    editor: Editor | null;
}

/**
 * カスタムアイコン：行間
 * オリジナルのSVGデザインを使用
 */
const LineHeightIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M11 6h11v2H11zm0 5h11v2H11zm0 5h11v2H11zM6 3L3 6h2v12H3l3 3 3-3H7V6h2z" />
    </svg>
);

/**
 * カスタムアイコン：段落下余白
 * オリジナルのSVGデザインを使用
 */
const ParagraphSpacingIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16M4 18h16M12 9v6M9 12l3 3 3-3" />
    </svg>
);

/**
 * 段落メニュー（ビジュアル・直感UI版）
 */
export const ParagraphMenu: React.FC<ParagraphMenuProps> = ({ editor }) => {
    const { 
        changeIndent, 
        applyLineHeight, 
        applyParagraphSpacing,
        toggleHangingIndent,
        hasHangingIndent,
        canHangingIndent
    } = useFormattingActions(editor);
    
    const [expanded, setExpanded] = useState<'line-height' | 'paragraph-spacing' | null>(null);

    if (!editor) return null;

    const boxBase = "min-w-[32px] h-8 flex items-center justify-center rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all cursor-pointer outline-none bg-white m-0 px-1";
    const activeBox = "border-blue-500 bg-blue-50 text-blue-600";
    
    const isHanging = hasHangingIndent();
    const canHanging = canHangingIndent();

    const toggleExpanded = (type: 'line-height' | 'paragraph-spacing') => {
        setExpanded(expanded === type ? null : type);
    };

    return (
        <BaseDropdownMenu
            id="paragraph"
            trigger={
                <button
                    type="button"
                    className="px-2 py-1 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center gap-1 text-sm h-[36px]"
                >
                    段落 <ChevronDown className="w-3 h-3" />
                </button>
            }
        >
            <div className="flex flex-col">
                {/* アイコンストリップ */}
                <div className="flex items-center gap-1 p-1">
                    {/* 配置グループ */}
                    <div className="flex items-center gap-1 border-r border-gray-100 pr-1.5 mr-0.5">
                        <button 
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            className={`${boxBase} ${editor.isActive({ textAlign: 'left' }) ? activeBox : ''}`}
                            title="左揃え"
                            type="button"
                        >
                            <AlignLeft className="w-4 h-4 m-0" />
                        </button>
                        <button 
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            className={`${boxBase} ${editor.isActive({ textAlign: 'center' }) ? activeBox : ''}`}
                            title="中央揃え"
                            type="button"
                        >
                            <AlignCenter className="w-4 h-4 m-0" />
                        </button>
                        <button 
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            className={`${boxBase} ${editor.isActive({ textAlign: 'right' }) ? activeBox : ''}`}
                            title="右揃え"
                            type="button"
                        >
                            <AlignRight className="w-4 h-4 m-0" />
                        </button>
                    </div>

                    {/* 段落下余白・行間（分離） */}
                    <div className="flex items-center gap-1 border-r border-gray-100 pr-1.5 mr-0.5">
                        <button 
                            onClick={() => toggleExpanded('paragraph-spacing')}
                            className={`${boxBase} ${expanded === 'paragraph-spacing' ? activeBox : ''}`}
                            title="段落下余白"
                            type="button"
                        >
                            <ParagraphSpacingIcon />
                        </button>
                        <button 
                            onClick={() => toggleExpanded('line-height')}
                            className={`${boxBase} ${expanded === 'line-height' ? activeBox : ''}`}
                            title="行間"
                            type="button"
                        >
                            <LineHeightIcon />
                        </button>
                    </div>

                    {/* インデントグループ */}
                    <div className="flex items-center gap-1 border-r border-gray-100 pr-1.5 mr-0.5">
                        <button 
                            onClick={() => changeIndent(-1)}
                            className={boxBase}
                            title="インデント減少"
                            type="button"
                        >
                            <Outdent className="w-4 h-4 m-0" />
                        </button>
                        <button 
                            onClick={() => changeIndent(1)}
                            className={boxBase}
                            title="インデント増加"
                            type="button"
                        >
                            <Indent className="w-4 h-4 m-0" />
                        </button>
                    </div>

                    {/* ぶら下げグループ */}
                    <div 
                        className={`flex items-center gap-1.5 px-2 h-8 rounded border border-gray-200 cursor-pointer select-none transition-colors ${!canHanging ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                        onClick={() => canHanging && toggleHangingIndent(!isHanging)}
                        title={canHanging ? 'ぶら下げインデント' : 'インデント1以上の時に利用可能です'}
                    >
                        <div className={`w-3.5 h-3.5 rounded border border-gray-400 flex items-center justify-center transition-all ${isHanging ? 'bg-blue-500 border-blue-500' : 'bg-white'}`}>
                            {isHanging && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                        <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap">ぶら下げ</span>
                    </div>
                </div>

                {/* 展開されたコンテンツ */}
                {expanded && (
                    <>
                        <MenuSeparator />
                        <div className="py-1 min-w-[160px]">
                            {expanded === 'paragraph-spacing' && (
                                <>
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">段落下余白</div>
                                    <MenuItem onSelect={() => applyParagraphSpacing('xs')}>極小 (XS)</MenuItem>
                                    <MenuItem onSelect={() => applyParagraphSpacing('s')}>標準 (S)</MenuItem>
                                    <MenuItem onSelect={() => applyParagraphSpacing('m')}>やや広い (M)</MenuItem>
                                    <MenuItem onSelect={() => applyParagraphSpacing('l')}>広い (L)</MenuItem>
                                </>
                            )}
                            {expanded === 'line-height' && (
                                <>
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">行間</div>
                                    <MenuItem onSelect={() => applyLineHeight('s')}>狭い</MenuItem>
                                    <MenuItem onSelect={() => applyLineHeight('m')}>標準</MenuItem>
                                    <MenuItem onSelect={() => applyLineHeight('l')}>広い</MenuItem>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </BaseDropdownMenu>
    );
};
