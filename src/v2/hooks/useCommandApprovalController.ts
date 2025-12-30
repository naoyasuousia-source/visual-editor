/**
 * コマンド承認コントローラーフック
 * ポップアップと承認バーの表示を管理
 */

import { useState, useCallback, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { useCommandHighlight } from '@/hooks/useCommandHighlight';
import { useCommandHighlightStore } from '@/store/useCommandHighlightStore';
import { useAppStore } from '@/store/useAppStore';
import type { HighlightState } from '@/types/command';

/**
 * コマンド承認コントローラーフック
 * 
 * @param editor - Tiptapエディタインスタンス
 * @param onApprovalChange - 承認状態が変化した際のコールバック（保存用など）
 * @returns コントローラー関数群
 */
export function useCommandApprovalController(editor: Editor | null, onApprovalChange?: () => void) {
  // Storeから直接ハイライト状態を購読して再レンダリングを確実にする
  const highlightsMap = useCommandHighlightStore((state) => state.highlights);
  const pendingCount = useCommandHighlightStore((state) => {
    return Array.from(state.highlights.values()).filter(h => !h.approved && !h.rejected).length;
  });

  const {
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

  const isAutoEditProcessing = useAppStore((state) => state.isAutoEditProcessing);

  /**
   * エディタのロック状態を統合管理
   * 自動編集中、または保留中のハイライトがある間は編集不可にする
   */
  useEffect(() => {
    if (!editor) return;

    const shouldLock = isAutoEditProcessing || pendingCount > 0;
    
    // Tiptapの状態更新サイクルを考慮し、微小な遅延を置いて確実に適用
    const timer = setTimeout(() => {
      if (shouldLock) {
        editor.setEditable(false);
      } else {
        editor.setEditable(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [editor, isAutoEditProcessing, pendingCount]);

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
        const highlight = highlightsMap.get(commandId);
        if (highlight) {
          setActivePopup({ highlight, targetElement: paragraph });
        }
      }, 300);
    };

    const handleMouseOut = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const relatedTarget = event.relatedTarget as HTMLElement;
      
      const paragraph = target.closest('[data-command-type]');
      
      // 移動先が同じ段落内、またはポップアップ自体の中であればタイマーをクリアしない
      if (paragraph && (paragraph.contains(relatedTarget) || relatedTarget?.closest('.fixed.z-[9999]'))) {
        return;
      }
      
      if (paragraph && hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
    };

    // イベントリスナーを登録 (デリゲーション・キャプチャーフェーズ)
    const editorElement = editor.view.dom;
    editorElement.addEventListener('mouseover', handleMouseOver, true);
    editorElement.addEventListener('mouseout', handleMouseOut, true);

    return () => {
      editorElement.removeEventListener('mouseover', handleMouseOver, true);
      editorElement.removeEventListener('mouseout', handleMouseOut, true);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [editor, highlightsMap, activePopup]);

  /**
   * 承認バーの表示/非表示を自動管理
   */
  useEffect(() => {
    if (pendingCount > 0) {
      setShowApprovalBar(true);
    } else {
      setShowApprovalBar(false);
    }
  }, [pendingCount]);

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
    if (pendingCount > 0) {
      setShowApprovalBar(true);
    }
  }, [pendingCount]);

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
    pendingCount,
  };
}
