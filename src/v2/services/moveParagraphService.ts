import { Editor } from '@tiptap/react';
import type {
  MoveParagraphCommand,
  ExecutionResult,
} from '@/types/ai-sync.types';

/**
 * MOVE_PARAGRAPHコマンドを実行
 */
export function executeMoveParagraph(editor: Editor, command: MoveParagraphCommand): ExecutionResult {
  try {
    const { from, to } = command;

    // 段落を特定
    const { state } = editor;
    const { doc } = state;
    let pIdx = 0;
    let fromPos: number | null = null;
    let fromNode: typeof doc.firstChild | null = null;

    // 移動元の段落を探す
    doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        pIdx++;
        if (pIdx === from) {
          fromPos = pos;
          fromNode = node;
          return false;
        }
      }
      return true;
    });

    if (fromPos === null || !fromNode) {
      return {
        success: false,
        error: `移動元の段落 ${from} が見つかりませんでした`,
        timestamp: Date.now(),
      };
    }

    // 移動先の位置を特定
    pIdx = 0;
    let toPos: number | null = null;

    if (to === 1) {
      toPos = 0;
    } else {
      doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
          pIdx++;
          if (pIdx === to - 1) {
            toPos = pos + node.nodeSize;
            return false;
          }
        }
        return true;
      });
    }

    if (toPos === null && to > 1) {
      return {
        success: false,
        error: `移動先の段落 ${to} が見つかりませんでした`,
        timestamp: Date.now(),
      };
    }

    // 段落を移動: まず削除してから挿入
    let tr = state.tr;
    
    // 移動元を削除
    const nodeSize = fromNode.nodeSize;
    tr = tr.delete(fromPos, fromPos + nodeSize);

    // 削除後の位置を調整
    let adjustedToPos = toPos!;
    if (fromPos < toPos!) {
      adjustedToPos -= nodeSize;
    }

    // 移動先に挿入
    tr = tr.insert(adjustedToPos, fromNode);
    
    editor.view.dispatch(tr);

    return {
      success: true,
      changedRanges: [
        {
          start: { paragraph: from, offset: 0 },
          end: { paragraph: to, offset: 0 },
        },
      ],
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー',
      timestamp: Date.now(),
    };
  }
}
