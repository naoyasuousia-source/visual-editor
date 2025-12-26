import React from 'react';
import { Editor } from '@tiptap/react';
import { ChevronDown } from 'lucide-react';
import { BaseDropdownMenu, MenuItem, SubMenu } from '@/components/ui/BaseDropdownMenu';
import { useFormattingActions } from '@/hooks/useFormattingActions';

interface ParagraphMenuProps {
    editor: Editor | null;
}

/**
 * 段落メニュー（Radix UI版）
 * useFormattingActionsを使用してロジックを分離
 */
export const ParagraphMenu: React.FC<ParagraphMenuProps> = ({ editor }) => {
    const { changeIndent, applyLineHeight, applyParagraphSpacing } = useFormattingActions(editor);

    if (!editor) return null;

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
            <SubMenu trigger="配置">
                <MenuItem onSelect={() => editor.chain().focus().setTextAlign('left').run()}>
                    左揃え
                </MenuItem>
                <MenuItem onSelect={() => editor.chain().focus().setTextAlign('center').run()}>
                    中央揃え
                </MenuItem>
                <MenuItem onSelect={() => editor.chain().focus().setTextAlign('right').run()}>
                    右揃え
                </MenuItem>
            </SubMenu>

            <SubMenu trigger="インデント">
                <MenuItem onSelect={() => changeIndent(1)}>
                    インデント追加
                </MenuItem>
                <MenuItem onSelect={() => changeIndent(-1)}>
                    インデント削除
                </MenuItem>
            </SubMenu>

            <SubMenu trigger="段落間隔">
                <MenuItem onSelect={() => applyParagraphSpacing('xs')}>
                    XS
                </MenuItem>
                <MenuItem onSelect={() => applyParagraphSpacing('s')}>
                    S（標準）
                </MenuItem>
                <MenuItem onSelect={() => applyParagraphSpacing('m')}>
                    M
                </MenuItem>
                <MenuItem onSelect={() => applyParagraphSpacing('l')}>
                    L
                </MenuItem>
                <MenuItem onSelect={() => applyParagraphSpacing('xl')}>
                    XL
                </MenuItem>
            </SubMenu>

            <SubMenu trigger="行間">
                <MenuItem onSelect={() => applyLineHeight('s')}>
                    狭い
                </MenuItem>
                <MenuItem onSelect={() => applyLineHeight('m')}>
                    標準
                </MenuItem>
                <MenuItem onSelect={() => applyLineHeight('l')}>
                    広い
                </MenuItem>
            </SubMenu>
        </BaseDropdownMenu>
    );
};
