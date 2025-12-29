import { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';

interface PopupPosition {
    top: number;
    left: number;
}

/**
 * リンクのホバー状態とバブルメニューの位置を管理するフック
 */
export const useLinkBubblePosition = (editor: Editor | null) => {
    const [hoveredLink, setHoveredLink] = useState<HTMLAnchorElement | null>(null);
    const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
    const [isPopupHovered, setIsPopupHovered] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!editor) return;

        const editorDom = editor.view.dom as HTMLElement;

        const handleMouseMove = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // ブックマークへのリンク（#bm-で始まるもの）を対象とする
            const link = target.closest('a[href^="#bm-"]') as HTMLAnchorElement | null;
            
            if (link) {
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
                // ポップアップ上にもいない場合は遅延して非表示
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

    const closePopup = () => {
        setHoveredLink(null);
        setPopupPosition(null);
    };

    return {
        hoveredLink,
        popupPosition,
        setIsPopupHovered,
        closePopup
    };
};
