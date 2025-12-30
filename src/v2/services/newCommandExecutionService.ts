/**
 * 新コマンド実行サービス
 * 段落IDベースのコマンドを実行
 */

import type { Editor } from '@tiptap/react';
import type {
  Command,
  CommandExecutionResult,
} from '@/types/command';
import { executeReplaceParagraph } from './commands/replaceHandler';
import { executeInsertParagraph } from './commands/insertHandler';
import { executeDeleteParagraph } from './commands/deleteHandler';
import { executeMoveParagraph } from './commands/moveHandler';
import { executeSplitParagraph } from './commands/splitHandler';
import { executeMergeParagraph } from './commands/mergeHandler';

/**
 * コマンドを実行
 * 
 * @param editor - Tiptapエディタ
 * @param command - コマンド
 * @returns 実行結果
 */
export function executeNewCommand(
  editor: Editor,
  command: Command
): CommandExecutionResult {
  switch (command.type) {
    case 'REPLACE_PARAGRAPH':
      return executeReplaceParagraph(editor, command);
    case 'INSERT_PARAGRAPH':
      return executeInsertParagraph(editor, command);
    case 'DELETE_PARAGRAPH':
      return executeDeleteParagraph(editor, command);
    case 'MOVE_PARAGRAPH':
      return executeMoveParagraph(editor, command);
    case 'SPLIT_PARAGRAPH':
      return executeSplitParagraph(editor, command);
    case 'MERGE_PARAGRAPH':
      return executeMergeParagraph(editor, command);
    default:
      const never: never = command;
      throw new Error(`未知のコマンドタイプ: ${(never as any).type}`);
  }
}

/**
 * 複数のコマンドを順次実行
 * 
 * @param editor - Tiptapエディタ
 * @param commands - コマンド配列
 * @returns 実行結果配列
 */
export function executeNewCommands(
  editor: Editor,
  commands: Command[]
): CommandExecutionResult[] {
  const results: CommandExecutionResult[] = [];

  for (const command of commands) {
    const result = executeNewCommand(editor, command);
    results.push(result);

    // エラーが発生した場合は中断
    if (!result.success) {
      console.error(`コマンド実行エラー: ${result.error}`);
      break;
    }
  }

  return results;
}
