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
import { AutoEditBar } from '@/components/features/AutoEditBar';
import { useAutoEdit } from '@/hooks/useAutoEdit';
import { CommandPopup } from '@/components/CommandPopup';
import { CommandApprovalBar } from '@/components/CommandApprovalBar';
import { useCommandApprovalController } from '@/hooks/useCommandApprovalController';

/**
 * EditorV3 - V2エディタのメインコンポーネント
 * 
 * rules.md の「4層アーキテクチャ」および「ロジックとUIの分離」に基づき、
 * 描画とイベントの検知に専念する純粋なUIレイヤーとして機能します。
 * すべてのビジネスロジック、状態同期、DOM操作は専用の hooks/ に委譲されています。
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

    // Browser Check (ロジック分離)
    const { showWarning: showBrowserWarning, setShowWarning: setShowBrowserWarning } = useBrowserCheck();

    // Paste Control (ロジック分離)
    const { handlePaste } = usePasteControl();

    /**
     * Tiptap Editor & Logic Connection
     * 1. IME制御フックがキーダウンハンドラと登録関数を提供
     * 2. エディタフックが本体を生成
     * 3. 生成されたエディタを各ロジックフックへ接続
     */
    const { handleKeyDown: handleIMEKeyDown, registerIME } = useIMEControl();
    const editor = useTiptapEditor(handleIMEKeyDown, handlePaste);

    // エディタ確定後の動的接続・同期
    useEffect(() => {
        return registerIME(editor);
    }, [editor, registerIME]);

    useGlobalStyles(editor); // スタイル・設定の同期

    // Dialogs (ロジック分離)
    const { confirm, prompt, confirmState, promptState, handleConfirmClose, handlePromptClose } = useDialogs();

    // Page Operations (ロジック分離)
    const { addPage, removePage } = usePageOperations(editor, { confirm });

    // File IO (ロジック分離)
    const { saveFile, saveAsFile, downloadFile, openFileWithHandle } = useFileIO(editor, isWordMode);

    // Keyboard Shortcuts (ロジック分離)
    useKeyboardShortcuts(saveFile, saveAsFile, downloadFile, openFileWithHandle, currentFileHandle, triggerJumpInputFocus);

    // Auto Edit (v2.0 - 自動編集フロー)
    const autoEdit = useAutoEdit(editor);

    // Command Approval Controller (新コマンドシステム)
    const approvalController = useCommandApprovalController(editor, saveFile);



    return (
        <div className="flex flex-col h-screen bg-[#525659] overflow-hidden font-sans">
            {/* Toolbar Area */}
            <div id="toolbar">
                <Toolbar
                    editor={editor}
                    onAddPage={addPage}
                    onRemovePage={removePage}
                    prompt={prompt}
                />
            </div>

            {/* Auto Edit Bar - 承認待ち時のみ表示 */}
            {autoEdit.isPendingApproval && autoEdit.lastEditTime && (
                <AutoEditBar
                    lastEditTime={autoEdit.lastEditTime}
                    onApprove={autoEdit.approveEdit}
                    onReject={autoEdit.rejectEdit}
                />
            )}

            {/* Command Approval Bar - 新コマンドシステム (メニューバーのすぐ下) */}
            {approvalController.showApprovalBar && approvalController.pendingCount > 0 && (
                <CommandApprovalBar
                    pendingCount={approvalController.pendingCount}
                    onApproveAll={approvalController.handleApproveAll}
                    onRejectAll={approvalController.handleRejectAll}
                    onClose={approvalController.closeApprovalBar}
                />
            )}
            
            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {editor && (
                    <div id="page-navigator">
                        <PageNavigator editor={editor} />
                    </div>
                )}
                
                <div id="pages-container" className="flex-1 overflow-auto p-12 scroll-smooth">
                    <div 
                        className={`flex flex-col gap-6 transition-all duration-200 mx-auto w-[210mm] ${isWordMode ? 'mode-word' : ''}`}
                        style={{ zoom: zoomLevel / 100 } as React.CSSProperties}
                    >
                        {editor && (
                            <>
                                <LinkBubbleMenu editor={editor} prompt={prompt} />
                                <AIImageIndex editor={editor} />
                                <ImageContextMenu editor={editor}>
                                    <EditorContent editor={editor} />
                                </ImageContextMenu>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal & Dialog Layers */}
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

            {/* Editor Lock Overlay */}
            <EditorLockOverlay />

            {/* Command Popup - 新コマンドシステム */}
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
