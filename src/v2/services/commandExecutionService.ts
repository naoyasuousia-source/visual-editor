import { Editor } from '@tiptap/react';
import type {
  InsertTextCommand,
  ReplaceTextCommand,
  DeleteTextCommand,
  FormatTextCommand,
  InsertParagraphCommand,
  DeleteParagraphCommand,
  ExecutionResult,
  Range,
} from '@/types/ai-sync.types';

/**
 * INSERT_TEXTコマンドを実行
 */
export function executeInsertText(editor: Editor, command: InsertTextCommand): ExecutionResult {
  try {
    const { position, text } = command;

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

    // テキストを挿入
    editor.chain().focus().insertContentAt(targetPos, text).run();

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
export function executeDeleteText(_editor: Editor, _command: DeleteTextCommand): ExecutionResult {
  return {
    success: false,
    error: 'DELETE_TEXTは現在未実装です',
    timestamp: Date.now(),
  };
}

/**
 * FORMAT_TEXTコマンドを実行
 */
export function executeFormatText(_editor: Editor, _command: FormatTextCommand): ExecutionResult {
  return {
    success: false,
    error: 'FORMAT_TEXTは現在未実装です',
    timestamp: Date.now(),
  };
}

/**
 * INSERT_PARAGRAPHコマンドを実行
 */
export function executeInsertParagraph(_editor: Editor, _command: InsertParagraphCommand): ExecutionResult {
  return {
    success: false,
    error: 'INSERT_PARAGRAPHは現在未実装です',
    timestamp: Date.now(),
  };
}

/**
 * DELETE_PARAGRAPHコマンドを実行
 */
export function executeDeleteParagraph(_editor: Editor, _command: DeleteParagraphCommand): ExecutionResult {
  return {
    success: false,
    error: 'DELETE_PARAGRAPHは現在未実装です',
    timestamp: Date.now(),
  };
}
