import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

import { PageExtension } from './extensions/PageExtension';
import { ParagraphNumbering } from './extensions/ParagraphNumbering';
import { Toolbar } from './components/Toolbar';

export const EditorV3 = () => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Subscript,
            Superscript,
            Link.configure({ openOnClick: false }),
            Image,
            PageExtension,
            ParagraphNumbering,
        ],
        content: `
      <section class="page" data-page="1">
        <div class="page-inner">
          <p data-para="1" id="p1-1">React + Tiptap 移行中の新エディタです。</p>
        </div>
      </section>
    `,
        editorProps: {
            attributes: {
                class: 'pages-container', // ここは親コンテナ
            },
        },
    });

    return (
        <div id="left">
            <Toolbar editor={editor} />
            <div id="workspace">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default EditorV3;
