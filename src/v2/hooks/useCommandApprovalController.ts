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
 * @param onApprovalChange - 承認状態が変化した際のコールバック（保存用など）
 * @returns コントローラー関数群
 */
export function useCommandApprovalController(editor: Editor | null, onApprovalChange?: () => void) {
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

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // ハイライトされた段落かチェック
      const paragraph = target.closest('[data-command-type]') as HTMLElement;
      if (!paragraph) return;

      const commandId = paragraph.getAttribute('data-command-id');
      if (!commandId) return;

      // すでに同じIDのポップアップが表示中ならタイマーをクリアして終了
      if (activePopup?.highlight.commandId === commandId) {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        return;
      }

      // 既存のタイマーがあればクリア
      if (hoverTimeout) clearTimeout(hoverTimeout);

      // 300ms後にポップアップ表示
      hoverTimeout = setTimeout(() => {
        setActivePopup({ highlight, targetElement: paragraph });
      }, 300);
    };

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const paragraph = target.closest('[data-command-type]');
      
      if (paragraph && hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
    };

    // イベントリスナーを登録 (デリゲーション)
    const editorElement = editor.view.dom;
    editorElement.addEventListener('mouseover', handleMouseOver);
    editorElement.addEventListener('mouseout', handleMouseOut);

    return () => {
      editorElement.removeEventListener('mouseover', handleMouseOver);
      editorElement.removeEventListener('mouseout', handleMouseOut);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [editor, getAllHighlights, activePopup]);

  /**
   * 承認バーの表示/非表示を自動管理
   */
  useEffect(() => {
    const pendingCount = getPendingCount();
    if (pendingCount > 0) {
      setShowApprovalBar(true);
    } else {
      setShowApprovalBar(false);
    }
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
    if (onApprovalChange) onApprovalChange();
  }, [approveHighlight, closePopup, onApprovalChange]);

  /**
   * 破棄ハンドラー
   */
  const handleReject = useCallback((commandId: string) => {
    rejectHighlight(commandId);
    closePopup();
    if (onApprovalChange) onApprovalChange();
  }, [rejectHighlight, closePopup, onApprovalChange]);

  /**
   * 全体承諾ハンドラー
   */
  const handleApproveAll = useCallback(() => {
    approveAllHighlights();
    closePopup();
    setShowApprovalBar(false);
    if (onApprovalChange) onApprovalChange();
  }, [approveAllHighlights, closePopup, onApprovalChange]);

  /**
   * 全体破棄ハンドラー
   */
  const handleRejectAll = useCallback(() => {
    rejectAllHighlights();
    closePopup();
    setShowApprovalBar(false);
    if (onApprovalChange) onApprovalChange();
  }, [rejectAllHighlights, closePopup, onApprovalChange]);

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
