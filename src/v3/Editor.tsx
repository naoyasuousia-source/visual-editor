import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

// 後ほど作成するカスタム拡張
// import { PageExtension } from './extensions/PageExtension';
// import { ParagraphNumbering } from './extensions/ParagraphNumbering';

export const Editor = () => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // ページネーションを自前で制御するため標準のDocumentではなくカスタムDocを使用する可能性あり
                // 一旦はデフォルト
            }),
            Underline,
            Subscript,
            Superscript,
            Link.configure({
                openOnClick: false,
            }),
            Image,
        ],
        content: '<p>エディタの準備中...</p>',
        editorProps: {
            attributes: {
                class: 'page-inner', // 既存CSSの適用先
            },
        },
    });

    return (
        <div id="workspace">
            <div id="pages-container">
                {/* TODO: ページごとのループ処理 */}
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};
