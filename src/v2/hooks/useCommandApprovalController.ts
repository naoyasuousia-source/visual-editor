/**
 * コマンド承認コントローラーフック
 * ポップアップと承認バーの表示を管理
 */

import { useState, useCallback, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { useCommandHighlight } from '@/hooks/useCommandHighlight';
import type { HighlightState } from '@/types/command';

/**
 * コマンド承認コントローラーフック
 * 
 * @param editor - Tiptapエディタインスタンス
 * @returns コントローラー関数群
 */
export function useCommandApprovalController(editor: Editor | null) {
  const {
    getAllHighlights,
    getPendingCount,
    approveHighlight,
    rejectHighlight,
    approveAllHighlights,
    rejectAllHighlights,
  } = useCommandHighlight(editor);

  const [activePopup, setActivePopup] = useState<{
    highlight: HighlightState;
    targetElement: HTMLElement;
  } | null>(null);

  const [showApprovalBar, setShowApprovalBar] = useState(false);

  /**
   * ハイライトされた段落のホバーイベントをリスン
   */
  useEffect(() => {
    if (!editor) return;

    let hoverTimeout: NodeJS.Timeout | null = null;

    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // ハイライトされた段落かチェック
      const paragraph = target.closest('[data-command-type]') as HTMLElement;
      if (!paragraph) return;

      const commandId = paragraph.getAttribute('data-command-id');
      if (!commandId) return;

      // ハイライト状態を取得
      const highlights = getAllHighlights();
      const highlight = highlights.find(h => h.commandId === commandId);
      if (!highlight) return;

      // 500ms後にポップアップ表示
      hoverTimeout = setTimeout(() => {
        setActivePopup({ highlight, targetElement: paragraph });
      }, 500);
    };

    const handleMouseLeave = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const paragraph = target.closest('[data-command-type]');
      
      if (paragraph && hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
    };

    // イベントリスナーを登録
    const editorElement = editor.view.dom;
    editorElement.addEventListener('mouseenter', handleMouseEnter, true);
    editorElement.addEventListener('mouseleave', handleMouseLeave, true);

    return () => {
      editorElement.removeEventListener('mouseenter', handleMouseEnter, true);
      editorElement.removeEventListener('mouseleave', handleMouseLeave, true);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [editor, getAllHighlights]);

  /**
   * 承認バーの表示/非表示を自動管理
   */
  useEffect(() => {
    const pendingCount = getPendingCount();
    setShowApprovalBar(pendingCount > 0);
  }, [getPendingCount]);

  /**
   * ポップアップを閉じる
   */
  const closePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  /**
   * 承諾ハンドラー
   */
  const handleApprove = useCallback((commandId: string) => {
    approveHighlight(commandId);
    closePopup();
  }, [approveHighlight, closePopup]);

  /**
   * 破棄ハンドラー
   */
  const handleReject = useCallback((commandId: string) => {
    rejectHighlight(commandId);
    closePopup();
  }, [rejectHighlight, closePopup]);

  /**
   * 全体承諾ハンドラー
   */
  const handleApproveAll = useCallback(() => {
    approveAllHighlights();
    closePopup();
  }, [approveAllHighlights, closePopup]);

  /**
   * 全体破棄ハンドラー
   */
  const handleRejectAll = useCallback(() => {
    rejectAllHighlights();
    closePopup();
  }, [rejectAllHighlights, closePopup]);

  /**
   * 承認バーを閉じる（未処理があっても強制的に非表示）
   */
  const closeApprovalBar = useCallback(() => {
    setShowApprovalBar(false);
  }, []);

  /**
   * 承認バーを再表示
   */
  const showApprovalBarAgain = useCallback(() => {
    if (getPendingCount() > 0) {
      setShowApprovalBar(true);
    }
  }, [getPendingCount]);

  return {
    // ポップアップ状態
    activePopup,
    closePopup,
    
    // 承認バー状態
    showApprovalBar,
    closeApprovalBar,
    showApprovalBarAgain,
    
    // ハンドラー
    handleApprove,
    handleReject,
    handleApproveAll,
    handleRejectAll,
    
    // 状態取得
    pendingCount: getPendingCount(),
  };
}
