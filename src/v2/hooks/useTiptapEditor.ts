import { useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';

import { PageExtension } from '@/lib/pageExtension';
import { ParagraphNumbering } from '@/lib/paragraphNumbering';
import { StyleAttributes } from '@/lib/styleAttributes';
import { Pagination } from '@/lib/pagination';
import { CustomImage } from '@/lib/customImage';
import { FirstParagraphProtection } from '@/lib/firstParagraphProtection';
import { CustomDocument } from '@/lib/customDocument';
import { CrossPageMerge } from '@/lib/crossPageMerge';
import { Bookmark } from '@/lib/bookmarkExtension';
import { TiptapKeyDownHandler, TiptapPasteHandler } from '@/types/tiptap';

/**
 * Tiptap Editor Hook
 * 
 * Tiptapエディタインスタンスの初期化とライフサイクル管理を行います。
 * App.tsx からエディタ設定ロジックを分離し、hooks/ に配置することで、
 * rules.md の「Reactライブラリの外部化（Encapsulation）」原則に準拠します。
 * 
 * @param handleIMEKeyDown - IME制御のキーダウンハンドラ
 * @param handlePaste - ペースト制御ハンドラ
 * @param onEditorCreate - エディタ作成時のコールバック
 * @returns Tiptap Editor インスタンス
 */
export const useTiptapEditor = (
    handleIMEKeyDown: TiptapKeyDownHandler,
    handlePaste: TiptapPasteHandler,
    onEditorCreate?: (editor: Editor) => void
) => {
    const editor = useEditor({
        extensions: [
            CustomDocument, // カスタムDocument: doc > page+
            StarterKit.configure({
                document: false, // デフォルトのDocumentを無効化
            }),
            Underline,
            Subscript,
            Superscript,
            Link.configure({ 
                openOnClick: true,
                HTMLAttributes: {
                    class: 'text-blue-600 underline cursor-pointer',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right'],
            }),
            TextStyle,
            FontFamily,
            Color,
            Highlight.configure({ multicolor: true }),
            CustomImage,
            PageExtension,
            ParagraphNumbering,
            StyleAttributes,
            Pagination,
            FirstParagraphProtection,
            CrossPageMerge,
            Bookmark,
        ],
        content: `
      <section class="page" data-page="1">
        <p data-para="1" id="p1-1"></p>
      </section>
    `,
        editorProps: {
            attributes: {
                class: 'outline-none',
                spellcheck: 'false',
            },
            // IME制御: V1の堅牢なロジックを使用
            handleKeyDown: handleIMEKeyDown,
            // ペースト制御: 画像の直接ペーストを禁止
            handlePaste: handlePaste,
            // リンククリック制御: 内部リンクはスクロール
            handleClick: (view, pos, event) => {
                const target = event.target as HTMLElement;
                const link = target.closest('a');
                if (link) {
                    const href = link.getAttribute('href');
                    if (href?.startsWith('#bm-')) {
                        event.preventDefault();
                        const bookmarkId = href.substring(1);
                        const bookmark = view.dom.querySelector(`#${bookmarkId}`);
                        if (bookmark) {
                            bookmark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        return true;
                    }
                }
                return false;
            },
        },
        onCreate: ({ editor }) => {
            if (onEditorCreate) {
                onEditorCreate(editor);
            }
        },
    });

    return editor;
};
