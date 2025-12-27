import React, { useState, useCallback, useRef } from 'react';
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
import { useImageActions } from '@/hooks/useImageActions';
import { useAppStore } from '@/store/useAppStore';

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
 * - 画像上で右クリックした場合のみ表示
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

    // 画像上の右クリックかどうかを追跡
    const [isImageRightClick, setIsImageRightClick] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);

    /**
     * 右クリック時に対象が画像かどうかをチェック
     */
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        // 画像要素または画像コンテナ上での右クリックかチェック
        const isImage = target.tagName === 'IMG' || 
                        target.closest('img') !== null ||
                        target.closest('[data-type="customImage"]') !== null;
        
        if (isImage) {
            // 画像の場合はカスタムメニューを表示（デフォルト動作を防止）
            setIsImageRightClick(true);
        } else {
            // 画像でない場合はブラウザのデフォルトメニューを表示
            setIsImageRightClick(false);
            // Radix ContextMenuのデフォルト動作を防止するイベントをキャンセル
            // これによりブラウザのネイティブコンテキストメニューが表示される
            e.stopPropagation();
        }
    }, []);

    /**
     * メニューの開閉状態変更時のハンドラ
     */
    const handleOpenChange = useCallback((open: boolean) => {
        // 閉じる際はリセット
        if (!open) {
            setIsImageRightClick(false);
        }
    }, []);

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
        <ContextMenu.Root onOpenChange={handleOpenChange} modal={false}>
            <ContextMenu.Trigger asChild onContextMenu={handleContextMenu}>
                <div ref={triggerRef}>
                    {children}
                </div>
            </ContextMenu.Trigger>

            {/* 画像上での右クリック時のみメニューを表示 */}
            {isImageRightClick && (
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
            )}
        </ContextMenu.Root>
    );
};
