import React, { useState, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
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
        getCurrentImageAttrs,
        selectImageAt
    } = useImageActions(editor, { openDialog });

    // 画像上の右クリックかどうかを追跡
    const [isImageRightClick, setIsImageRightClick] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    /**
     * 右クリック時に対象が画像かどうかをチェック
     * 
     * 【重要】画像上で右クリックした場合、その画像の右辺にキャレットを移動させる。
     * これにより、新段落生成後でも画像操作が可能になる。
     * 
     * 画像でない場合は、普通のdivとして動作し、ブラウザのデフォルト
     * コンテキストメニューを表示させる。
     */
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        if (!editor) return;
        
        const target = e.target as HTMLElement;
        const success = selectImageAt(target);
        
        if (success) {
            // 画像上での右クリック: カスタムメニューを表示
            e.preventDefault(); // ブラウザのデフォルトメニューを抑制
            setContextMenuPosition({ x: e.clientX, y: e.clientY });
            setIsImageRightClick(true);
        } else {
            // 画像以外での右クリック: ブラウザのデフォルトメニューを表示
            // preventDefaultを呼ばないことで、ブラウザのデフォルト動作を許可
            setIsImageRightClick(false);
        }
    }, [editor, selectImageAt]);

    /**
     * メニューを閉じる
     */
    const handleCloseMenu = useCallback(() => {
        setIsImageRightClick(false);
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
        <>
            {/* 通常のdivとしてレンダリング。画像でない場合はブラウザのデフォルト動作。 */}
            <div ref={triggerRef} onContextMenu={handleContextMenu}>
                {children}
            </div>

            {/* 画像上での右クリック時のみカスタムメニューを表示 */}
            {isImageRightClick && (
                <ContextMenu.Root open={isImageRightClick} onOpenChange={(open) => !open && handleCloseMenu()} modal={false}>
                    <ContextMenu.Trigger asChild>
                        {/* 非表示の要素をトリガーとして使用 */}
                        <div style={{ position: 'absolute', left: contextMenuPosition.x, top: contextMenuPosition.y, width: 0, height: 0 }} />
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
            )}
        </>
    );
};
