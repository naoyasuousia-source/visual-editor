import { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';
import { TiptapPasteHandler } from '@/types/tiptap';

/**
 * ペースト制御フック
 * V1の events.ts のペースト制御ロジックを再現
 */
export const usePasteControl = () => {
    /**
     * Tiptapの editorProps.handlePaste で使用するハンドラ
     */
    const handlePaste = useCallback<TiptapPasteHandler>((_view, event): boolean => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // 1. ファイルとしての画像ペーストをチェック
        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                event.preventDefault();
                toast.error('画像のペーストは利用できません。ツールバーの「ファイルを挿入」メニューから画像を追加してください。');
                return true;
            }
        }

        // 2. HTML形式での画像（Webサイト等からのコピー）をチェック
        const html = clipboardData.getData('text/html');
        if (html && /<img\s+/i.test(html)) {
            event.preventDefault();
            toast.error('画像を含むコンテンツのペーストは利用できません。');
            return true;
        }

        return false; // Tiptapのデフォルト処理を継続
    }, []);

    const transformPastedHTML = useCallback((html: string): string => {
        // 段落番号(data-para)やID(id="p...")を削除してクリーンアップ
        return html
            .replace(/\sdata-para="[^"]*"/g, '')
            .replace(/\sid="p[0-9-]*"/g, '');
    }, []);

    return {
        handlePaste,
        transformPastedHTML
    };
};
