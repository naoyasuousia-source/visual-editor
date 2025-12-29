/**
 * 変更ハイライト管理ユーティリティ
 * コマンド実行による変更箇所をハイライト表示
 */

import type { Editor } from '@tiptap/react';
import type { Range } from '@/types/ai-sync.types';

/**
 * ハイライトクラス名
 */
export const HIGHLIGHT_CLASS = 'auto-edit-highlight';

/**
 * ハイライトスタイルをCSSに追加
 */
export function injectHighlightStyles(): void {
  // 既にスタイルが追加されている場合はスキップ
  if (document.getElementById('auto-edit-highlight-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'auto-edit-highlight-styles';
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      background-color: #fef08a !important; /* yellow-200 */
      transition: background-color 0.3s ease;
      display: inline;
    }
  `;
  document.head.appendChild(style);
}

/**
 * 指定範囲をハイライト
 * @param editor - Tiptapエディタインスタンス
 * @param ranges - ハイライトする範囲の配列
 */
export function highlightRanges(editor: Editor, ranges: Range[]): void {
  // スタイルを注入
  injectHighlightStyles();

  console.log('[highlightManager] highlightRanges called with ranges:', JSON.stringify(ranges));

  // 各範囲にハイライトを適用
  ranges.forEach((range, index) => {
    console.log(`[highlightManager] Processing range ${index}:`, JSON.stringify(range));
    
    const { from, to } = convertRangeToProseMirrorPosition(editor, range);
    
    console.log(`[highlightManager] Converted positions: from=${from}, to=${to}`);
    
    if (from !== null && to !== null && to > from) {
      console.log(`[highlightManager] Apply mark: from=${from} to=${to}, textLength=${to - from}`);
      
      // 範囲内のテキストをマークで囲む
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .setHighlight({ color: '#fef08a' }) // 基本のハイライト色
        .run();
    } else {
      console.warn(`[highlightManager] Invalid range: from=${from}, to=${to}`);
    }
  });
}

/**
 * 全てのハイライトを削除
 * @param editor - Tiptapエディタインスタンス
 */
export function clearAllHighlights(editor: Editor): void {
  try {
    const { state } = editor;
    const { doc } = state;
    
    // ProseMirrorでは位置0はドキュメントルートの前なので、1から開始
    const from = 1;
    const to = doc.content.size - 1;
    
    if (to <= from) {
      console.log('[highlightManager] 文書が空のためハイライト削除をスキップ');
      return;
    }
    
    console.log(`[highlightManager] ハイライトを削除: from=${from}, to=${to}`);
    
    // selectAll → unsetHighlight のパターンを試行
    editor.chain()
      .focus()
      .selectAll()
      .unsetHighlight()
      .run();
    
    console.log('[highlightManager] 全てのハイライトを削除しました');
  } catch (error) {
    console.error('[highlightManager] ハイライト削除エラー:', error);
  }
}

/**
 * Range型をProseMirrorの位置に変換
 * @param editor - Tiptapエディタインスタンス
 * @param range - 変更範囲
 * @returns ProseMirrorの位置 {from, to}
 */
function convertRangeToProseMirrorPosition(
  editor: Editor,
  range: Range
): { from: number | null; to: number | null } {
  try {
    const { doc } = editor.state;
    
    // ai-sync.types.ts の構造に合わせて修正
    const startParagraph = range.start.paragraph;
    const endParagraph = range.end.paragraph;
    
    let paragraphIndex = 0;
    let startPos: number | null = null;
    let endPos: number | null = null;

    doc.descendants((node, pos) => {
      // headingも段落番号のカウント対象に含まれる可能性があるが、
      // 現在の実装（ParagraphNumbering等）に合わせて判断
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        paragraphIndex++;

        // 開始段落
        if (paragraphIndex === startParagraph) {
          startPos = pos + 1 + (range.start.offset || 0);
        }

        // 終了段落
        if (paragraphIndex === endParagraph) {
          const endOffset = range.end.offset !== undefined 
            ? range.end.offset 
            : node.content.size;
          endPos = pos + 1 + endOffset;
          return false; // 探索終了
        }
      }
      return true;
    });

    return { from: startPos, to: endPos };
  } catch (error) {
    console.error('[highlightManager] 位置変換エラー:', error);
    return { from: null, to: null };
  }
}
