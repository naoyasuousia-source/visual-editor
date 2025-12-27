import React, { useEffect, useState } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import { Toaster } from 'sonner';

import { Toolbar } from '@/components/features/Toolbar';
import { ImageBubbleMenu } from '@/components/common/editor-menus/ImageBubbleMenu';
import { ImageContextMenu } from '@/components/common/editor-menus/ImageContextMenu';
import { LinkBubbleMenu } from '@/components/common/editor-menus/LinkBubbleMenu';
import { PageNavigator } from '@/components/features/PageNavigator';
import { AIImageIndex } from '@/components/features/AIImageIndex';
import { DialogGroup } from '@/components/common/DialogGroup';

import { useAppStore } from '@/store/useAppStore';
import { usePageOperations } from '@/hooks/usePageOperations';
import { useBrowserCheck } from '@/hooks/useBrowserCheck';
import { useIMEControl } from '@/hooks/useIMEControl';
import { usePasteControl } from '@/hooks/usePasteControl';
import { useDialogs } from '@/hooks/useDialogs';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useImageIndex } from '@/hooks/useImageIndex';
import { useFileIO } from '@/hooks/useFileIO';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';

/**
 * EditorV3 - V2エディタのメインコンポーネント
 * 
 * Tiptapベースのリッチテキストエディタを提供します。
 * このコンポーネントは以下の責務を持ちます:
 * - Tiptapエディタインスタンスの初期化と管理
 * - グローバル状態（Zustand）との連携
 * - 各種フック（IME制御、ペースト制御、ファイルIO等）の統合
 * - UI要素（ツールバー、ダイアログ、メニュー等）の配置
 * 
 * ビジネスロジックは全て hooks/ に分離されており、
 * このコンポーネントは純粋なUI統合レイヤーとして機能します。
 */
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
    const [tempEditor, setTempEditor] = useState<Editor | null>(null);

    // IME Control (ロジック分離)
    const { handleKeyDown: handleIMEKeyDown, handleCompositionStart, handleCompositionEnd } = useIMEControl(tempEditor);

    // Paste Control (ロジック分離)
    const { handlePaste } = usePasteControl(tempEditor);

    // Tiptap Editor (ロジック分離)
    const editor = useTiptapEditor(handleIMEKeyDown, handlePaste, (editor) => {
        setTempEditor(editor);
    });

    // Dialogs (ロジック分離)
    const { confirm, prompt, confirmState, promptState, handleConfirmClose, handlePromptClose } = useDialogs();

    // Page Operations (ロジック分離)
    const { addPage, removePage } = usePageOperations(editor, { confirm });

    // Image Index (ロジック分離)
    const { rebuildImageIndex, updateImageMeta } = useImageIndex(editor, isWordMode);

    // File IO (ロジック分離)
    const { saveFile, saveAsFile, downloadFile, openFileWithHandle } = useFileIO(editor, isWordMode);
    const { currentFileHandle } = useAppStore();

    // Word Mode 同期: Tiptap外部ライブラリの設定を同期
    useEffect(() => {
        if (editor) {
            // @ts-expect-error - Tiptapの型定義が不完全なため
            editor.setOptions({
                paragraphNumbering: { isWordMode },
            });
        }
    }, [isWordMode, editor]);

    // Keyboard Shortcuts (ロジック分離)
    useKeyboardShortcuts(saveFile, saveAsFile, downloadFile, openFileWithHandle, currentFileHandle);

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
                        } as React.CSSProperties}
                    >
                        {editor && (
                            <>
                                <ImageBubbleMenu
                                    editor={editor}
                                    onEditTitle={() => openDialog('image-title')}
                                    onEditCaption={() => openDialog('image-caption')}
                                    onEditTag={() => openDialog('image-tag')}
                                />
                                <LinkBubbleMenu editor={editor} />
                                <AIImageIndex editor={editor} />
                                <ImageContextMenu editor={editor}>
                                    <EditorContent editor={editor} />
                                </ImageContextMenu>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* All Dialogs */}
            <DialogGroup
                editor={editor}
                activeDialog={activeDialog}
                closeDialog={closeDialog}
                showBrowserWarning={showBrowserWarning}
                setShowBrowserWarning={setShowBrowserWarning}
                confirmState={confirmState}
                promptState={promptState}
                handleConfirmClose={handleConfirmClose}
                handlePromptClose={handlePromptClose}
            />

            <Toaster position="top-center" richColors />
        </div>
    );
};

export default EditorV3;
