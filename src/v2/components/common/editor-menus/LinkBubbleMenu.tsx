import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Edit2, Link2Off } from 'lucide-react';
import { useLinkActions } from '@/hooks/useLinkActions';
import { PromptOptions } from '@/hooks/useDialogs';

interface LinkBubbleMenuProps {
    editor: Editor;
    prompt: (options: PromptOptions) => Promise<string | null>;
}

interface PopupPosition {
    top: number;
    left: number;
}

/**
 * リンク用バブルメニュー
 * 
 * rules.md に基づき、ビジネスロジックを useLinkActions フックへ委譲し、
 * 直接的なDOM操作を排除しています。
 */
export const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ editor, prompt }) => {
    const [hoveredLink, setHoveredLink] = useState<HTMLAnchorElement | null>(null);
    const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
    const [isPopupHovered, setIsPopupHovered] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // リンク操作ロジックをフックから取得
    const { changeLinkDestination, removeLink } = useLinkActions(editor, { prompt });

    useEffect(() => {
        if (!editor) return;

        const editorDom = editor.view.dom as HTMLElement;

        const handleMouseMove = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a[href^="#bm-"]') as HTMLAnchorElement | null;
            
            if (link) {
                // リンク上にいる場合、タイマーをクリアしてポップアップを表示
                if (hideTimerRef.current) {
                    clearTimeout(hideTimerRef.current);
                    hideTimerRef.current = null;
                }
                const rect = link.getBoundingClientRect();
                setHoveredLink(link);
                setPopupPosition({
                    top: rect.top - 45,
                    left: rect.left + rect.width / 2,
                });
            } else if (!isPopupHovered) {
                // リンク外でポップアップにもホバーしていない場合、遅延して非表示
                if (!hideTimerRef.current) {
                    hideTimerRef.current = setTimeout(() => {
                        setHoveredLink(null);
                        setPopupPosition(null);
                        hideTimerRef.current = null;
                    }, 300);
                }
            }
        };

        editorDom.addEventListener('mousemove', handleMouseMove);

        return () => {
            editorDom.removeEventListener('mousemove', handleMouseMove);
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
        };
    }, [editor, isPopupHovered]);

    if (!editor || !hoveredLink || !popupPosition) return null;

    const handleChangeDestination = () => {
        changeLinkDestination(hoveredLink);
        setHoveredLink(null);
        setPopupPosition(null);
    };

    const handleRemoveLink = () => {
        removeLink(hoveredLink);
        setHoveredLink(null);
        setPopupPosition(null);
    };

    const btnCls = "flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 text-sm transition-colors whitespace-nowrap text-gray-700";

    return (
        <div
            className="fixed bg-white border border-gray-300 shadow-xl rounded-lg py-1 flex items-center divide-x divide-gray-100 z-[9999]"
            style={{
                top: `${popupPosition.top}px`,
                left: `${popupPosition.left}px`,
                transform: 'translateX(-50%)',
            }}
            onMouseEnter={() => setIsPopupHovered(true)}
            onMouseLeave={() => {
                setIsPopupHovered(false);
                setHoveredLink(null);
                setPopupPosition(null);
            }}
        >
            <button type="button" className={btnCls} onClick={handleChangeDestination}>
                <Edit2 className="w-4 h-4 text-blue-500" />
                <span>リンク先変更</span>
            </button>
            <button type="button" className={`${btnCls} text-red-600 hover:bg-red-50`} onClick={handleRemoveLink}>
                <Link2Off className="w-4 h-4" />
                <span>削除</span>
            </button>
        </div>
    );
};
