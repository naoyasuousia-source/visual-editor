/**
 * コマンド実行フック
 * Tiptapエディタでコマンドを実行する
 * 新コマンドシステム（段落IDベース）と旧コマンドシステムの両方をサポート
 */

import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import type {
  Command as OldCommand,
  ExecutionResult as OldExecutionResult,
} from '@/types/ai-sync.types';
import type {
  Command as NewCommand,
  CommandExecutionResult as NewExecutionResult,
} from '@/types/command';
import * as OldCommandExecutors from '@/services/commandExecutionService';
import { executeNewCommand, executeNewCommands } from '@/services/newCommandExecutionService';

interface UseCommandExecutorReturn {
  /** 旧コマンドを実行（後方互換性のため保持） */
  executeCommand: (command: OldCommand) => OldExecutionResult;
  /** 複数の旧コマンドを順次実行 */
  executeCommands: (commands: OldCommand[]) => OldExecutionResult[];
  /** 新コマンドを実行 */
  executeNewCommand: (command: NewCommand) => NewExecutionResult;
  /** 複数の新コマンドを順次実行 */
  executeNewCommands: (commands: NewCommand[]) => NewExecutionResult[];
}

/**
 * コマンド実行フック
 * @param editor - Tiptapエディタインスタンス
 */
export function useCommandExecutor(editor: Editor | null): UseCommandExecutorReturn {
  /**
   * 単一の旧コマンドを実行（後方互換性のため）
   */
  const executeCommand = useCallback(
    (command: OldCommand): OldExecutionResult => {
      if (!editor) {
        return {
          success: false,
          error: 'エディタが初期化されていません',
          timestamp: Date.now(),
        };
      }

      switch (command.type) {
        case 'INSERT_TEXT':
          return OldCommandExecutors.executeInsertText(editor, command);

        case 'REPLACE_TEXT':
          return OldCommandExecutors.executeReplaceText(editor, command);

        case 'DELETE_TEXT':
          return OldCommandExecutors.executeDeleteText(editor, command);

        case 'INSERT_PARAGRAPH':
          return OldCommandExecutors.executeInsertParagraph(editor, command);

        case 'DELETE_PARAGRAPH':
          return OldCommandExecutors.executeDeleteParagraph(editor, command);

        case 'MOVE_PARAGRAPH':
          return OldCommandExecutors.executeMoveParagraph(editor, command);

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
   * 複数の旧コマンドを順次実行
   */
  const executeCommands = useCallback(
    (commands: OldCommand[]): OldExecutionResult[] => {
      return commands.map((command) => executeCommand(command));
    },
    [executeCommand]
  );

  /**
   * 単一の新コマンドを実行
   */
  const executeSingleNewCommand = useCallback(
    (command: NewCommand): NewExecutionResult => {
      if (!editor) {
        return {
          success: false,
          commandId: command.commandId,
          commandType: command.type,
          affectedParagraphIds: [],
          error: 'エディタが初期化されていません',
          timestamp: Date.now(),
        };
      }

      try {
        return executeNewCommand(editor, command);
      } catch (error) {
        console.error('新コマンド実行エラー:', error);
        return {
          success: false,
          commandId: command.commandId,
          commandType: command.type,
          affectedParagraphIds: [],
          error: error instanceof Error ? error.message : '不明なエラー',
          timestamp: Date.now(),
        };
      }
    },
    [editor]
  );

  /**
   * 複数の新コマンドを順次実行
   */
  const executeMultipleNewCommands = useCallback(
    (commands: NewCommand[]): NewExecutionResult[] => {
      if (!editor) {
        return [];
      }

      try {
        return executeNewCommands(editor, commands);
      } catch (error) {
        console.error('複数新コマンド実行エラー:', error);
        return [];
      }
    },
    [editor]
  );

  return {
    executeCommand,
    executeCommands,
    executeNewCommand: executeSingleNewCommand,
    executeNewCommands: executeMultipleNewCommands,
  };
}

