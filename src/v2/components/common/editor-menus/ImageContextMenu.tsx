import React, { useState, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
 * 画像コンテキストメニュー（Radix Dropdown Menu応用版）
 * 
 * 【変更点】
 * - ContextMenuではなくDropdownMenuを使用
 * - 右クリックイベントをフックし、手動でメニューを開く
 * - これにより「条件付きでブラウザ標準メニューを出す」ことが可能になる
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

    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
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
        
        // 画像判定（DOM要素 + クリック座標の両方で判定）
        const success = selectImageAt(target, e);
        
        if (success) {
            // 画像上での右クリック: カスタムメニューを表示
            e.preventDefault(); // ブラウザのデフォルトメニューを抑制
            e.stopPropagation(); // 内部のTiptap等への伝播を完全に遮断
            setPosition({ x: e.clientX, y: e.clientY });
            setIsOpen(true);
        } else {
            // 画像以外: 何もしない（ブラウザ標準メニューが出る）
            // ポップアップが開いていれば閉じる
            setIsOpen(false);
        }
    }, [editor, selectImageAt]);

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
        <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
            {/* 
              * 【重要】onContextMenuCapture を使用。
              * Tiptap内部でイベントが停止される前に、キャプチャフェーズで判定を行う。
              */}
            <div ref={triggerRef} onContextMenuCapture={handleContextMenu}>
                {children}
            </div>

            {/* 動的配置トリガー（不可視） */}
            <DropdownMenu.Trigger asChild>
                <div 
                    style={{ 
                        position: 'fixed', 
                        left: position.x, 
                        top: position.y, 
                        width: 0, 
                        height: 0 
                    }} 
                />
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content 
                    className="min-w-[220px] bg-white rounded-md border border-gray-200 shadow-xl p-1 z-[3000] animate-in fade-in-0 zoom-in-95"
                    align="start"
                    sideOffset={0}
                    // 右クリックメニューっぽく振る舞わせる設定
                    onCloseAutoFocus={(e) => e.preventDefault()}
                >
                    {/* サイズサブメニュー */}
                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger className="relative flex items-center justify-between px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 data-[state=open]:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2">
                                <Maximize className="w-4 h-4 text-gray-500" />
                                <span>サイズ</span>
                            </div>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.Portal>
                            <DropdownMenu.SubContent className="min-w-[120px] bg-white rounded-md border border-gray-200 shadow-xl p-1 z-[3001] animate-in fade-in-0 zoom-in-95">
                                {sizes.map(({ value, label }) => (
                                    <DropdownMenu.Item
                                        key={value}
                                        className="relative flex items-center justify-between px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 transition-colors"
                                        onSelect={() => setImageSize(value)}
                                    >
                                        <span>{label}</span>
                                        {currentSize === value && <Check className="w-4 h-4 text-blue-500" />}
                                    </DropdownMenu.Item>
                                ))}
                            </DropdownMenu.SubContent>
                        </DropdownMenu.Portal>
                    </DropdownMenu.Sub>

                    <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

                    {/* 枠線トグル */}
                    <DropdownMenu.Item
                        className="relative flex items-center gap-2 px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 transition-colors"
                        onSelect={toggleImageBorder}
                    >
                        <Square className={`w-4 h-4 ${hasBorder ? 'fill-blue-100 stroke-blue-600' : 'text-gray-500'}`} />
                        <span>枠線</span>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

                    {/* メタデータ編集 */}
                    <DropdownMenu.Item
                        className="relative flex items-center gap-2 px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 transition-colors"
                        onSelect={editTitle}
                    >
                        <Type className="w-4 h-4 text-gray-500" />
                        <span>タイトル編集</span>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        className="relative flex items-center gap-2 px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 transition-colors"
                        onSelect={editCaption}
                    >
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                        <span>キャプション編集</span>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        className="relative flex items-center gap-2 px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-gray-100 transition-colors"
                        onSelect={editTags}
                    >
                        <Tag className="w-4 h-4 text-gray-500" />
                        <span>タグ編集</span>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

                    {/* 削除 */}
                    <DropdownMenu.Item
                        className="relative flex items-center gap-2 px-4 py-2 text-sm outline-none cursor-pointer select-none rounded hover:bg-red-50 text-red-600 transition-colors"
                        onSelect={deleteImage}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>削除</span>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};
