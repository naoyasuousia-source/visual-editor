import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { Edit2, Link2Off } from 'lucide-react';

interface LinkBubbleMenuProps {
    editor: Editor;
}

interface PopupPosition {
    top: number;
    left: number;
}

export const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ editor }) => {
    const [hoveredLink, setHoveredLink] = useState<HTMLAnchorElement | null>(null);
    const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
    const [isPopupHovered, setIsPopupHovered] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    if (!editor) return null;

    const changeDestination = () => {
        if (!hoveredLink) return;
        
        const { state } = editor;
        
        // エディタのドキュメント内の全ブックマークを検索
        const bookmarks: Array<{ id: string; text: string }> = [];
        
        state.doc.descendants((node) => {
            if (node.marks) {
                node.marks.forEach(mark => {
                    if (mark.type.name === 'bookmark' && mark.attrs.id) {
                        const text = node.textContent.substring(0, 50);
                        if (!bookmarks.find(b => b.id === mark.attrs.id)) {
                            bookmarks.push({ id: mark.attrs.id, text });
                        }
                    }
                });
            }
        });

        if (bookmarks.length === 0) {
            alert('リンク先が登録されていません。');
            return;
        }

        let promptMessage = 'どのリンク先にリンクしますか？番号を入力してください。\n\n';
        bookmarks.forEach((bookmark, index) => {
            promptMessage += `${index + 1}: ${bookmark.text}\n`;
        });

        const choice = window.prompt(promptMessage);
        if (!choice) return;

        const choiceNum = parseInt(choice.trim(), 10);
        if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > bookmarks.length) {
            alert('無効な番号です。');
            return;
        }

        const selectedBookmark = bookmarks[choiceNum - 1];
        hoveredLink.href = `#${selectedBookmark.id}`;
        
        setHoveredLink(null);
        setPopupPosition(null);
    };

    const removeLink = () => {
        if (!hoveredLink) return;
        
        const parent = hoveredLink.parentNode;
        if (parent) {
            while (hoveredLink.firstChild) {
                parent.insertBefore(hoveredLink.firstChild, hoveredLink);
            }
            parent.removeChild(hoveredLink);
            parent.normalize();
        }
        
        setHoveredLink(null);
        setPopupPosition(null);
    };

    if (!hoveredLink || !popupPosition) return null;

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
            <button type="button" className={btnCls} onClick={changeDestination}>
                <Edit2 className="w-4 h-4 text-blue-500" />
                <span>リンク先変更</span>
            </button>
            <button type="button" className={`${btnCls} text-red-600 hover:bg-red-50`} onClick={removeLink}>
                <Link2Off className="w-4 h-4" />
                <span>削除</span>
            </button>
        </div>
    );
};
