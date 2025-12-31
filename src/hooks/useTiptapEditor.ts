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
import { useAppStore } from '@/store/useAppStore';

import { PageExtension } from '@/lib/pageExtension';
import { ParagraphNumbering } from '@/lib/paragraphNumbering';
import { StyleAttributes } from '@/lib/styleAttributes';
import { Pagination } from '@/lib/pagination';
import { CustomImage } from '@/lib/customImage';
import { FirstParagraphProtection } from '@/lib/firstParagraphProtection';
import { CustomDocument } from '@/lib/customDocument';
import { CrossPageMerge } from '@/lib/crossPageMerge';
import { Bookmark } from '@/lib/bookmarkExtension';
import { InlineTab } from '@/lib/inlineTabExtension';
import { ParagraphCommandAttributes } from '@/lib/paragraphCommandAttributes';
import { TiptapKeyDownHandler, TiptapPasteHandler } from '@/types/tiptap';

/**
 * Tiptap Editor Hook
 */
export const useTiptapEditor = (
    handleIMEKeyDown: TiptapKeyDownHandler,
    handlePaste: TiptapPasteHandler,
    transformPastedHTML?: (html: string) => string
) => {
    const { isWordMode } = useAppStore();

    const editor = useEditor({
        extensions: [
            CustomDocument,
            StarterKit.configure({
                document: false,
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
            ParagraphNumbering.configure({ isWordMode }),
            StyleAttributes,
            Pagination.configure({ isWordMode }),
            FirstParagraphProtection,
            CrossPageMerge,
            Bookmark,
            InlineTab,
            ParagraphCommandAttributes,
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
            handleKeyDown: handleIMEKeyDown,
            handlePaste: handlePaste,
            transformPastedHTML: transformPastedHTML,
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
    });

    return editor;
};
