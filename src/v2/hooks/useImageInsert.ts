import { Editor } from '@tiptap/react';
import { toast } from 'sonner';

interface UseImageInsertOptions {
    prompt: (options: { 
        title: string; 
        description?: string; 
        placeholder?: string; 
        inputType?: 'text' | 'url' 
    }) => Promise<string | null>;
}

/**
 * 画像挿入ロジックを管理するカスタムフック
 * 
 * 【重要】window.prompt()を使用せず、useDialogsフック経由でプロンプトダイアログを表示
 * 
 * 【機能】
 * - Dropbox共有URL変換（dl=0 → raw=1）
 * - Web画像URL挿入
 * - バリデーション
 */
export const useImageInsert = (editor: Editor | null, options: UseImageInsertOptions) => {
    /**
     * Dropbox共有URLを画像直リンクに変換
     */
    const convertDropboxUrl = (url: string): string => {
        try {
            const parsed = new URL(url);
            // dl=0 を削除し、raw=1 を追加
            parsed.searchParams.delete('dl');
            parsed.searchParams.set('raw', '1');
            return parsed.toString();
        } catch (error) {
            // URLパースに失敗した場合はそのまま返す
            return url;
        }
    };

    /**
     * Dropboxから画像を挿入
     */
    const insertFromDropbox = async () => {
        if (!editor) return;

        const url = await options.prompt({
            title: 'Dropbox共有URLを入力',
            description: 'Dropboxの共有リンクを貼り付けてください',
            placeholder: 'https://www.dropbox.com/...',
            inputType: 'url'
        });

        if (!url) return;

        try {
            const convertedUrl = convertDropboxUrl(url);
            editor.chain().focus().setImage({ src: convertedUrl }).run();
            toast.success('画像を挿入しました');
        } catch (error) {
            toast.error('画像の挿入に失敗しました');
        }
    };

    /**
     * Web上の画像を挿入
     */
    const insertFromWeb = async () => {
        if (!editor) return;

        const url = await options.prompt({
            title: '画像URLを入力',
            description: 'Web上の画像URLを入力してください',
            placeholder: 'https://example.com/image.jpg',
            inputType: 'url'
        });

        if (!url) return;

        try {
            editor.chain().focus().setImage({ src: url }).run();
            toast.success('画像を挿入しました');
        } catch (error) {
            toast.error('画像の挿入に失敗しました');
        }
    };

    return {
        insertFromDropbox,
        insertFromWeb,
        convertDropboxUrl
    };
};
