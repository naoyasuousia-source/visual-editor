import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { ChevronDown, Highlighter } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import * as Popover from '@radix-ui/react-popover';
import { BaseDropdownMenu, MenuItem } from '../../ui/BaseDropdownMenu';

interface HighlightMenuProps {
    editor: Editor | null;
}

const presetColors = [
    { name: '黄色', value: '#ffff00' },
    { name: 'ライムグリーン', value: '#90ee90' },
    { name: 'ピンク', value: '#ffb6c1' },
    { name: 'オレンジ', value: '#ffa500' },
    { name: 'シアン', value: '#00ffff' },
    { name: 'ラベンダー', value: '#e6e6fa' }
];

/**
 * ハイライトメニュー（Radix UI + react-colorful版）
 * 
 * 【改善点】
 * - Radix Dropdown Menu + Popover
 * - react-colorfulでカラーピッカー実装
 * - 直接DOM操作なし
 */
export const HighlightMenu: React.FC<HighlightMenuProps> = ({ editor }) => {
    const [customColor, setCustomColor] = useState('#ffff00');

    if (!editor) return null;

    return (
        <BaseDropdownMenu
            trigger={
                <button
                    type="button"
                    className="px-2 py-1 rounded hover:bg-gray-200 transition-colors border border-gray-300 bg-white flex items-center gap-1 text-sm h-[32px]"
                >
                    <Highlighter className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3" />
                </button>
            }
        >
            {presetColors.map(color => (
                <MenuItem 
                    key={color.value}
                    onSelect={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}
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

            <Popover.Root>
                <Popover.Trigger asChild>
                    <button
                        type="button"
                        className="w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors flex items-center gap-2"
                    >
                        <div 
                            className="w-4 h-4 rounded border border-gray-300" 
                            style={{ backgroundColor: customColor }}
                        />
                        <span>カスタムカラー...</span>
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content
                        className="bg-white rounded-lg border border-gray-200 shadow-xl p-4 z-[2003]"
                        sideOffset={5}
                    >
                        <div className="space-y-3">
                            <HexColorPicker color={customColor} onChange={setCustomColor} />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={customColor}
                                    onChange={(e) => setCustomColor(e.target.value)}
                                    className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        editor.chain().focus().toggleHighlight({ color: customColor }).run();
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                    適用
                                </button>
                            </div>
                        </div>
                        <Popover.Arrow className="fill-white" />
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>

            <MenuItem onSelect={() => editor.chain().focus().unsetHighlight().run()}>
                ハイライト解除
            </MenuItem>
        </BaseDropdownMenu>
    );
};
