import { useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { useAppStore } from '@/store/useAppStore';

const HIGHLIGHT_STYLE_ID = 'auto-edit-highlight-styles';
const HIGHLIGHT_CSS = `
  .auto-edit-highlight {
    background-color: #fef08a !important;
    transition: background-color 0.3s ease;
    display: inline;
  }
`;

/**
 * グローバルなスタイル同期とエディタ設定を担当するフック
 * 
 * rules.md の「ロジックとUIの分離」に従い、App.tsx 内で行われていた
 * 直接的なDOM操作やエディタの動的な設定変更をここに集約します。
 * 
 * @param editor Tiptapエディタインスタンス
 */
export const useGlobalStyles = (editor: Editor | null) => {
    const { isWordMode, pageMargin } = useAppStore();

    /**
     * Wordモードの状態を body クラスおよびエディタオプションに同期
     */
    useEffect(() => {
        if (isWordMode) {
            document.body.classList.add('mode-word');
        } else {
            document.body.classList.remove('mode-word');
        }

        if (editor) {
            // Tiptap拡張機能（ParagraphNumbering, Pagination）に対して Wordモードの状態を伝播
            // @ts-expect-error - 拡張機能の型定義が不完全なため
            editor.setOptions({
                paragraphNumbering: { isWordMode },
                pagination: { isWordMode },
            });
        }
    }, [isWordMode, editor]);

    /**
     * ページマージンの設定を CSS 変数に同期
     */
    useEffect(() => {
        const marginMap = { s: '12mm', m: '17mm', l: '24mm' };
        document.documentElement.style.setProperty('--page-margin', marginMap[pageMargin]);
    }, [pageMargin]);

    /**
     * ハイライト用の共通スタイルを注入
     */
    useEffect(() => {
        if (!document.getElementById(HIGHLIGHT_STYLE_ID)) {
            const style = document.createElement('style');
            style.id = HIGHLIGHT_STYLE_ID;
            style.textContent = HIGHLIGHT_CSS;
            document.head.appendChild(style);
        }
    }, []);
};
