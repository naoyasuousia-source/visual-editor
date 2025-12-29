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
      background-color: rgb(254 240 138) !important; /* yellow-200 */
      transition: background-color 0.3s ease;
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

  // 各範囲にハイライトを適用
  ranges.forEach((range) => {
    const { from, to } = convertRangeToProseMirrorPosition(editor, range);
    
    if (from !== null && to !== null) {
      // 範囲内のテキストをマークで囲む
      editor.chain()
        .setTextSelection({ from, to })
        .setMark('textStyle', { class: HIGHLIGHT_CLASS })
        .run();
    }
  });
}

/**
 * 全てのハイライトを削除
 * @param editor - Tiptapエディタインスタンス
 */
export function clearAllHighlights(editor: Editor): void {
  // ハイライトクラスを持つ全てのマークを削除
  const { state } = editor;
  const { tr, doc } = state;

  let modified = false;

  doc.descendants((node, pos) => {
    if (node.isText && node.marks) {
      node.marks.forEach((mark) => {
        if (mark.type.name === 'textStyle' && mark.attrs.class === HIGHLIGHT_CLASS) {
          tr.removeMark(pos, pos + node.nodeSize, mark.type);
          modified = true;
        }
      });
    }
  });

  if (modified) {
    editor.view.dispatch(tr);
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
    
    // 段落番号から位置を計算
    const startParagraph = range.startParagraph;
    const endParagraph = range.endParagraph;
    
    let currentPos = 0;
    let paragraphIndex = 0;
    let startPos: number | null = null;
    let endPos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph') {
        paragraphIndex++;

        // 開始段落
        if (paragraphIndex === startParagraph) {
          startPos = pos + 1 + (range.startOffset || 0);
        }

        // 終了段落
        if (paragraphIndex === endParagraph) {
          const endOffset = range.endOffset !== undefined 
            ? range.endOffset 
            : node.content.size;
          endPos = pos + 1 + endOffset;
          return false; // 探索終了
        }
      }

      currentPos = pos + node.nodeSize;
    });

    return { from: startPos, to: endPos };
  } catch (error) {
    console.error('[highlightManager] 位置変換エラー:', error);
    return { from: null, to: null };
  }
}
