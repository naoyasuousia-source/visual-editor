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

    // エディタのロック状態を統合管理 (自動編集中 + 承認待ち)
    const isProcessing = useAppStore((state) => state.isAutoEditProcessing);
    // highlights Map 自体の変更を検知
    const highlights = useCommandHighlightStore((state) => state.highlights);
    
    // 未処理の件数を計算
    const pendingCount = Array.from(highlights.values()).filter(h => !h.approved && !h.rejected).length;

    // ロック中かどうかを判定
    const shouldLock = isProcessing || pendingCount > 0;

    // ロック状態を強制反映させるためのEffect
    useEffect(() => {
        if (!editor) return;

        const targetEditable = !shouldLock;

        // ロックを強制適用する関数
        const enforceLock = () => {
            // Tiptap内部や他の拡張機能による変更を徹底的に上書き
            if (editor.isEditable !== targetEditable) {
                editor.setEditable(targetEditable);
            }
            // view自体の設定も念のため確認
            if (editor.view.editable !== targetEditable) {
              (editor.view as any).editable = targetEditable;
            }
        };

        // 依存関係が変化した瞬間に即座に実行
        enforceLock();

        // 非同期的な書き換え（他の Effect 等）に対抗するため、
        // 次のマイクロタスクでも実行
        const timeoutId = setTimeout(enforceLock, 0);

        // 各種イベントでロックを維持
        editor.on('transaction', enforceLock);
        editor.on('update', enforceLock);
        editor.on('selectionUpdate', enforceLock);

        // 保険として短周期(50ms)でチェック
        const intervalId = setInterval(enforceLock, 50);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            editor.off('transaction', enforceLock);
            editor.off('update', enforceLock);
            editor.off('selectionUpdate', enforceLock);
        };
    }, [editor, shouldLock]);

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

    // Unload Warning (リロード・終了時の警告)
    useUnloadWarning();



    return (
        <div className="flex flex-col h-screen bg-[#525659] overflow-hidden font-sans">
            {/* Toolbar Area */}
            <div id="toolbar" className={shouldLock ? 'pointer-events-none select-none opacity-80' : ''}>
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
                />
            )}
            
            {/* Main Content Area */}
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
