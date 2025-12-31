import React, { useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import { Toaster } from 'sonner';

import { Toolbar } from '@/components/features/Toolbar';
import { ImageContextMenu } from '@/components/common/editor-menus/ImageContextMenu';
import { LinkBubbleMenu } from '@/components/common/editor-menus/LinkBubbleMenu';
import { PageNavigator } from '@/components/features/PageNavigator';
import { AIImageIndex } from '@/components/features/AIImageIndex';
import { DialogGroup } from '@/components/common/DialogGroup';

import { useAppStore } from '@/store/useAppStore';
import { useCommandHighlightStore } from '@/store/useCommandHighlightStore';
import { usePageOperations } from '@/hooks/usePageOperations';
import { useBrowserCheck } from '@/hooks/useBrowserCheck';
import { useIMEControl } from '@/hooks/useIMEControl';
import { usePasteControl } from '@/hooks/usePasteControl';
import { useDialogs } from '@/hooks/useDialogs';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFileIO } from '@/hooks/useFileIO';
import { useTiptapEditor } from '@/hooks/useTiptapEditor';
import { useGlobalStyles } from '@/hooks/useGlobalStyles';
import { EditorLockOverlay } from '@/components/features/EditorLockOverlay';
import { useAutoEdit } from '@/hooks/useAutoEdit';
import { AutoEditBar } from '@/components/features/AutoEdit/AutoEditBar';
import { CommandPopup } from '@/components/features/AutoEdit/CommandPopup';
import { CommandApprovalBar } from '@/components/features/AutoEdit/CommandApprovalBar';
import { useCommandApprovalController } from '@/hooks/useCommandApprovalController';
import { useUnloadWarning } from '@/hooks/useUnloadWarning';

/**
 * EditorV3 - V2エディタのメインコンポーネント
 */
export const EditorV3 = () => {
    // Global Store
    const {
        zoomLevel,
        isWordMode,
        activeDialog,
        closeDialog,
        currentFileHandle,
        triggerJumpInputFocus
    } = useAppStore();

    // Browser Check
    const { showWarning: showBrowserWarning, setShowWarning: setShowBrowserWarning } = useBrowserCheck();

    // IME Control
    const { handleKeyDown: handleIMEKeyDown, registerIME } = useIMEControl();
    
    // Paste Control
    const { handlePaste, transformPastedHTML } = usePasteControl();
    
    // Editor initialization
    const editor = useTiptapEditor(handleIMEKeyDown, handlePaste, transformPastedHTML);

    // エディタ確定後の動的接続・同期
    useEffect(() => {
        return registerIME(editor);
    }, [editor, registerIME]);

    useGlobalStyles(editor);

    // Editor Lock state
    const isProcessing = useAppStore((state) => state.isAutoEditProcessing);
    const highlights = useCommandHighlightStore((state) => state.highlights);
    const pendingCount = Array.from(highlights.values()).filter(h => !h.approved && !h.rejected).length;
    const shouldLock = isProcessing || pendingCount > 0;

    useEffect(() => {
        if (!editor) return;
        const targetEditable = !shouldLock;
        const enforceLock = () => {
            if (editor.isEditable !== targetEditable) {
                editor.setEditable(targetEditable);
            }
            if (editor.view.editable !== targetEditable) {
              (editor.view as any).editable = targetEditable;
            }
        };
        enforceLock();
        const timeoutId = setTimeout(enforceLock, 0);
        editor.on('transaction', enforceLock);
        editor.on('update', enforceLock);
        editor.on('selectionUpdate', enforceLock);
        const intervalId = setInterval(enforceLock, 50);
        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            editor.off('transaction', enforceLock);
            editor.off('update', enforceLock);
            editor.off('selectionUpdate', enforceLock);
        };
    }, [editor, shouldLock]);

    // Dialogs
    const { confirm, prompt, confirmState, promptState, handleConfirmClose, handlePromptClose } = useDialogs();

    // Page Operations
    const { addPage, removePage } = usePageOperations(editor, { confirm });

    // File IO
    const { saveFile, saveAsFile, downloadFile, openFileWithHandle } = useFileIO(editor, isWordMode);

    // Keyboard Shortcuts
    useKeyboardShortcuts(saveFile, saveAsFile, downloadFile, openFileWithHandle, currentFileHandle, triggerJumpInputFocus);

    // Auto Edit
    const autoEdit = useAutoEdit(editor);

    // Command Approval Controller
    const approvalController = useCommandApprovalController(editor, saveFile);

    // Unload Warning
    useUnloadWarning();

    return (
        <div className="flex flex-col h-screen bg-[#525659] overflow-hidden font-sans">
            <div id="toolbar" className={shouldLock ? 'pointer-events-none select-none opacity-80' : ''}>
                <Toolbar
                    editor={editor}
                    onAddPage={addPage}
                    onRemovePage={removePage}
                    prompt={prompt}
                />
            </div>

            {autoEdit.isPendingApproval && autoEdit.lastEditTime && (
                <AutoEditBar
                    lastEditTime={autoEdit.lastEditTime}
                    onApprove={autoEdit.approveEdit}
                    onReject={autoEdit.rejectEdit}
                />
            )}

            {approvalController.showApprovalBar && approvalController.pendingCount > 0 && (
                <CommandApprovalBar
                    pendingCount={approvalController.pendingCount}
                    onApproveAll={approvalController.handleApproveAll}
                    onRejectAll={approvalController.handleRejectAll}
                />
            )}
            
            <div className={`flex flex-1 overflow-hidden relative ${shouldLock ? 'pointer-events-none select-none' : ''}`}>
                {editor && (
                    <div id="page-navigator">
                        <PageNavigator editor={editor} />
                    </div>
                )}
                
                <div id="pages-container" className="flex-1 overflow-auto p-12 scroll-smooth pointer-events-auto">
                    <div 
                        className={`flex flex-col gap-6 transition-all duration-200 mx-auto w-[210mm] ${isWordMode ? 'mode-word' : ''}`}
                        style={{ zoom: zoomLevel / 100 } as React.CSSProperties}
                    >
                        {editor && (
                            <>
                                <LinkBubbleMenu editor={editor} prompt={prompt} />
                                <AIImageIndex editor={editor} />
                                <ImageContextMenu editor={editor}>
                                    <div className={shouldLock ? 'locked-editor' : ''}>
                                        <EditorContent editor={editor} />
                                    </div>
                                </ImageContextMenu>
                            </>
                        )}
                    </div>
                </div>
            </div>

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

            <EditorLockOverlay />

            {approvalController.activePopup && (
                <CommandPopup
                    highlight={approvalController.activePopup.highlight}
                    targetElement={approvalController.activePopup.targetElement}
                    onApprove={approvalController.handleApprove}
                    onReject={approvalController.handleReject}
                    onClose={approvalController.closePopup}
                />
            )}

            <Toaster position="top-center" richColors />
        </div>
    );
};

export default EditorV3;
