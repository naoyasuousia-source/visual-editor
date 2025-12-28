import React, { useEffect, useState } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import { Toaster } from 'sonner';

import { Toolbar } from '@/components/features/Toolbar';
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
        closeDialog
    } = useAppStore();

    // Browser Check (ロジック分離)
    const { showWarning: showBrowserWarning, setShowWarning: setShowBrowserWarning } = useBrowserCheck();

    // IME Control (ロジック分離)
    const { handleKeyDown: handleIMEKeyDown, isComposingRef, compositionEndTsRef } = useIMEControl();

    // Paste Control (ロジック分離)
    const { handlePaste } = usePasteControl();

    // Tiptap Editor (ロジック分離)
    const editor = useTiptapEditor(handleIMEKeyDown, handlePaste);

    // IME Event Registration: Tiptap外のDOMイベントを監視
    useEffect(() => {
        if (!editor) return;

        const dom = editor.view.dom;
        const handleStart = () => { isComposingRef.current = true; };
        const handleEnd = () => {
            isComposingRef.current = false;
            compositionEndTsRef.current = Date.now();
        };

        dom.addEventListener('compositionstart', handleStart);
        dom.addEventListener('compositionend', handleEnd);

        return () => {
            dom.removeEventListener('compositionstart', handleStart);
            dom.removeEventListener('compositionend', handleEnd);
        };
    }, [editor, isComposingRef, compositionEndTsRef]);

    // Dialogs (ロジック分離)
    const { confirm, prompt, confirmState, promptState, handleConfirmClose, handlePromptClose } = useDialogs();

    // Page Operations (ロジック分離)
    const { addPage, removePage } = usePageOperations(editor, { confirm });

    // File IO (ロジック分離)
    const { saveFile, saveAsFile, downloadFile, openFileWithHandle } = useFileIO(editor, isWordMode);
    const { currentFileHandle, triggerJumpInputFocus } = useAppStore();

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
    useKeyboardShortcuts(saveFile, saveAsFile, downloadFile, openFileWithHandle, currentFileHandle, triggerJumpInputFocus);

    return (
        <div className="flex flex-col h-screen bg-[#525659] overflow-hidden font-sans">
            <div id="toolbar">
                <Toolbar
                    editor={editor}
                    onAddPage={addPage}
                    onRemovePage={removePage}
                    prompt={prompt}
                />
            </div>
            
            <div className="flex flex-1 overflow-hidden relative">
                {editor && (
                    <div id="page-navigator">
                        <PageNavigator editor={editor} />
                    </div>
                )}
                
                <div id="pages-container" className="flex-1 overflow-auto p-12 scroll-smooth">
                    <div 
                        className={`flex flex-col gap-6 transition-all duration-200 mx-auto ${isWordMode ? 'mode-word' : ''}`} 
                        style={{ 
                            width: '210mm',
                            zoom: zoomLevel / 100,
                        } as React.CSSProperties}
                    >
                        {editor && (
                            <>
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
