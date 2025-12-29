import { Editor } from '@tiptap/react';
import type { Range } from '@/types/ai-sync.types';

/**
 * 指定範囲をハイライト
 * サービスレイヤーとしてエディタのコマンドを実行します
 */
export function highlightRanges(editor: Editor, ranges: Range[]): void {
  ranges.forEach((range) => {
    const { from, to } = convertRangeToProseMirrorPosition(editor, range);
    
    if (from !== null && to !== null && to > from) {
      editor.chain()
        .focus()
        .setTextSelection({ from, to })
        .setHighlight({ color: '#fef08a' }) // 基本のハイライト色
        .run();
    }
  });
}

/**
 * 全てのハイライトを削除
 */
export function clearAllHighlights(editor: Editor): void {
  try {
    editor.chain()
      .focus()
      .selectAll()
      .unsetHighlight()
      .run();
  } catch (error) {
    console.error('[highlightService] ハイライト削除エラー:', error);
  }
}

/**
 * Range型をProseMirrorの位置に変換
 */
function convertRangeToProseMirrorPosition(
  editor: Editor,
  range: Range
): { from: number | null; to: number | null } {
  try {
    const { doc } = editor.state;
    const startParagraph = range.start.paragraph;
    const endParagraph = range.end.paragraph;
    
    let paragraphIndex = 0;
    let startPos: number | null = null;
    let endPos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        paragraphIndex++;

        if (paragraphIndex === startParagraph) {
          startPos = pos + 1 + (range.start.offset || 0);
        }

        if (paragraphIndex === endParagraph) {
          const endOffset = range.end.offset !== undefined 
            ? range.end.offset 
            : node.content.size;
          endPos = pos + 1 + endOffset;
          return false;
        }
      }
      return true;
    });

    return { from: startPos, to: endPos };
  } catch (error) {
    console.error('[highlightService] 位置変換エラー:', error);
    return { from: null, to: null };
  }
}
