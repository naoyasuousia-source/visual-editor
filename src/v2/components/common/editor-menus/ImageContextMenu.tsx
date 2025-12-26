import React from 'react';
import { Editor } from '@tiptap/react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { 
    Maximize, 
    Square, 
    Type, 
    MessageSquare, 
    Tag, 
    Trash2,
    Check
} from 'lucide-react';
import { useImageActions } from '@/components/../hooks/useImageActions';
import { useAppStore } from '@/components/../store/useAppStore';

interface ImageContextMenuProps {
    editor: Editor | null;
    children: React.ReactNode;
}

/**
 * 画像コンテキストメニュー（Radix Context Menu版）
 * 
 * 【改善点】
 * - Radix Context Menuで完全置き換え
 * - useImageActionsフックでロジック分離
 * - アクセシビリティ完全対応
 * - 直接DOM操作なし
 */
export const ImageContextMenu: React.FC<ImageContextMenuProps> = ({ editor, children }) => {
    const { openDialog } = useAppStore();
    const {
        setImageSize,
        toggleImageBorder,
        deleteImage,
        editTitle,
        editCaption,
        editTags,
        getCurrentImageAttrs
    } = useImageActions(editor, { openDialog });

    if (!editor) return <>{children}</>;

    const imageAttrs = getCurrentImageAttrs();
    const currentSize = imageAttrs?.size || 'm';
    const hasBorder = imageAttrs?.hasBorder || false;

    const sizes = [
        { value: 'xs', label: 'XS' },
        { value: 's', label: 'S' },
        { value: 'm', label: 'M' },
        { value: 'l', label: 'L' },
        { value: 'xl', label: 'XL' }
    ] as const;

    return (
        <ContextMenu.Root>
            <ContextMenu.Trigger asChild>
                {children}
            </ContextMenu.Trigger>

            <ContextMenu.Portal>
                <ContextMenu.Content className="min-w-[220px] bg-white rounded-md border border-gray-200 shadow-xl p-1 z-[3000] animate-in fade-in-0 zoom-in-95">
                    {/* サイズサブメニュー */}
                    <ContextMenu.Sub>
                        <ContextMenu.SubTrigger className="relative flex items-center justify-between px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 data-[state=open]:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2">
                                <Maximize className="w-4 h-4 text-gray-500" />
                                <span>サイズ</span>
                            </div>
                        </ContextMenu.SubTrigger>
                        <ContextMenu.Portal>
                            <ContextMenu.SubContent className="min-w-[120px] bg-white rounded-md border border-gray-200 shadow-xl p-1 z-[3001] animate-in fade-in-0 zoom-in-95">
                                {sizes.map(({ value, label }) => (
                                    <ContextMenu.Item
                                        key={value}
                                        className="relative flex items-center justify-between px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 transition-colors"
                                        onSelect={() => setImageSize(value)}
                                    >
                                        <span>{label}</span>
                                        {currentSize === value && <Check className="w-4 h-4 text-blue-500" />}
                                    </ContextMenu.Item>
                                ))}
                            </ContextMenu.SubContent>
                        </ContextMenu.Portal>
                    </ContextMenu.Sub>

                    <ContextMenu.Separator className="h-px bg-gray-200 my-1" />

                    {/* 枠線トグル */}
                    <ContextMenu.Item
                        className="relative flex items-center gap-2 px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 transition-colors"
                        onSelect={toggleImageBorder}
                    >
                        <Square className={`w-4 h-4 ${hasBorder ? 'fill-blue-100 stroke-blue-600' : 'text-gray-500'}`} />
                        <span>枠線</span>
                    </ContextMenu.Item>

                    <ContextMenu.Separator className="h-px bg-gray-200 my-1" />

                    {/* メタデータ編集 */}
                    <ContextMenu.Item
                        className="relative flex items-center gap-2 px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 transition-colors"
                        onSelect={editTitle}
                    >
                        <Type className="w-4 h-4 text-gray-500" />
                        <span>タイトル編集</span>
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        className="relative flex items-center gap-2 px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 transition-colors"
                        onSelect={editCaption}
                    >
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span>キャプション編集</span>
                    </ContextMenu.Item>

                    <ContextMenu.Item
                        className="relative flex items-center gap-2 px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 transition-colors"
                        onSelect={editTags}
                    >
                        <Tag className="w-4 h-4 text-gray-500" />
                        <span>タグ編集</span>
                    </ContextMenu.Item>

                    <ContextMenu.Separator className="h-px bg-gray-200 my-1" />

                    {/* 削除 */}
                    <ContextMenu.Item
                        className="relative flex items-center gap-2 px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-red-50 text-red-600 transition-colors"
                        onSelect={deleteImage}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>削除</span>
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Portal>
        </ContextMenu.Root>
    );
};
