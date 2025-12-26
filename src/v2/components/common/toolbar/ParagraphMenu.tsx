import { 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    BetweenVerticalStart, 
    Outdent, 
    Indent,
    ChevronDown 
} from 'lucide-react';
import { BaseDropdownMenu, MenuItem, SubMenu } from '@/components/ui/BaseDropdownMenu';
import { useFormattingActions } from '@/hooks/useFormattingActions';

interface ParagraphMenuProps {
    editor: Editor | null;
}

/**
 * 段落メニュー（ビジュアル・直感UI版）
 */
export const ParagraphMenu: React.FC<ParagraphMenuProps> = ({ editor }) => {
    const { changeIndent, applyLineHeight, applyParagraphSpacing } = useFormattingActions(editor);

    if (!editor) return null;

    const boxBase = "w-10 h-10 flex items-center justify-center rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-all cursor-pointer outline-none";
    const activeBox = "border-blue-500 bg-blue-50 text-blue-600";

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
            <div className="flex items-center gap-1.5 p-1.5 bg-white rounded shadow-sm">
                {/* 配置グループ */}
                <div className="flex items-center gap-1 border-r border-gray-100 pr-1.5 mr-0.5">
                    <button 
                        onClick={() => editor.chain().focus().setTextAlign('left').run()}
                        className={`${boxBase} ${editor.isActive({ textAlign: 'left' }) ? activeBox : ''}`}
                        title="左揃え"
                    >
                        <AlignLeft className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().setTextAlign('center').run()}
                        className={`${boxBase} ${editor.isActive({ textAlign: 'center' }) ? activeBox : ''}`}
                        title="中央揃え"
                    >
                        <AlignCenter className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => editor.chain().focus().setTextAlign('right').run()}
                        className={`${boxBase} ${editor.isActive({ textAlign: 'right' }) ? activeBox : ''}`}
                        title="右揃え"
                    >
                        <AlignRight className="w-5 h-5" />
                    </button>
                </div>

                {/* 間隔グループ（サブメニュー） */}
                <SubMenu 
                    hideChevron 
                    className="p-0 border-none hover:bg-transparent"
                    trigger={
                        <div className={boxBase} title="行間・段落間隔">
                            <BetweenVerticalStart className="w-5 h-5" />
                        </div>
                    }
                >
                    <div className="py-1">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">段落間隔</div>
                        <MenuItem onSelect={() => applyParagraphSpacing('xs')}>極小 (XS)</MenuItem>
                        <MenuItem onSelect={() => applyParagraphSpacing('s')}>標準 (S)</MenuItem>
                        <MenuItem onSelect={() => applyParagraphSpacing('m')}>やや広い (M)</MenuItem>
                        <MenuItem onSelect={() => applyParagraphSpacing('l')}>広い (L)</MenuItem>
                        <div className="h-px bg-gray-100 my-1" />
                        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">行間</div>
                        <MenuItem onSelect={() => applyLineHeight('s')}>狭い</MenuItem>
                        <MenuItem onSelect={() => applyLineHeight('m')}>標準</MenuItem>
                        <MenuItem onSelect={() => applyLineHeight('l')}>広い</MenuItem>
                    </div>
                </SubMenu>

                {/* インデントグループ */}
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => changeIndent(-1)}
                        className={boxBase}
                        title="インデント削除"
                    >
                        <Outdent className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => changeIndent(1)}
                        className={boxBase}
                        title="インデント追加"
                    >
                        <Indent className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </BaseDropdownMenu>
    );
};
