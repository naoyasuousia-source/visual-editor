import { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';

/**
 * ペースト制御フック
 * V1の events.ts のペースト制御ロジックを再現
 * 
 * 【制約】
 * - 画像ファイルの直接ペーストを禁止
 * - HTML形式での画像ペーストを禁止
 * - ユーザーには「ファイルメニューから挿入」を促す
 */
export const usePasteControl = (editor: Editor | null) => {
    /**
     * Tiptapの editorProps.handlePaste で使用するハンドラ
     */
    const handlePaste = useCallback((view: any, event: ClipboardEvent): boolean => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) return false;

        // 1. ファイルとしての画像ペーストをチェック
        const items = clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                event.preventDefault();
                toast.error('画像のペーストは利用できません。ツールバーの「ファイルを挿入」メニューから画像を追加してください。');
                return true; // イベントを処理済みとしてマーク
            }
        }

        // 2. HTML形式での画像（Webサイト等からのコピー）をチェック
        const html = clipboardData.getData('text/html');
        if (html && /<img\s+/i.test(html)) {
            event.preventDefault();
            toast.error('画像を含むコンテンツのペーストは利用できません。');
            return true; // イベントを処理済みとしてマーク
        }

        return false; // Tiptapのデフォルト処理を継続
    }, []);

    return {
        handlePaste
    };
};
