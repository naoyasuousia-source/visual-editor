import { Editor } from '@tiptap/react';

/**
 * ブックマークIDを生成
 */
function generateBookmarkId(): string {
    return `bm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * リンク先に追加（選択範囲にブックマークIDを付与）
 * Tiptap Bookmark拡張を使用
 */
export function addLinkDestination(editor: Editor | null): void {
    if (!editor) return;

    const { state } = editor;
    const { from, to } = state.selection;

    if (from === to) {
        alert('テキストを選択してください。');
        return;
    }

    const bookmarkId = generateBookmarkId();
    
    // Bookmark拡張のコマンドを使用
    (editor.commands as any).setBookmark(bookmarkId);
    
    alert(`リンク先を追加しました`);
}

/**
 * リンクを生成（既存のブックマークへのリンクを作成）
 */
export function createLink(editor: Editor | null): void {
    if (!editor) return;

    const { state } = editor;
    const { from, to } = state.selection;

    if (from === to) {
        alert('リンクにしたいテキストを選択してください。');
        return;
    }

    // エディタのドキュメント内の全ブックマークを検索
    const bookmarks: Array<{ id: string; text: string }> = [];
    
    state.doc.descendants((node) => {
        if (node.marks) {
            node.marks.forEach(mark => {
                if (mark.type.name === 'bookmark' && mark.attrs.id) {
                    const text = node.textContent.substring(0, 50);
                    // 重複を避ける
                    if (!bookmarks.find(b => b.id === mark.attrs.id)) {
                        bookmarks.push({ id: mark.attrs.id, text });
                    }
                }
            });
        }
    });

    if (bookmarks.length === 0) {
        alert('リンク先が登録されていません。');
        return;
    }

    let promptMessage = 'どのリンク先にリンクしますか？番号を入力してください。\n\n';
    bookmarks.forEach((bookmark, index) => {
        promptMessage += `${index + 1}: ${bookmark.text}\n`;
    });

    const choice = window.prompt(promptMessage);
    if (!choice) return;

    const choiceNum = parseInt(choice.trim(), 10);
    if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > bookmarks.length) {
        alert('無効な番号です。');
        return;
    }

    const selectedBookmark = bookmarks[choiceNum - 1];
    
    // リンクを設定
    editor.chain()
        .focus()
        .setLink({ href: `#${selectedBookmark.id}` })
        .run();
}

/**
 * リンクを削除
 */
export function removeLink(editor: Editor | null): void {
    if (!editor) return;

    const { state } = editor;
    
    // エディタのドキュメント内の全リンクを検索
    const links: Array<{ href: string; text: string }> = [];
    
    state.doc.descendants((node) => {
        if (node.marks) {
            node.marks.forEach(mark => {
                if (mark.type.name === 'link' && mark.attrs.href?.startsWith('#bm-')) {
                    const text = node.textContent.substring(0, 50);
                    // 重複を避ける
                    if (!links.find(l => l.href === mark.attrs.href)) {
                        links.push({ href: mark.attrs.href, text });
                    }
                }
            });
        }
    });

    if (links.length === 0) {
        alert('削除できるリンクがありません。');
        return;
    }

    let promptMessage = 'どのリンクを削除しますか？番号を入力してください。\n\n';
    links.forEach((link, index) => {
        promptMessage += `${index + 1}: ${link.text}\n`;
    });

    const choice = window.prompt(promptMessage);
    if (!choice) return;

    const choiceNum = parseInt(choice.trim(), 10);
    if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > links.length) {
        alert('無効な番号です。');
        return;
    }

    // 選択されたリンクを削除
    editor.chain()
        .focus()
        .unsetLink()
        .run();
}
