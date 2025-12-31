import { useCallback } from 'react';
import { Editor } from '@tiptap/react';

interface LinkActionsOptions {
    prompt: (options: {
        title: string;
        description?: string;
        placeholder?: string;
        inputType?: 'text' | 'url';
    }) => Promise<string | null>;
}

/**
 * リンク操作用フック
 * 
 * rules.md に基づき、ビジネスロジックをコンポーネントから分離し、
 * Tiptapコマンドを介して宣言的に操作を行います。
 */
export function useLinkActions(editor: Editor | null, options?: LinkActionsOptions) {
    /**
     * ブックマークIDを生成
     */
    const generateBookmarkId = useCallback(() => {
        return `bm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }, []);

    /**
     * リンク先（ブックマーク）の候補を取得
     */
    const getBookmarkOptions = useCallback(() => {
        if (!editor) return [];
        const { state } = editor;
        const bookmarks: Array<{ id: string; text: string }> = [];
        
        state.doc.descendants((node) => {
            if (node.marks) {
                node.marks.forEach(mark => {
                    if (mark.type.name === 'bookmark' && mark.attrs.id) {
                        const text = node.textContent.substring(0, 50) || '(空の段落)';
                        if (!bookmarks.find(b => b.id === mark.attrs.id)) {
                            bookmarks.push({ id: mark.attrs.id, text });
                        }
                    }
                });
            }
        });
        return bookmarks;
    }, [editor]);

    /**
     * リンク先に追加（選択範囲にブックマークIDを付与）
     */
    const addLinkDestination = useCallback(async () => {
        if (!editor) return;

        const { from, to } = editor.state.selection;
        if (from === to) {
            // 本来はカスタムダイアログを使うべきだが、簡易的に既存の仕組みを想定
            alert('テキストを選択してください。');
            return;
        }

        const bookmarkId = generateBookmarkId();
        editor.commands.setBookmark(bookmarkId);
    }, [editor, generateBookmarkId]);

    /**
     * リンクを生成（選択範囲から既存のブックマークへのリンクを作成）
     */
    const createLink = useCallback(async () => {
        if (!editor || !options?.prompt) return;

        const { from, to } = editor.state.selection;
        if (from === to) {
            alert('リンクにしたいテキストを選択してください。');
            return;
        }

        const bookmarks = getBookmarkOptions();
        if (bookmarks.length === 0) {
            alert('リンク先が登録されていません。');
            return;
        }

        let promptMessage = 'どのリンク先にリンクしますか？番号を入力してください。\n\n';
        bookmarks.forEach((bookmark, index) => {
            promptMessage += `${index + 1}: ${bookmark.text}\n`;
        });

        const choice = await options.prompt({
            title: 'リンクの作成',
            description: promptMessage,
            placeholder: '番号を入力',
        });

        if (!choice) return;

        const choiceNum = parseInt(choice.trim(), 10);
        if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > bookmarks.length) {
            alert('無効な番号です。');
            return;
        }

        const selectedBookmark = bookmarks[choiceNum - 1];
        
        editor.chain()
            .focus()
            .setLink({ href: `#${selectedBookmark.id}` })
            .run();
    }, [editor, options, getBookmarkOptions]);

    /**
     * 既存のリンクの遷移先を変更
     */
    const changeLinkDestination = useCallback(async (hoveredLink?: HTMLAnchorElement) => {
        if (!editor || !options?.prompt) return;

        const bookmarks = getBookmarkOptions();
        if (bookmarks.length === 0) {
            alert('リンク先が登録されていません。');
            return;
        }

        let promptMessage = 'どのリンク先に変更しますか？番号を入力してください。\n\n';
        bookmarks.forEach((bookmark, index) => {
            promptMessage += `${index + 1}: ${bookmark.text}\n`;
        });

        const choice = await options.prompt({
            title: 'リンク先の変更',
            description: promptMessage,
            placeholder: '番号を入力',
        });

        if (!choice) return;

        const choiceNum = parseInt(choice.trim(), 10);
        if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > bookmarks.length) {
            alert('無効な番号です。');
            return;
        }

        const selectedBookmark = bookmarks[choiceNum - 1];
        
        if (hoveredLink) {
            // DOMを直接いじらず、Tiptapのコマンドで更新する
            // リンクにカーソルを合わせてから更新
            editor.chain().focus().extendMarkRange('link').setLink({ href: `#${selectedBookmark.id}` }).run();
        } else {
            editor.chain().focus().setLink({ href: `#${selectedBookmark.id}` }).run();
        }
    }, [editor, options, getBookmarkOptions]);

    /**
     * リンクを解除
     */
    const removeLink = useCallback((hoveredLink?: HTMLAnchorElement) => {
        if (!editor) return;

        if (hoveredLink) {
            // ホバー中のリンクを解除
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            // 選択範囲のリンクを解除
            editor.chain().focus().unsetLink().run();
        }
    }, [editor]);

    return {
        addLinkDestination,
        createLink,
        changeLinkDestination,
        removeLink
    };
}
