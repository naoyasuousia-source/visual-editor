import React, { useEffect, useState } from 'react';
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
import { Toaster } from 'sonner';

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
import { usePageOperations } from './hooks/usePageOperations';
import { useBrowserCheck } from './hooks/useBrowserCheck';
import { useIMEControl } from './hooks/useIMEControl';
import { usePasteControl } from './hooks/usePasteControl';

export const EditorV3 = () => {
    // Global Store
    const {
        zoomLevel,
        isWordMode,
        activeDialog,
        openDialog,
        closeDialog
    } = useAppStore();

    // Browser Check (ロジック分離)
    const { showWarning: showBrowserWarning, setShowWarning: setShowBrowserWarning } = useBrowserCheck();

    // 一時的なeditorインスタンス（フック初期化のため）
    const [tempEditor, setTempEditor] = useState<any>(null);

    // IME Control (ロジック分離)
    const { handleKeyDown: handleIMEKeyDown, handleCompositionStart, handleCompositionEnd } = useIMEControl(tempEditor);

    // Paste Control (ロジック分離)
    const { handlePaste } = usePasteControl(tempEditor);

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
            // IME制御: V1の堅牢なロジックを使用
            handleKeyDown: handleIMEKeyDown,
            // ペースト制御: 画像の直接ペーストを禁止
            handlePaste: handlePaste,
        },
        onCreate: ({ editor }) => {
            setTempEditor(editor);
        },
    });

    // Page Operations (ロジック分離)
    const { addPage, removePage } = usePageOperations(editor);


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
                onAddPage={addPage}
                onRemovePage={removePage}
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
