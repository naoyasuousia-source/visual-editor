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
export const useIMEControl = () => {
    const isComposingRef = useRef(false);
    const compositionEndTsRef = useRef(0);

    // 文脈：これらのハンドラは、実際のDOMイベントリスナーとして登録する必要があります。
    // Tiptapの editorProps.handleKeyDown だけでは compositionstart/end を捕捉できません。
    // そのため、useEffect等でエディタのDOM要素に直接登録することを検討します。

    /**
     * Tiptapの editorProps.handleKeyDown で使用するハンドラ
     */
    const handleKeyDown = useCallback<TiptapKeyDownHandler>((_view, event): boolean => {
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

    return {
        handleKeyDown,
        isComposingRef,
        compositionEndTsRef
    };
};
