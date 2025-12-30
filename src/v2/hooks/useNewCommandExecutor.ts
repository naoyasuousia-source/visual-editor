/**
 * 新コマンド実行フック
 * 新コマンドシステムのコマンド実行を管理
 */

import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import type { Command, CommandExecutionResult } from '@/types/command';
import { executeNewCommand, executeNewCommands } from '@/services/newCommandExecutionService';

/**
 * 新コマンド実行フック
 * 
 * @param editor - Tiptapエディタインスタンス
 * @returns コマンド実行関数
 */
export function useNewCommandExecutor(editor: Editor | null) {
  /**
   * 単一コマンドを実行
   */
  const executeSingleCommand = useCallback(
    (command: Command): CommandExecutionResult | null => {
      if (!editor) {
        console.error('エディタが初期化されていません');
        return null;
      }

      try {
        const result = executeNewCommand(editor, command);
        
        if (!result.success) {
          console.error(`コマンド実行エラー: ${result.error}`);
        }

        return result;
      } catch (error) {
        console.error('コマンド実行中に例外が発生しました:', error);
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
   * 複数のコマンドを順次実行
   */
  const executeMultipleCommands = useCallback(
    (commands: Command[]): CommandExecutionResult[] => {
      if (!editor) {
        console.error('エディタが初期化されていません');
        return [];
      }

      try {
        const results = executeNewCommands(editor, commands);
        
        const failedCommands = results.filter(r => !r.success);
        if (failedCommands.length > 0) {
          console.error(`${failedCommands.length}個のコマンドが失敗しました`);
        }

        return results;
      } catch (error) {
        console.error('複数コマンド実行中に例外が発生しました:', error);
        return [];
      }
    },
    [editor]
  );

  return {
    executeSingleCommand,
    executeMultipleCommands,
  };
}
