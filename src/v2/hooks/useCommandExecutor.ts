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

        // 段落を特定
        const paragraphElement = editor.view.dom.querySelector(
          `p[data-para="${position.paragraph}"]`
        );

        if (!paragraphElement) {
          return {
            success: false,
            error: `段落 ${position.paragraph} が見つかりません`,
            timestamp: Date.now(),
          };
        }

        // 段落内の位置を計算
        const paragraphPos = editor.view.posAtDOM(paragraphElement, 0);
        const insertPos = paragraphPos + position.offset + 1; // +1はpタグの開始タグ分

        // テキストを挿入
        editor.chain().focus().insertContentAt(insertPos, text).run();

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

        // エディタの全テキストを取得
        const currentContent = editor.getText();

        // 検索と置換
        let searchRegex: RegExp;
        if (options?.regex) {
          const flags = options.caseSensitive ? 'g' : 'gi';
          searchRegex = new RegExp(search, flags);
        } else {
          const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const flags = options?.caseSensitive ? 'g' : 'gi';
          searchRegex = new RegExp(escapedSearch, flags);
        }

        // 置換を実行
        let matchCount = 0;
        const newContent = currentContent.replace(searchRegex, (match, offset) => {
          if (options?.all || matchCount === 0) {
            matchCount++;
            return replace;
          }
          return match;
        });

        if (matchCount === 0) {
          return {
            success: false,
            error: '検索文字列が見つかりませんでした',
            timestamp: Date.now(),
          };
        }

        // エディタの内容を更新
        editor.commands.setContent(newContent);

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
