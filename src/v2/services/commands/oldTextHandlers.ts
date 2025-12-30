import { Editor } from '@tiptap/react';
import type {
  InsertTextCommand,
  ReplaceTextCommand,
  DeleteTextCommand,
  ExecutionResult,
  Range,
} from '@/types/ai-sync.types';

/**
 * INSERT_TEXTコマンドを実行
 */
export function executeInsertText(editor: Editor, command: InsertTextCommand): ExecutionResult {
  try {
    const { position, text, attributes } = command;

    const { state } = editor;
    const { doc } = state;
    let pIdx = 0;
    let targetPos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        pIdx++;
        if (pIdx === position.paragraph) {
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
    
    let searchRegex: RegExp;
    if (options?.regex) {
      const flags = options.caseSensitive ? 'g' : 'gi';
      searchRegex = new RegExp(search, flags);
    } else {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flags = options?.caseSensitive ? 'g' : 'gi';
      searchRegex = new RegExp(escapedSearch, flags);
    }

    const { state } = editor;
    const { doc } = state;
    let matchCount = 0;
    let paragraphIndex = 0;
    let tr = state.tr;

    doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        paragraphIndex++;
        const textContent = node.textContent;
        
        searchRegex.lastIndex = 0;
        const paragraphMatches: { start: number, end: number, text: string }[] = [];
        
        if (options?.all) {
          let match;
          while ((match = searchRegex.exec(textContent)) !== null) {
            paragraphMatches.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        } else if (matchCount === 0) {
          const match = searchRegex.exec(textContent);
          if (match) {
            paragraphMatches.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        for (let i = paragraphMatches.length - 1; i >= 0; i--) {
          const m = paragraphMatches[i];
          const from = pos + 1 + m.start;
          const to = pos + 1 + m.end;
          
          tr = tr.insertText(replace, from, to);
          matchCount++;

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
