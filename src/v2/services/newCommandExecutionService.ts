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

import { isVirtualNewPageTarget, getMaxPageNumber } from '@/utils/paragraphFinder';

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
  const originalMaxPage = getMaxPageNumber(editor);
  let lastUsedVirtualPage = originalMaxPage;

  for (const command of commands) {
    // ターゲットが新ページの最初の段落 (pX-1) かつ現在の最大ページより大きいか判定
    const match = command.targetId.match(/^p(\d+)-1$/);
    if (match && parseInt(match[1], 10) > originalMaxPage) {
      // 本来の要求ページ番号（X）か、既に発行済みの仮想ページ＋1の大きい方を採用
      // これにより、複数の p3-1 指定があった場合に P3, P4... と連番で生成される
      const requestedPageNum = parseInt(match[1], 10);
      const actualPageNum = Math.max(requestedPageNum, lastUsedVirtualPage + 1);
      lastUsedVirtualPage = actualPageNum;
      
      const placeholderId = `temp-virtual-${actualPageNum}-1`;

      // 新ページとプレースホルダー段落を作成
      // ドキュメントの最後に挿入
      editor.chain().focus().insertContentAt(editor.state.doc.content.size, {
        type: 'page',
        attrs: { 'data-page': String(actualPageNum) },
        content: [
          {
            type: 'paragraph',
            attrs: { 
              'data-temp-id': placeholderId, 
              'data-virtual-placeholder': 'true' 
            }
          }
        ]
      }).run();

      // コマンドのターゲットを内部的なプレースホルダーIDに差し替える
      (command as any).targetId = placeholderId;
    }

    const result = executeNewCommand(editor, command);
    results.push(result);

    // エラーが発生した場合は中断
    if (!result.success) {
      console.error(`コマンド実行エラー: ${result.error}`);
      break;
    }
  }

  // クリーンアップ：役割を終えた仮想プレースホルダー段落を削除
  // （REPLACEされた場合は既に消えているが、INSERTされた場合は残っているため）
  const placeholdersToDelete: { from: number; to: number }[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (
      node.type.name === 'paragraph' && 
      node.attrs['data-virtual-placeholder'] === 'true'
    ) {
      placeholdersToDelete.push({ from: pos, to: pos + node.nodeSize });
      return false;
    }
  });

  if (placeholdersToDelete.length > 0) {
    let chain = editor.chain().focus();
    // 逆順に削除して位置ズレを防ぐ
    for (let i = placeholdersToDelete.length - 1; i >= 0; i--) {
      const p = placeholdersToDelete[i];
      chain = chain.deleteRange(p.from, p.to);
    }
    chain.run();
  }

  return results;
}
