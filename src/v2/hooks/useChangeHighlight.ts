/**
 * 変更ハイライト管理フック
 * 自動編集による変更箇所のハイライト表示を管理
 */

import { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import type { Range } from '@/types/ai-sync.types';
import * as HighlightService from '@/services/highlightService';

/**
 * 自動編集のハイライトを管理するフック
 */
export const useChangeHighlight = (editor: Editor | null) => {
  /**
   * 指定された範囲をハイライト
   */
  const highlightChanges = useCallback(
    (ranges: Range[]) => {
      if (!editor) return;
      HighlightService.highlightRanges(editor, ranges);
    },
    [editor]
  );

  /**
   * 全てのハイライトをクリア
   */
  const clearHighlights = useCallback(() => {
    if (!editor) return;
    HighlightService.clearAllHighlights(editor);
  }, [editor]);

  return {
    highlightChanges,
    clearHighlights,
  };
}
