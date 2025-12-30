import { Editor } from '@tiptap/react';
import type {
  InsertParagraphCommand,
  DeleteParagraphCommand,
  ExecutionResult,
} from '@/types/ai-sync.types';

/**
 * INSERT_PARAGRAPHコマンドを実行
 */
export function executeInsertParagraph(editor: Editor, command: InsertParagraphCommand): ExecutionResult {
  try {
    const { position, text, options } = command;

    const { state } = editor;
    const { doc } = state;
    let pIdx = 0;
    let targetPos: number | null = null;

    if (position === 1) {
      targetPos = 0;
    } else {
      doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
          pIdx++;
          if (pIdx === position - 1) {
            targetPos = pos + node.nodeSize;
            return false;
          }
        }
        return true;
      });
    }

    if (targetPos === null && position > 1) {
      return {
        success: false,
        error: `段落 ${position} の挿入位置が見つかりませんでした`,
        timestamp: Date.now(),
      };
    }

    const nodeType = options?.type === 'heading' ? 'heading' : 'paragraph';
    const attrs: Record<string, unknown> = {};
    
    if (nodeType === 'heading' && options?.level) {
      attrs.level = options.level;
    }
    if (options?.align) {
      attrs.textAlign = options.align;
    }
    if (options?.indent !== undefined) {
      attrs.indent = options.indent;
    }

    const content = {
      type: nodeType,
      ...(Object.keys(attrs).length > 0 && { attrs }),
      content: text ? [{ type: 'text', text }] : [],
    };

    editor.chain().focus().insertContentAt(targetPos!, content).run();

    return {
      success: true,
      changedRanges: [
        {
          start: { paragraph: position, offset: 0 },
          end: { paragraph: position, offset: text.length },
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

/**
 * DELETE_PARAGRAPHコマンドを実行
 */
export function executeDeleteParagraph(editor: Editor, command: DeleteParagraphCommand): ExecutionResult {
  try {
    const { paragraph } = command;

    const { state } = editor;
    const { doc } = state;
    let pIdx = 0;
    let targetPos: number | null = null;
    let targetNode: any = null;

    doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        pIdx++;
        if (pIdx === paragraph) {
          targetPos = pos;
          targetNode = node;
          return false;
        }
      }
      return true;
    });

    if (targetPos === null || !targetNode) {
      return {
        success: false,
        error: `段落 ${paragraph} が見つかりませんでした`,
        timestamp: Date.now(),
      };
    }

    const tr = state.tr.delete(targetPos, targetPos + targetNode.nodeSize);
    editor.view.dispatch(tr);

    return {
      success: true,
      changedRanges: [
        {
          start: { paragraph, offset: 0 },
          end: { paragraph, offset: 0 },
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
