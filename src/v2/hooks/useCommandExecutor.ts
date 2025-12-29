/**
 * コマンド実行フック
 * Tiptapエディタでコマンドを実行する
 */

import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import type {
  Command,
  ExecutionResult,
} from '@/types/ai-sync.types';
import * as CommandExecutors from '@/services/commandExecutionService';

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
   * 単一のコマンドを実行
   */
  const executeCommand = useCallback(
    (command: Command): ExecutionResult => {
      if (!editor) {
        return {
          success: false,
          error: 'エディタが初期化されていません',
          timestamp: Date.now(),
        };
      }

      switch (command.type) {
        case 'INSERT_TEXT':
          return CommandExecutors.executeInsertText(editor, command);

        case 'REPLACE_TEXT':
          return CommandExecutors.executeReplaceText(editor, command);

        case 'DELETE_TEXT':
          return CommandExecutors.executeDeleteText(editor, command);

        case 'FORMAT_TEXT':
          return CommandExecutors.executeFormatText(editor, command);

        case 'INSERT_PARAGRAPH':
          return CommandExecutors.executeInsertParagraph(editor, command);

        case 'DELETE_PARAGRAPH':
          return CommandExecutors.executeDeleteParagraph(editor, command);

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
    [editor]
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
