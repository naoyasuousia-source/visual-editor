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
     * 挿入後、キャレットは画像の右辺（直後）に配置される
     */
    const insertImageWithParagraphCheck = (src: string) => {
        if (!editor) return;

        const isEmpty = isCurrentParagraphEmpty();
        
        if (isEmpty) {
            // 空の段落の場合はそのまま画像を挿入（段落内にインライン要素として配置）
            editor.chain().focus().setImage({ src }).run();
            
            // 挿入後、キャレットを画像の直後に移動
            // setImageは画像の直後にキャレットを配置するはずだが、明示的に設定
            setTimeout(() => {
                // 段落の末尾に移動（画像の直後）
                const { $from } = editor.state.selection;
                const endPos = $from.end();
                editor.commands.setTextSelection(endPos);
            }, 0);
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
            
            // 挿入後、新しい段落の末尾（画像の直後）にキャレットを移動
            setTimeout(() => {
                // 挿入した段落を探して、その末尾にキャレットを移動
                const newState = editor.state;
                const doc = newState.doc;
                
                // afterParagraphPosの位置に挿入された段落を探す
                // 挿入後は位置がずれている可能性があるので、ドキュメントを走査
                let targetPos = afterParagraphPos + 1; // 段落の開始位置の直後
                
                // 挿入した段落の末尾位置を計算
                const resolvedPos = doc.resolve(targetPos);
                const endOfNewParagraph = resolvedPos.end();
                
                editor.commands.setTextSelection(endOfNewParagraph);
            }, 0);
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
