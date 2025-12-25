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
import { ImageContextMenu } from './components/ImageContextMenu';
import { LinkBubbleMenu } from './components/LinkBubbleMenu';
import { LinkDialog } from './components/LinkDialog';
import { ImageTitleDialog } from './components/ImageTitleDialog';
import { ImageCaptionDialog } from './components/ImageCaptionDialog';
import { ImageTagDialog } from './components/ImageTagDialog';
import { ParagraphJumpDialog } from './components/ParagraphJumpDialog';
import { PageNavigator } from './components/PageNavigator';
import { AIImageIndex } from './components/AIImageIndex';

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
          <p data-para="1" id="p1-1"><br></p>
        </div>
      </section>
    `,
        editorProps: {
            attributes: {
                class: 'outline-none',
                spellcheck: 'false',
            },
            handleKeyDown: (view, event) => {
                if (event.key === 'Enter' && (view as any).composing) {
                    return true;
                }
                return false;
            },
        },
    });
 
    const handleAddPage = () => {
        if (editor) {
            const { tr } = editor.state;
            const node = editor.schema.nodes.page.createAndFill({
                class: 'page'
            });
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
        doc.descendants((node, pos) => {
            if (node.type.name === 'page') {
                pages.push({ node, pos });
            }
        });
        if (pages.length === 0) return;
        if (!window.confirm('現在のページを削除してもよろしいですか？')) return;
        
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
        if (currentPageIndex === -1) currentPageIndex = pages.length - 1;

        if (pages.length === 1) {
            const { tr } = editor.state;
            const pageStart = pages[0].pos + 1;
            const pageEnd = pageStart + pages[0].node.content.size;
            tr.replaceWith(pageStart, pageEnd, editor.schema.nodes.paragraph.create());
            editor.view.dispatch(tr);
            toast.info('ページをクリアしました');
            return;
        }

        const { tr } = editor.state;
        const pageToRemove = pages[currentPageIndex];
        tr.delete(pageToRemove.pos, pageToRemove.pos + pageToRemove.node.nodeSize);
        editor.view.dispatch(tr);
        toast.success('ページを削除しました');
    };

    useEffect(() => {
        if (editor) {
            editor.setOptions({
                paragraphNumbering: { isWordMode },
            } as any);
        }
    }, [isWordMode, editor]);

    return (
        <div className="flex flex-col h-screen bg-[#525659] overflow-hidden font-sans">
            <Toolbar
                editor={editor}
                onAddPage={handleAddPage}
                onRemovePage={handleRemovePage}
            />
            
            <div className="flex flex-1 overflow-hidden relative">
                {editor && <PageNavigator editor={editor} />}
                
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 scroll-smooth">
                    <div 
                        className={`flex flex-col gap-8 transition-transform duration-200 ${isWordMode ? 'mode-word' : ''}`} 
                        style={{ 
                            transform: `scale(${zoomLevel / 100})`, 
                            transformOrigin: 'top center' 
                        }}
                    >
                        {editor && (
                            <>
                                <ImageBubbleMenu
                                    editor={editor}
                                    onEditTitle={() => openDialog('image-title')}
                                    onEditCaption={() => openDialog('image-caption')}
                                    onEditTag={() => openDialog('image-tag')}
                                />
                                <ImageContextMenu editor={editor} />
                                <LinkBubbleMenu editor={editor} onEdit={() => openDialog('link')} />
                                <AIImageIndex editor={editor} />
                                <EditorContent editor={editor} />
                            </>
                        )}
                    </div>
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
