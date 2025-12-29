/**
 * 変更ハイライト管理フック
 * 自動編集による変更箇所のハイライト表示を管理
 */

import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import type { Range } from '@/types/ai-sync.types';
import { highlightRanges, clearAllHighlights } from '@/utils/highlightManager';

interface UseChangeHighlightReturn {
  /** 変更範囲をハイライト */
  highlightChanges: (ranges: Range[]) => void;
  /** 全てのハイライトをクリア */
  clearHighlights: () => void;
}

/**
 * 変更ハイライト管理フック
 * @param editor - Tiptapエディタインスタンス
 */
export function useChangeHighlight(editor: Editor | null): UseChangeHighlightReturn {
  /**
   * 変更範囲をハイライト表示
   */
  const highlightChanges = useCallback(
    (ranges: Range[]) => {
      if (!editor || ranges.length === 0) {
        return;
      }

      console.log('[ChangeHighlight] ハイライト表示:', ranges.length, '個の範囲');
      highlightRanges(editor, ranges);
    },
    [editor]
  );

  /**
   * 全てのハイライトをクリア
   */
  const clearHighlights = useCallback(() => {
    if (!editor) {
      return;
    }

    console.log('[ChangeHighlight] ハイライトをクリア');
    clearAllHighlights(editor);
  }, [editor]);

  return {
    highlightChanges,
    clearHighlights,
  };
}
