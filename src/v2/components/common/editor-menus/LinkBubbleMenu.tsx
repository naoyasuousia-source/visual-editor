import React from 'react';
import { Editor } from '@tiptap/react';
import { Edit2, Link2Off } from 'lucide-react';
import { useLinkActions } from '@/hooks/useLinkActions';
import { useLinkBubblePosition } from '@/hooks/useLinkBubblePosition';
import { PromptOptions } from '@/hooks/useDialogs';

interface LinkBubbleMenuProps {
    editor: Editor;
    prompt: (options: PromptOptions) => Promise<string | null>;
}

/**
 * リンク用バブルメニュー
 */
export const LinkBubbleMenu: React.FC<LinkBubbleMenuProps> = ({ editor, prompt }) => {
    // 位置計算ロジックをフックに委譲
    const { 
        hoveredLink, 
        popupPosition, 
        setIsPopupHovered, 
        closePopup 
    } = useLinkBubblePosition(editor);

    // リンク操作ロジックをフックから取得
    const { changeLinkDestination, removeLink } = useLinkActions(editor, { prompt });

    if (!editor || !hoveredLink || !popupPosition) return null;

    const handleChangeDestination = () => {
        changeLinkDestination(hoveredLink);
        closePopup();
    };

    const handleRemoveLink = () => {
        removeLink(hoveredLink);
        closePopup();
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
                closePopup();
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

