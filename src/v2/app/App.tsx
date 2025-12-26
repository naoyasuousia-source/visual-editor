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

import { PageExtension } from '@/lib/pageExtension';
import { ParagraphNumbering } from '@/lib/paragraphNumbering';
import { StyleAttributes } from '@/lib/styleAttributes';
import { Pagination } from '@/lib/pagination';
import { CustomImage } from '@/lib/customImage';
import { FirstParagraphProtection } from '@/lib/firstParagraphProtection';
import { CustomDocument } from '@/lib/customDocument';
import { CrossPageMerge } from '@/lib/crossPageMerge';

import { Toolbar } from '@/components/features/Toolbar';
import { HelpDialog } from '@/components/common/dialogs/HelpDialog';
import { SubHelpDialog } from '@/components/common/dialogs/SubHelpDialog';
import { BrowserWarningDialog } from '@/components/common/dialogs/BrowserWarningDialog';
import { DonateDialog } from '@/components/common/dialogs/DonateDialog';
import { ImageBubbleMenu } from '@/components/common/editor-menus/ImageBubbleMenu';
import { ImageContextMenu } from '@/components/common/editor-menus/ImageContextMenu';
import { LinkBubbleMenu } from '@/components/common/editor-menus/LinkBubbleMenu';
import { LinkDialog } from '@/components/common/dialogs/LinkDialog';
import { ImageTitleDialog } from '@/components/common/dialogs/ImageTitleDialog';
import { ImageCaptionDialog } from '@/components/common/dialogs/ImageCaptionDialog';
import { ImageTagDialog } from '@/components/common/dialogs/ImageTagDialog';
import { ParagraphJumpDialog } from '@/components/common/dialogs/ParagraphJumpDialog';
import { PageNavigator } from '@/components/features/PageNavigator';
import { AIImageIndex } from '@/components/features/AIImageIndex';

import { useAppStore } from '@/store/useAppStore';
import { usePageOperations } from '@/hooks/usePageOperations';
import { useBrowserCheck } from '@/hooks/useBrowserCheck';
import { useIMEControl } from '@/hooks/useIMEControl';
import { usePasteControl } from '@/hooks/usePasteControl';
import { useDialogs } from '@/hooks/useDialogs';
import { useImageIndex } from '@/hooks/useImageIndex';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PromptDialog } from '@/components/ui/PromptDialog';

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
            CustomDocument, // カスタムDocument: doc > page+
            StarterKit.configure({
                document: false, // デフォルトのDocumentを無効化
            }),
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
            FirstParagraphProtection,
            CrossPageMerge,
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
        },
        onCreate: ({ editor }) => {
            setTempEditor(editor);
        },
    });

    // Dialogs (ロジック分離)
    const { confirm, prompt, confirmState, promptState, handleConfirmClose, handlePromptClose } = useDialogs();

    // Page Operations (ロジック分離)
    const { addPage, removePage } = usePageOperations(editor, { confirm });

    // Image Index (ロジック分離)
    const { rebuildImageIndex, updateImageMeta } = useImageIndex(editor, isWordMode);


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
                prompt={prompt}
            />
            
            <div className="flex flex-1 overflow-hidden relative">
                {editor && <PageNavigator editor={editor} />}
                
                <div className="flex-1 overflow-auto p-12 scroll-smooth">
                    <div 
                        className={`flex flex-col gap-6 transition-all duration-200 mx-auto ${isWordMode ? 'mode-word' : ''}`} 
                        style={{ 
                            width: '210mm',
                            zoom: zoomLevel / 100,
                        } as any}
                    >
                        {editor && (
                            <>
                                <ImageBubbleMenu
                                    editor={editor}
                                    onEditTitle={() => openDialog('image-title')}
                                    onEditCaption={() => openDialog('image-caption')}
                                    onEditTag={() => openDialog('image-tag')}
                                />
                                <LinkBubbleMenu editor={editor} onEdit={() => openDialog('link')} />
                                <AIImageIndex editor={editor} />
                                <ImageContextMenu editor={editor}>
                                    <EditorContent editor={editor} />
                                </ImageContextMenu>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <HelpDialog open={activeDialog === 'help'} onClose={closeDialog} />
            <SubHelpDialog />
            <BrowserWarningDialog isOpen={showBrowserWarning} onClose={() => setShowBrowserWarning(false)} />
            <DonateDialog open={activeDialog === 'donate'} onClose={closeDialog} />
            {editor && (
                <>
                    <LinkDialog open={activeDialog === 'link'} editor={editor} onClose={closeDialog} />
                    <ImageTitleDialog open={activeDialog === 'image-title'} editor={editor} onClose={closeDialog} />
                    <ImageCaptionDialog open={activeDialog === 'image-caption'} editor={editor} onClose={closeDialog} />
                    <ImageTagDialog open={activeDialog === 'image-tag'} editor={editor} onClose={closeDialog} />
                    <ParagraphJumpDialog open={activeDialog === 'paragraph-jump'} editor={editor} onClose={closeDialog} />
                </>
            )}

            {/* Confirm & Prompt Dialogs */}
            {confirmState.options && (
                <ConfirmDialog
                    open={confirmState.open}
                    onOpenChange={(open) => !open && handleConfirmClose(false)}
                    title={confirmState.options.title}
                    description={confirmState.options.description}
                    confirmText={confirmState.options.confirmText}
                    cancelText={confirmState.options.cancelText}
                    variant={confirmState.options.variant}
                    onConfirm={() => handleConfirmClose(true)}
                />
            )}
            {promptState.options && (
                <PromptDialog
                    open={promptState.open}
                    onOpenChange={(open) => !open && handlePromptClose(null)}
                    title={promptState.options.title}
                    description={promptState.options.description}
                    placeholder={promptState.options.placeholder}
                    defaultValue={promptState.options.defaultValue}
                    confirmText={promptState.options.confirmText}
                    cancelText={promptState.options.cancelText}
                    inputType={promptState.options.inputType}
                    onConfirm={(value) => handlePromptClose(value)}
                />
            )}

            <Toaster position="top-center" richColors />
        </div>
    );
};

export default EditorV3;
