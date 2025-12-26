import React from 'react';
import { Editor } from '@tiptap/react';
import { ChevronDown } from 'lucide-react';
import { BaseDropdownMenu, MenuItem, SubMenu } from '../ui/BaseDropdownMenu';

interface ParagraphMenuProps {
    editor: Editor | null;
}

/**
 * 段落メニュー（Radix UI版）
 */
export const ParagraphMenu: React.FC<ParagraphMenuProps> = ({ editor }) => {
    if (!editor) return null;

    return (
        <BaseDropdownMenu
            trigger={
                <button
                    type="button"
                    className="px-2 py-1 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center gap-1 text-sm h-[32px]"
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
                <MenuItem onSelect={() => {
                    // インデント追加ロジック（後でフックに移動）
                    const currentIndent = editor.getAttributes('paragraph').indent || 0;
                    editor.chain().focus().updateAttributes('paragraph', {
                        indent: Math.min(currentIndent + 1, 5)
                    }).run();
                }}>
                    インデント追加
                </MenuItem>
                <MenuItem onSelect={() => {
                    // インデント削除ロジック（後でフックに移動）
                    const currentIndent = editor.getAttributes('paragraph').indent || 0;
                    editor.chain().focus().updateAttributes('paragraph', {
                        indent: Math.max(currentIndent - 1, 0)
                    }).run();
                }}>
                    インデント削除
                </MenuItem>
            </SubMenu>

            <SubMenu trigger="行間">
                <MenuItem onSelect={() => {
                    editor.chain().focus().updateAttributes('paragraph', {
                        lineHeight: 'normal'
                    }).run();
                }}>
                    標準
                </MenuItem>
                <MenuItem onSelect={() => {
                    editor.chain().focus().updateAttributes('paragraph', {
                        lineHeight: 'tight'
                    }).run();
                }}>
                    狭い
                </MenuItem>
                <MenuItem onSelect={() => {
                    editor.chain().focus().updateAttributes('paragraph', {
                        lineHeight: 'loose'
                    }).run();
                }}>
                    広い
                </MenuItem>
            </SubMenu>
        </BaseDropdownMenu>
    );
};
