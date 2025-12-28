import { useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { TiptapKeyDownHandler } from '@/types/tiptap';

/**
 * IME（日本語入力）制御フック
 * 
 * Safari/Chromeで日本語入力確定時のEnterキーが、
 * 確定後に改行として誤認識される問題を回避します。
 */
export const useIMEControl = () => {
    const isComposingRef = useRef(false);
    const compositionEndTsRef = useRef(0);

    /**
     * エディタインスタンスに対してIMEイベントリスナーを登録する
     * App.tsx の useEffect 内で使用します。
     */
    const registerIME = useCallback((editor: Editor | null) => {
        if (!editor) return;

        const dom = editor.view.dom;
        const handleStart = () => {
            isComposingRef.current = true;
        };
        const handleEnd = () => {
            isComposingRef.current = false;
            compositionEndTsRef.current = Date.now();
        };

        dom.addEventListener('compositionstart', handleStart);
        dom.addEventListener('compositionend', handleEnd);

        return () => {
            dom.removeEventListener('compositionstart', handleStart);
            dom.removeEventListener('compositionend', handleEnd);
        };
    }, []);

    /**
     * Tiptapの editorProps.handleKeyDown で使用するハンドラ
     */
    const handleKeyDown = useCallback<TiptapKeyDownHandler>((_view, event): boolean => {
        // IME入力中かチェック
        if (event.isComposing || event.keyCode === 229 || isComposingRef.current) {
            return false;
        }

        // IME確定直後のEnterキーを無視（50ms以内の判定）
        if (event.key === 'Enter' && (Date.now() - compositionEndTsRef.current < 50)) {
            event.preventDefault();
            return true;
        }

        return false;
    }, []);

    return {
        handleKeyDown,
        registerIME
    };
};
