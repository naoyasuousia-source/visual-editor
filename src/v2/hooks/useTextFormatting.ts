import { Editor } from '@tiptap/react';

/**
 * Text Formatting Hook
 * 
 * テキスト書式設定（太字、斜体、下線、打ち消し線、上付き、下付き）のロジックを管理します。
 * Toolbar.tsx からロジックを分離し、hooks/ に配置することで、
 * rules.md の「ロジックとUIの分離」原則に準拠します。
 * 
 * @param editor - Tiptap エディタインスタンス
 * @returns 書式設定メソッドとアクティブ状態取得メソッド
 */
export const useTextFormatting = (editor: Editor | null) => {
    /**
     * 太字の切り替え
     */
    const toggleBold = () => {
        if (!editor) return;
        editor.chain().focus().toggleBold().run();
    };

    /**
     * 斜体の切り替え
     */
    const toggleItalic = () => {
        if (!editor) return;
        editor.chain().focus().toggleItalic().run();
    };

    /**
     * 下線の切り替え
     */
    const toggleUnderline = () => {
        if (!editor) return;
        editor.chain().focus().toggleUnderline().run();
    };

    /**
     * 打ち消し線の切り替え
     */
    const toggleStrike = () => {
        if (!editor) return;
        editor.chain().focus().toggleStrike().run();
    };

    /**
     * 上付き文字の切り替え
     */
    const toggleSuperscript = () => {
        if (!editor) return;
        editor.chain().focus().toggleSuperscript().run();
    };

    /**
     * 下付き文字の切り替え
     */
    const toggleSubscript = () => {
        if (!editor) return;
        editor.chain().focus().toggleSubscript().run();
    };

    /**
     * 書式がアクティブかどうかを確認
     * @param format - 確認する書式名
     * @returns アクティブな場合true
     */
    const isActive = (format: 'bold' | 'italic' | 'underline' | 'strike' | 'superscript' | 'subscript'): boolean => {
        if (!editor) return false;
        return editor.isActive(format);
    };

    return {
        toggleBold,
        toggleItalic,
        toggleUnderline,
        toggleStrike,
        toggleSuperscript,
        toggleSubscript,
        isActive,
    };
};
