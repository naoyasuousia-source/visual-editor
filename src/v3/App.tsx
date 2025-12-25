import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
import { Toaster, toast } from 'sonner';

import { PageExtension } from './extensions/PageExtension';
import { ParagraphNumbering } from './extensions/ParagraphNumbering';
import { StyleAttributes } from './extensions/StyleAttributes';
import { Pagination } from './extensions/Pagination';
import { CustomImage } from './extensions/CustomImage';

import { Toolbar } from './components/Toolbar';
import { HelpDialog } from './components/HelpDialog';
import { DonateDialog } from './components/DonateDialog';
import { ImageBubbleMenu } from './components/ImageBubbleMenu';
import { LinkBubbleMenu } from './components/LinkBubbleMenu';
import { LinkDialog } from './components/LinkDialog';
import { ImageTitleDialog } from './components/ImageTitleDialog';
import { ImageCaptionDialog } from './components/ImageCaptionDialog';
import { ImageTagDialog } from './components/ImageTagDialog';
import { ParagraphJumpDialog } from './components/ParagraphJumpDialog';
import { PageNavigator } from './components/PageNavigator';

import { useAppStore } from './store/useAppStore';

export const EditorV3 = () => {
    // Global Store
    const {
        zoomLevel,
        isWordMode,
        activeDialog,
        openDialog,
        closeDialog
    } = useAppStore();

    useEffect(() => {
        // Toggle body class for Word Mode styling
        if (isWordMode) {
            document.body.classList.add('mode-word');
            document.body.classList.remove('mode-standard');
        } else {
            document.body.classList.add('mode-standard');
            document.body.classList.remove('mode-word');
        }
    }, [isWordMode]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'j') {
                e.preventDefault();
                openDialog('paragraph-jump');
            }
            // Word Mode: Disable Tab key
            if (isWordMode && e.key === 'Tab') {
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isWordMode, openDialog]);

    const handleAddPage = () => {
        // Insert a new page node at the end
        if (editor) {
            const { tr } = editor.state;
            const node = editor.schema.nodes.page.createAndFill();
            if (node) {
                const endPos = editor.state.doc.content.size;
                editor.view.dispatch(tr.insert(endPos, node));
                toast.success('ページを追加しました');
            }
        }
    };

    const handleRemovePage = () => {
        // Placeholder for page removal logic
        if (editor) {
            toast.info("ページ削除機能は現在実装中です。");
        }
    };

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Subscript,
            Superscript,
            Link.configure({ openOnClick: false }),
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
        ],
        content: `
      <section class="page" data-page="1">
        <div class="page-inner">
          <p data-para="1" id="p1-1">React + Tiptap版エディタへようこそ。</p>
          <img src="/image/logo-himawari.png" class="img-m" />
          <p data-para="2" id="p1-2" class="inline-align-center">これは中央揃えの段落です。</p>
          <p data-para="3" id="p1-3">詳細は <a href="https://example.com">こちら</a> をご覧ください。</p>
        </div>
      </section>
    `,
    });

    return (
        <div id="left">
            <Toolbar
                editor={editor}
                onAddPage={handleAddPage}
                onRemovePage={handleRemovePage}
            />
            <div id="workspace">
                <PageNavigator editor={editor} />
                <div id="pages-container" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
                    {editor && (
                        <>
                            <ImageBubbleMenu
                                editor={editor}
                                onEditTitle={() => openDialog('image-title')}
                                onEditCaption={() => openDialog('image-caption')}
                                onEditTag={() => openDialog('image-tag')}
                            />
                            <LinkBubbleMenu editor={editor} onEdit={() => openDialog('link')} />
                        </>
                    )}
                    <EditorContent editor={editor} />
                </div>
            </div>

            {activeDialog === 'help' && <HelpDialog onClose={closeDialog} />}
            {activeDialog === 'donate' && <DonateDialog onClose={closeDialog} />}
            {activeDialog === 'link' && editor && <LinkDialog editor={editor} onClose={closeDialog} />}
            {activeDialog === 'image-title' && editor && <ImageTitleDialog editor={editor} onClose={closeDialog} />}
            {activeDialog === 'image-caption' && editor && <ImageCaptionDialog editor={editor} onClose={closeDialog} />}
            {activeDialog === 'image-tag' && editor && <ImageTagDialog editor={editor} onClose={closeDialog} />}
            {activeDialog === 'paragraph-jump' && editor && <ParagraphJumpDialog editor={editor} onClose={closeDialog} />}
            <Toaster position="top-center" richColors />
        </div>
    );
};

export default EditorV3;
