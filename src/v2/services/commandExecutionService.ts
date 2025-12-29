import { Editor } from '@tiptap/react';
import type {
  InsertTextCommand,
  ReplaceTextCommand,
  DeleteTextCommand,
  InsertParagraphCommand,
  DeleteParagraphCommand,
  MoveParagraphCommand,
  ExecutionResult,
  Range,
} from '@/types/ai-sync.types';
import { executeMoveParagraph } from './moveParagraphService';

/**
 * INSERT_TEXTコマンドを実行
 */
export function executeInsertText(editor: Editor, command: InsertTextCommand): ExecutionResult {
  try {
    const { position, text, attributes } = command;

    // 段落を特定（doc.descendants を使用して正確な位置を取得）
    const { state } = editor;
    const { doc } = state;
    let pIdx = 0;
    let targetPos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        pIdx++;
        if (pIdx === position.paragraph) {
          // 段落内のオフセットを考慮した挿入位置
          // pos + 1 が段落内コンテンツの開始位置
          targetPos = pos + 1 + Math.min(position.offset, node.content.size);
          return false;
        }
      }
      return true;
    });

    if (targetPos === null) {
      return {
        success: false,
        error: `段落 ${position.paragraph} が見つかりませんでした`,
        timestamp: Date.now(),
      };
    }

    // テキストを挿入 (太字属性がある場合はマークを付与)
    if (attributes?.bold) {
      editor.chain().focus().insertContentAt(targetPos, {
        type: 'text',
        text,
        marks: [{ type: 'bold' }],
      }).run();
    } else {
      editor.chain().focus().insertContentAt(targetPos, text).run();
    }

    return {
      success: true,
      changedRanges: [
        {
          start: position,
          end: { paragraph: position.paragraph, offset: position.offset + text.length },
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
 * REPLACE_TEXTコマンドを実行
 */
export function executeReplaceText(editor: Editor, command: ReplaceTextCommand): ExecutionResult {
  try {
    const { search, replace, options } = command;
    const changedRanges: Range[] = [];
    
    // 検索と置換用の正規表現を準備
    let searchRegex: RegExp;
    if (options?.regex) {
      const flags = options.caseSensitive ? 'g' : 'gi';
      searchRegex = new RegExp(search, flags);
    } else {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flags = options?.caseSensitive ? 'g' : 'gi';
      searchRegex = new RegExp(escapedSearch, flags);
    }

    // 文書を走査して置換対象を探す
    const { state } = editor;
    const { doc } = state;
    let matchCount = 0;
    let paragraphIndex = 0;

    // トランザクションを開始
    let tr = state.tr;

    doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        paragraphIndex++;
        const textContent = node.textContent;
        
        // この段落内でのマッチを探す
        let match;
        // 正規表現をリセット（gフラグなどのため）
        searchRegex.lastIndex = 0;

        const paragraphMatches: { start: number, end: number, text: string }[] = [];
        
        if (options?.all) {
          while ((match = searchRegex.exec(textContent)) !== null) {
            paragraphMatches.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        } else if (matchCount === 0) {
          match = searchRegex.exec(textContent);
          if (match) {
            paragraphMatches.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        // 見つかったマッチを後ろから順に置換（前方への影響を避ける）
        for (let i = paragraphMatches.length - 1; i >= 0; i--) {
          const m = paragraphMatches[i];
          const from = pos + 1 + m.start;
          const to = pos + 1 + m.end;
          
          tr = tr.insertText(replace, from, to);
          matchCount++;

          // ハイライト用の範囲を追加
          changedRanges.push({
            start: { paragraph: paragraphIndex, offset: m.start },
            end: { paragraph: paragraphIndex, offset: m.start + replace.length }
          });
        }
      }
      return true;
    });

    if (matchCount === 0) {
      return {
        success: false,
        error: '検索文字列が見つかりませんでした',
        timestamp: Date.now(),
      };
    }

    // 変更を適用
    editor.view.dispatch(tr);

    return {
      success: true,
      changedRanges,
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
 * DELETE_TEXTコマンドを実行
 */
export function executeDeleteText(editor: Editor, command: DeleteTextCommand): ExecutionResult {
  try {
    const { range } = command;

    // 段落を特定して削除範囲の位置を特定
    const { state } = editor;
    const { doc } = state;
    let pIdx = 0;
    let fromPos: number | null = null;
    let toPos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        pIdx++;
        if (pIdx === range.start.paragraph) {
          fromPos = pos + 1 + range.start.offset;
          toPos = pos + 1 + range.end.offset;
          return false;
        }
      }
      return true;
    });

    if (fromPos === null || toPos === null) {
      return {
        success: false,
        error: `段落 ${range.start.paragraph} が見つかりませんでした`,
        timestamp: Date.now(),
      };
    }

    // テキストを削除
    const tr = state.tr.delete(fromPos, toPos);
    editor.view.dispatch(tr);

    return {
      success: true,
      changedRanges: [range],
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
 * INSERT_PARAGRAPHコマンドを実行
 */
export function executeInsertParagraph(editor: Editor, command: InsertParagraphCommand): ExecutionResult {
  try {
    const { position, text, options } = command;

    // 段落を特定
    const { state } = editor;
    const { doc } = state;
    let pIdx = 0;
    let targetPos: number | null = null;

    // position 番目の段落の直前に挿入
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

    // ノードタイプと属性を決定
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

    // 段落を挿入
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

    // 段落を特定
    const { state } = editor;
    const { doc } = state;
    let pIdx = 0;
    let targetPos: number | null = null;
    let targetNode: typeof doc.firstChild | null = null;

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

    // 段落を削除
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

// Re-export executeMoveParagraph for convenience
export { executeMoveParagraph };
