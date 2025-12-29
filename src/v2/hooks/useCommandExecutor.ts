/**
 * コマンド実行フック
 * Tiptapエディタでコマンドを実行する
 */

import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import type {
  Command,
  ExecutionResult,
  Range,
  InsertTextCommand,
  ReplaceTextCommand,
  DeleteTextCommand,
  FormatTextCommand,
  InsertParagraphCommand,
  DeleteParagraphCommand,
} from '@/types/ai-sync.types';

interface UseCommandExecutorReturn {
  /** コマンドを実行 */
  executeCommand: (command: Command) => ExecutionResult;
  /** 複数のコマンドを順次実行 */
  executeCommands: (commands: Command[]) => ExecutionResult[];
}

/**
 * コマンド実行フック
 * @param editor - Tiptapエディタインスタンス
 */
export function useCommandExecutor(editor: Editor | null): UseCommandExecutorReturn {
  /**
   * INSERT_TEXTコマンドを実行
   */
  const executeInsertText = useCallback(
    (command: InsertTextCommand): ExecutionResult => {
      if (!editor) {
        return {
          success: false,
          error: 'エディタが初期化されていません',
          timestamp: Date.now(),
        };
      }

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
    },
    [editor]
  );

  /**
   * REPLACE_TEXTコマンドを実行
   */
  const executeReplaceText = useCallback(
    (command: ReplaceTextCommand): ExecutionResult => {
      if (!editor) {
        return {
          success: false,
          error: 'エディタが初期化されていません',
          timestamp: Date.now(),
        };
      }

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
        // 置換による位置ズレを追補するためのオフセット
        let accumulatedOffset = 0;

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
    },
    [editor]
  );

  /**
   * DELETE_TEXTコマンドを実行
   */
  const executeDeleteText = useCallback(
    (command: DeleteTextCommand): ExecutionResult => {
      if (!editor) {
        return {
          success: false,
          error: 'エディタが初期化されていません',
          timestamp: Date.now(),
        };
      }

      try {
        const { range } = command;
        // DELETE_TEXTは複雑なため、基本実装のみ
        return {
          success: false,
          error: 'DELETE_TEXTは現在未実装です',
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー',
          timestamp: Date.now(),
        };
      }
    },
    [editor]
  );

  /**
   * FORMAT_TEXTコマンドを実行
   */
  const executeFormatText = useCallback(
    (command: FormatTextCommand): ExecutionResult => {
      if (!editor) {
        return {
          success: false,
          error: 'エディタが初期化されていません',
          timestamp: Date.now(),
        };
      }

      try {
        const { format } = command;
        // FORMAT_TEXTは複雑なため、基本実装のみ
        return {
          success: false,
          error: 'FORMAT_TEXTは現在未実装です',
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー',
          timestamp: Date.now(),
        };
      }
    },
    [editor]
  );

  /**
   * INSERT_PARAGRAPHコマンドを実行
   */
  const executeInsertParagraph = useCallback(
    (command: InsertParagraphCommand): ExecutionResult => {
      if (!editor) {
        return {
          success: false,
          error: 'エディタが初期化されていません',
          timestamp: Date.now(),
        };
      }

      try {
        const { text } = command;
        // INSERT_PARAGRAPHは複雑なため、基本実装のみ
        return {
          success: false,
          error: 'INSERT_PARAGRAPHは現在未実装です',
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー',
          timestamp: Date.now(),
        };
      }
    },
    [editor]
  );

  /**
   * DELETE_PARAGRAPHコマンドを実行
   */
  const executeDeleteParagraph = useCallback(
    (command: DeleteParagraphCommand): ExecutionResult => {
      if (!editor) {
        return {
          success: false,
          error: 'エディタが初期化されていません',
          timestamp: Date.now(),
        };
      }

      try {
        const { paragraph } = command;
        // DELETE_PARAGRAPHは複雑なため、基本実装のみ
        return {
          success: false,
          error: 'DELETE_PARAGRAPHは現在未実装です',
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : '不明なエラー',
          timestamp: Date.now(),
        };
      }
    },
    [editor]
  );

  /**
   * 単一のコマンドを実行
   */
  const executeCommand = useCallback(
    (command: Command): ExecutionResult => {
      switch (command.type) {
        case 'INSERT_TEXT':
          return executeInsertText(command);

        case 'REPLACE_TEXT':
          return executeReplaceText(command);

        case 'DELETE_TEXT':
          return executeDeleteText(command);

        case 'FORMAT_TEXT':
          return executeFormatText(command);

        case 'INSERT_PARAGRAPH':
          return executeInsertParagraph(command);

        case 'DELETE_PARAGRAPH':
          return executeDeleteParagraph(command);

        case 'MOVE_PARAGRAPH':
          return {
            success: false,
            error: 'MOVE_PARAGRAPHは現在未実装です',
            timestamp: Date.now(),
          };

        default:
          return {
            success: false,
            error: '不明なコマンドタイプ',
            timestamp: Date.now(),
          };
      }
    },
    [
      executeInsertText,
      executeReplaceText,
      executeDeleteText,
      executeFormatText,
      executeInsertParagraph,
      executeDeleteParagraph,
    ]
  );

  /**
   * 複数のコマンドを順次実行
   */
  const executeCommands = useCallback(
    (commands: Command[]): ExecutionResult[] => {
      return commands.map((command) => executeCommand(command));
    },
    [executeCommand]
  );

  return {
    executeCommand,
    executeCommands,
  };
}
