import { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { toast } from 'sonner';

interface UseImageActionsOptions {
    openDialog: (dialogType: string) => void;
}

/**
 * 画像操作ロジックを管理するカスタムフック
 * 
 * 【重要】UIコンポーネントから完全に分離し、Tiptapのコマンドのみを使用
 * 
 * 【機能】
 * - 画像サイズ変更
 * - 枠線トグル
 * - 画像削除
 * - メタデータ編集ダイアログ呼び出し
 */
export const useImageActions = (editor: Editor | null, options: UseImageActionsOptions) => {
    const { openDialog } = options;

    /**
     * 画像サイズを変更
     */
    const setImageSize = useCallback((size: 'xs' | 's' | 'm' | 'l' | 'xl') => {
        if (!editor) return;
        editor.chain().focus().updateAttributes('image', { size }).run();
        toast.success(`サイズを${size.toUpperCase()}に変更しました`);
    }, [editor]);

    /**
     * 画像の枠線をトグル
     */
    const toggleImageBorder = useCallback(() => {
        if (!editor) return;
        const isBordered = editor.getAttributes('image').hasBorder;
        editor.chain().focus().updateAttributes('image', { hasBorder: !isBordered }).run();
        toast.success(isBordered ? '枠線を削除しました' : '枠線を追加しました');
    }, [editor]);

    /**
     * 画像を削除
     */
    const deleteImage = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().deleteSelection().run();
        toast.success('画像を削除しました');
    }, [editor]);

    /**
     * タイトル編集ダイアログを開く
     */
    const editTitle = useCallback(() => {
        openDialog('image-title');
    }, [openDialog]);

    /**
     * キャプション編集ダイアログを開く
     */
    const editCaption = useCallback(() => {
        openDialog('image-caption');
    }, [openDialog]);

    /**
     * タグ編集ダイアログを開く
     */
    const editTags = useCallback(() => {
        openDialog('image-tag');
    }, [openDialog]);

    /**
     * 現在選択されている画像の属性を取得
     */
    const getCurrentImageAttrs = useCallback(() => {
        if (!editor) return null;
        return editor.getAttributes('image');
    }, [editor]);

    return {
        setImageSize,
        toggleImageBorder,
        deleteImage,
        editTitle,
        editCaption,
        editTags,
        getCurrentImageAttrs
    };
};
