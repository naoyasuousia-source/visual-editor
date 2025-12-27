import { useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { TiptapKeyDownHandler } from '@/types/tiptap';

/**
 * IME（日本語入力）制御フック
 * V1の events.ts の IME制御ロジックを再現
 * 
 * 【問題】
 * Safari/Chromeで日本語入力確定時のEnterキーが、
 * 確定後に改行として誤認識される問題を回避
 * 
 * 【解決策】
 * compositionend イベント後50ms以内のEnterキーを無視
 */
export const useIMEControl = (editor: Editor | null) => {
    const isComposingRef = useRef(false);
    const compositionEndTsRef = useRef(0);

    /**
     * Tiptapの editorProps.handleKeyDown で使用するハンドラ
     */
    const handleKeyDown = useCallback<TiptapKeyDownHandler>((view, event): boolean => {
        // IME入力中かチェック
        if (event.isComposing || event.keyCode === 229 || isComposingRef.current) {
            return false; // Tiptapのデフォルト処理を継続
        }

        // IME確定直後のEnterキーを無視
        if (event.key === 'Enter' && (Date.now() - compositionEndTsRef.current < 50)) {
            event.preventDefault();
            return true; // イベントを処理済みとしてマーク
        }

        return false; // Tiptapのデフォルト処理を継続
    }, []);

    /**
     * compositionstart イベントハンドラ
     */
    const handleCompositionStart = useCallback(() => {
        isComposingRef.current = true;
    }, []);

    /**
     * compositionend イベントハンドラ
     */
    const handleCompositionEnd = useCallback(() => {
        isComposingRef.current = false;
        compositionEndTsRef.current = Date.now();
    }, []);

    return {
        handleKeyDown,
        handleCompositionStart,
        handleCompositionEnd
    };
};
