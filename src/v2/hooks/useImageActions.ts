import { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import { toast } from 'sonner';

interface UseImageActionsOptions {
    openDialog: (dialogType: string) => void;
}

/**
 * 画像操作ロジックを管理するカスタムフック
 * 
 * ============================================================================
 * 【キャレット関連ロジック】
 * ============================================================================
 * 
 * このフックは「キャレットの直前のノード」($from.nodeBefore) を参照して
 * 対象の画像を特定します。
 * 
 * 理由: customImage.tsでselectable: falseに設定しているため、
 * Tiptapの標準的なgetAttributes('image')が正しく動作しない場合がある。
 * そのため、キャレット位置から画像を特定するロジックを使用。
 * 
 * ============================================================================
 * 【関連ファイル】
 * ============================================================================
 * 
 * - src/v2/lib/customImage.ts
 *     画像キャレットロジックの中心。このフックの操作対象となる画像の
 *     選択とキャレット配置はcustomImage.tsで制御される。
 * 
 * ============================================================================
 * 【機能】
 * ============================================================================
 * 
 * - setImageSize: 画像サイズ変更
 * - toggleImageBorder: 枠線トグル
 * - deleteImage: 画像削除（段落ごと削除も対応）
 * - editTitle/editCaption/editTags: メタデータ編集ダイアログ呼び出し
 * - getCurrentImageAttrs: 現在の画像属性取得
 * - selectImageAt: 指定されたDOM要素近傍の画像を認識し選択状態（右辺キャレット）にする
 * 
 * ============================================================================
 */
export const useImageActions = (editor: Editor | null, options: UseImageActionsOptions) => {
    const { openDialog } = options;

    /**
     * 指定されたDOM要素（imgまたはcontainer）または座標から画像を特定し、その右辺にキャレットを配置する
     */
    const selectImageAt = useCallback((target: HTMLElement, event?: React.MouseEvent | MouseEvent) => {
        if (!editor) return false;

        // 1. DOM要素から画像を探す
        // 【修正】無差別な querySelector('img') は親要素クリック時に誤判定を起こすため削除
        const imgElement = target.tagName === 'IMG' 
            ? target 
            : target.closest('img');
        
        const imageContainer = target.closest('.image-container');
        // コンテナが見つかった場合のみ、その中の画像を探す
        const targetImg = imgElement || (imageContainer ? imageContainer.querySelector('img') : null);

        // 2. 座標から画像を探す（フォールバック）
        // DOM要素からの判定に失敗した場合や、より正確な判定が必要な場合に使用
        const coords = event ? { left: event.clientX, top: event.clientY } : null;
        const posAtCoords = coords ? editor.view.posAtCoords(coords) : null;
        
        // 画像と認識される可能性のある条件:
        // - DOM要素として img が見つかった
        // - または、座標の下にあるノードが 'image' 型
        const isImageNodeAtCoords = posAtCoords && editor.state.doc.nodeAt(posAtCoords.pos)?.type.name === 'image';

        if (targetImg || isImageNodeAtCoords) {
            let pos: number | null = null;
            
            if (targetImg) {
                pos = editor.view.posAtDOM(targetImg, 0);
            } else if (posAtCoords) {
                pos = posAtCoords.pos;
            }
            
            if (typeof pos === 'number') {
                let imagePos: number | null = null;
                editor.state.doc.descendants((node, nodePos) => {
                    if (node.type.name === 'image' && imagePos === null) {
                        if (nodePos <= pos && pos <= nodePos + node.nodeSize) {
                            imagePos = nodePos;
                            return false;
                        }
                    }
                    return true;
                });
                
                if (imagePos !== null) {
                    const imageNode = editor.state.doc.nodeAt(imagePos);
                    if (imageNode && imageNode.type.name === 'image') {
                        const imageEndPos = imagePos + imageNode.nodeSize;
                        const tr = editor.state.tr.setSelection(
                            TextSelection.create(editor.state.doc, imageEndPos)
                        );
                        editor.view.dispatch(tr);
                        return true;
                    }
                }
            }
        }
        return false;
    }, [editor]);

    /**
     * 画像サイズを変更
     * 
     * キャレットが画像の直後にある場合、その画像のサイズを変更
     */
    const setImageSize = useCallback((size: 'xs' | 's' | 'm' | 'l' | 'xl') => {
        if (!editor) return;
        
        const { state, view } = editor;
        const { selection } = state;
        const { $from, empty } = selection;
        
        // キャレットの直前のノードが画像かチェック
        if (empty && $from.nodeBefore?.type.name === 'image') {
            const imagePos = $from.pos - $from.nodeBefore.nodeSize;
            const tr = state.tr.setNodeMarkup(imagePos, undefined, {
                ...$from.nodeBefore.attrs,
                size
            });
            view.dispatch(tr);
            toast.success(`サイズを${size.toUpperCase()}に変更しました`);
            return;
        }
        
        // フォールバック: 標準の updateAttributes も試すが、上記が優先される
        editor.chain().focus().updateAttributes('image', { size }).run();
        toast.success(`サイズを${size.toUpperCase()}に変更しました`);
    }, [editor]);

    /**
     * 画像の枠線をトグル
     * 
     * キャレットが画像の直後にある場合、その画像の枠線をトグル
     */
    const toggleImageBorder = useCallback(() => {
        if (!editor) return;
        
        const { state, view } = editor;
        const { selection } = state;
        const { $from, empty } = selection;
        
        // キャレットの直前のノードが画像かチェック
        if (empty && $from.nodeBefore?.type.name === 'image') {
            const imagePos = $from.pos - $from.nodeBefore.nodeSize;
            const currentHasBorder = $from.nodeBefore.attrs.hasBorder;
            const tr = state.tr.setNodeMarkup(imagePos, undefined, {
                ...$from.nodeBefore.attrs,
                hasBorder: !currentHasBorder
            });
            view.dispatch(tr);
            toast.success(currentHasBorder ? '枠線を削除しました' : '枠線を追加しました');
            return;
        }
        
        // フォールバック
        const isBordered = editor.getAttributes('image').hasBorder;
        editor.chain().focus().updateAttributes('image', { hasBorder: !isBordered }).run();
        toast.success(isBordered ? '枠線を削除しました' : '枠線を追加しました');
    }, [editor]);

    /**
     * 画像を削除
     * 
     * キャレットが画像の直後にある場合、その画像を削除
     * 段落が画像のみを含む場合は段落ごと削除
     */
    const deleteImage = useCallback(() => {
        if (!editor) return;
        
        const { state, view } = editor;
        const { selection } = state;
        const { $from, empty } = selection;
        
        // キャレットの直前のノードが画像かチェック
        if (empty && $from.nodeBefore?.type.name === 'image') {
            const parentNode = $from.node($from.depth);
            
            // 段落が画像のみを含む場合、段落ごと削除
            if (parentNode.type.name === 'paragraph' && parentNode.content.size === 1) {
                const parentPos = $from.before($from.depth);
                const tr = state.tr.delete(parentPos, parentPos + parentNode.nodeSize);
                view.dispatch(tr);
                toast.success('画像を削除しました');
                return;
            }
            
            // 画像のみ削除
            const imagePos = $from.pos - $from.nodeBefore.nodeSize;
            const tr = state.tr.delete(imagePos, $from.pos);
            view.dispatch(tr);
            toast.success('画像を削除しました');
            return;
        }
        
        // フォールバック
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
     * 
     * キャレットが画像の直後にある場合、その画像の属性を返す
     * （selectable: falseのため、nodeBeforeから取得）
     */
    const getCurrentImageAttrs = useCallback(() => {
        if (!editor) return null;
        
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        
        // キャレットの直前のノードが画像かチェック
        const nodeBefore = $from.nodeBefore;
        if (nodeBefore?.type.name === 'image') {
            return nodeBefore.attrs;
        }
        
        // フォールバック: getAttributesも試す
        return editor.getAttributes('image');
    }, [editor]);

    return {
        setImageSize,
        toggleImageBorder,
        deleteImage,
        editTitle,
        editCaption,
        editTags,
        getCurrentImageAttrs,
        selectImageAt
    };
};
