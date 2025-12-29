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

  // 各範囲にハイライトを適用
  ranges.forEach((range) => {
    const { from, to } = convertRangeToProseMirrorPosition(editor, range);
    
    if (from !== null && to !== null) {
      console.log(`[highlightManager] Apply mark: ${from} to ${to}`);
      // 範囲内のテキストをマークで囲む
      // highlightエディションの機能を使う形に変更（あるいはtextStyleにclass属性が必要）
      // ここでは既存の highlight 拡張を利用しつつ、カスタムクラスを付与する
      editor.chain()
        .setTextSelection({ from, to })
        .setHighlight({ color: '#fef08a' }) // 基本のハイライト色
        .run();
        
      // さらにカスタムクラスを付与するために、nodeを直接走査して更新するか、
      // 拡張機能側でHTMLレンダリングを調整するのが本来だが、
      // ここでは取り急ぎ Tiptap の highlight 属性で代用。
      // もし特定のクラスが必要なら、markの属性として追加する必要がある。
    }
  });
}

/**
 * 全てのハイライトを削除
 * @param editor - Tiptapエディタインスタンス
 */
export function clearAllHighlights(editor: Editor): void {
  // highlightマークを解除
  editor.chain().unsetHighlight().run();
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
