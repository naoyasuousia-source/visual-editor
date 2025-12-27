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
     * 現在のカーソル位置の段落が空かどうかをチェック
     */
    const isCurrentParagraphEmpty = (): boolean => {
        if (!editor) return true;
        
        const { $from } = editor.state.selection;
        const parent = $from.parent;
        
        // 段落のテキスト内容が空かチェック（画像ノードがある場合も空でないと判定）
        return parent.content.size === 0;
    };

    /**
     * 画像を挿入（段落にテキストがある場合は新しい段落を作成）
     * 
     * 【動作】
     * - 空の段落: その段落内に画像を挿入
     * - テキストがある段落: 新しい段落を作成し、その中に画像を挿入
     * 
     * 【重要】
     * 画像は常に独自の段落（<p>タグ）内に配置され、段落番号が付与される
     * キャレットは画像クリックプラグインにより画像右辺に配置される
     */
    const insertImageWithParagraphCheck = (src: string) => {
        if (!editor) return;

        const isEmpty = isCurrentParagraphEmpty();
        
        if (isEmpty) {
            // 空の段落の場合はそのまま画像を挿入（段落内にインライン要素として配置）
            // setImage後、キャレットは自動的に画像の直後に配置される
            editor.chain().focus().setImage({ src }).run();
        } else {
            // テキストがある段落の場合:
            // 新しい段落を作成し、その中に画像を配置
            
            const { state } = editor;
            const { $from } = state.selection;
            
            // 現在の段落ノードの終了位置（次のノードの開始位置）を取得
            const afterParagraphPos = $from.after();
            
            // 新しい段落ノードを作成し、その中に画像を配置
            editor.chain()
                .focus()
                .insertContentAt(afterParagraphPos, {
                    type: 'paragraph',
                    content: [
                        {
                            type: 'image',
                            attrs: { src }
                        }
                    ]
                })
                .run();
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
            insertImageWithParagraphCheck(convertedUrl);
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
            insertImageWithParagraphCheck(url);
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
