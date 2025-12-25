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
import { SubHelpDialog } from './components/SubHelpDialog';
import { BrowserWarningDialog } from './components/BrowserWarningDialog';
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

    const [showBrowserWarning, setShowBrowserWarning] = useState(false);

    // Browser Support Check
    useEffect(() => {
        const ua = navigator.userAgent;
        const vendor = navigator.vendor || '';

        const isEdge = /Edg/.test(ua);
        const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua) && !/OPR/.test(ua);
        const isApple = /Apple Computer/.test(vendor);
        let isSupported = isEdge || (isChrome && !isApple);

        if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Edg')) {
            isSupported = false;
        }

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        if (isMobile) {
            isSupported = false;
        }

        if (!isSupported) {
            setShowBrowserWarning(true);
        }
    }, []);

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
        if (!editor) return;

        const { doc } = editor.state;
        const pages: any[] = [];

        // Find all page nodes
        doc.descendants((node, pos) => {
            if (node.type.name === 'page') {
                pages.push({ node, pos });
            }
        });

        if (pages.length === 0) {
            toast.error('削除するページがありません');
            return;
        }

        // Confirmation
        if (!window.confirm('現在のページを削除してもよろしいですか？この操作は取り消せません。')) {
            return;
        }

        // Find current page based on selection
        const { from } = editor.state.selection;
        let currentPageIndex = -1;

        for (let i = 0; i < pages.length; i++) {
            const pageStart = pages[i].pos;
            const pageEnd = pageStart + pages[i].node.nodeSize;
            if (from >= pageStart && from < pageEnd) {
                currentPageIndex = i;
                break;
            }
        }

        // Default to last page if no current page found
        if (currentPageIndex === -1) {
            currentPageIndex = pages.length - 1;
        }

        // If only one page, just clear its content
        if (pages.length === 1) {
            const { tr } = editor.state;
            const pageStart = pages[0].pos + 1; // +1 to get inside the page
            const pageEnd = pageStart + pages[0].node.content.size;

            // Clear content and insert empty paragraph
            const emptyParagraph = editor.schema.nodes.paragraph.create();
            tr.replaceWith(pageStart, pageEnd, emptyParagraph);
            editor.view.dispatch(tr);
            toast.info('ページ内容をクリアしました');
            return;
        }

        // Remove the current page
        const { tr } = editor.state;
        const pageToRemove = pages[currentPageIndex];
        tr.delete(pageToRemove.pos, pageToRemove.pos + pageToRemove.node.nodeSize);
        editor.view.dispatch(tr);

        // Set focus to previous page (or first page if removing first page)
        const newPageIndex = Math.max(0, currentPageIndex - 1);
        setTimeout(() => {
            if (editor) {
                const newPos = pages[newPageIndex]?.pos || 0;
                editor.commands.focus();
                editor.commands.setTextSelection(newPos + 2); // +2 to position inside page
            }
        }, 50);

        toast.success('ページを削除しました');
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
            <SubHelpDialog />
            <BrowserWarningDialog isOpen={showBrowserWarning} onClose={() => setShowBrowserWarning(false)} />
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
