/**
 * 新コマンド実行サービス
 * 段落IDベースのコマンドを実行
 */

import type { Editor } from '@tiptap/react';
import type {
  Command,
  CommandExecutionResult,
  ParagraphSnapshot,
  ReplaceParagraphCommand,
  InsertParagraphCommand,
  DeleteParagraphCommand,
  MoveParagraphCommand,
  SplitParagraphCommand,
  MergeParagraphCommand,
} from '@/types/command';
import {
  findParagraphById,
  captureParagraphSnapshot,
  captureMultipleSnapshots,
  applyParagraphOptions,
  parseHtmlText,
} from '@/utils/paragraphOperations';

/**
 * REPLACE_PARAGRAPH コマンドを実行
 * 指定段落を新テキスト+オプションで置換
 * 
 * @param editor - Tiptapエディタ
 * @param command - コマンド
 * @returns 実行結果
 */
function executeReplaceParagraph(
  editor: Editor,
  command: ReplaceParagraphCommand
): CommandExecutionResult {
  const { targetId, text, options, commandId } = command;

  // 段落を検索
  const found = findParagraphById(editor, targetId);
  if (!found) {
    return {
      success: false,
      commandId,
      commandType: 'REPLACE_PARAGRAPH',
      affectedParagraphIds: [],
      error: `段落ID ${targetId} が見つかりません`,
      timestamp: Date.now(),
    };
  }

  // 実行前スナップショット
  const beforeSnapshot = captureParagraphSnapshot(editor, targetId);
  if (!beforeSnapshot) {
    return {
      success: false,
      commandId,
      commandType: 'REPLACE_PARAGRAPH',
      affectedParagraphIds: [],
      error: 'スナップショット取得に失敗',
      timestamp: Date.now(),
    };
  }

  try {
    const { pos } = found;

    // HTMLテキストをパース
    const content = parseHtmlText(text);

    // ノードタイプと属性の決定
    let typeName = 'paragraph';
    const attrs: any = {
      id: targetId,
      'data-command-type': 'replace',
      'data-command-id': commandId,
    };

    if (options?.blockType && options.blockType !== 'p') {
      typeName = 'heading';
      attrs.level = parseInt(options.blockType.substring(1), 10);
      attrs.blockType = options.blockType;
    } else {
      attrs.blockType = 'p';
    }

    if (options?.textAlign) attrs.align = options.textAlign;
    if (options?.spacing) attrs.spacing = options.spacing;
    if (options?.indent !== undefined) attrs.indent = options.indent !== 0 ? String(options.indent) : null;

    // 段落内容を置換
    editor
      .chain()
      .focus()
      .setNodeSelection(pos)
      .deleteSelection()
      .insertContentAt(pos, {
        type: typeName,
        attrs,
        content,
      })
      .run();

    // オプション適用
    if (options) {
      applyParagraphOptions(editor, targetId, options);
    }

    return {
      success: true,
      commandId,
      commandType: 'REPLACE_PARAGRAPH',
      affectedParagraphIds: [targetId],
      beforeSnapshot: [beforeSnapshot],
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      commandId,
      commandType: 'REPLACE_PARAGRAPH',
      affectedParagraphIds: [],
      error: error instanceof Error ? error.message : '不明なエラー',
      beforeSnapshot: [beforeSnapshot],
      timestamp: Date.now(),
    };
  }
}

/**
 * INSERT_PARAGRAPH コマンドを実行
 * 指定段落の直後に新段落を挿入
 * 
 * @param editor - Tiptapエディタ
 * @param command - コマンド
 * @returns 実行結果
 */
function executeInsertParagraph(
  editor: Editor,
  command: InsertParagraphCommand
): CommandExecutionResult {
  const { targetId, text, options, tempId, commandId } = command;

  // ターゲット段落を検索
  const found = findParagraphById(editor, targetId);
  if (!found) {
    return {
      success: false,
      commandId,
      commandType: 'INSERT_PARAGRAPH',
      affectedParagraphIds: [],
      error: `段落ID ${targetId} が見つかりません`,
      timestamp: Date.now(),
    };
  }

  try {
    const { node, pos } = found;
    const insertPos = pos + node.nodeSize; // ターゲット段落の直後

    // HTMLテキストをパース
    const content = parseHtmlText(text);

    // ノードタイプと属性の決定
    let typeName = 'paragraph';
    const attrs: any = {
      'data-temp-id': tempId,
      'data-command-type': 'insert',
      'data-command-id': commandId,
    };

    if (options?.blockType && options.blockType !== 'p') {
      typeName = 'heading';
      attrs.level = parseInt(options.blockType.substring(1), 10);
      attrs.blockType = options.blockType;
    } else {
      attrs.blockType = 'p';
    }

    if (options?.textAlign) attrs.align = options.textAlign;
    if (options?.spacing) attrs.spacing = options.spacing;
    if (options?.indent !== undefined) attrs.indent = options.indent !== 0 ? String(options.indent) : null;

    // 新段落を挿入
    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, {
        type: typeName,
        attrs,
        content,
      })
      .run();

    // オプション適用
    if (options && tempId) {
      applyParagraphOptions(editor, tempId, options);
    }

    return {
      success: true,
      commandId,
      commandType: 'INSERT_PARAGRAPH',
      affectedParagraphIds: tempId ? [tempId] : [],
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      commandId,
      commandType: 'INSERT_PARAGRAPH',
      affectedParagraphIds: [],
      error: error instanceof Error ? error.message : '不明なエラー',
      timestamp: Date.now(),
    };
  }
}

/**
 * DELETE_PARAGRAPH コマンドを実行
 * 指定段落を削除（実際には削除マークのみ付与）
 * 
 * @param editor - Tiptapエディタ
 * @param command - コマンド
 * @returns 実行結果
 */
function executeDeleteParagraph(
  editor: Editor,
  command: DeleteParagraphCommand
): CommandExecutionResult {
  const { targetId, commandId } = command;

  // 段落を検索
  const found = findParagraphById(editor, targetId);
  if (!found) {
    return {
      success: false,
      commandId,
      commandType: 'DELETE_PARAGRAPH',
      affectedParagraphIds: [],
      error: `段落ID ${targetId} が見つかりません`,
      timestamp: Date.now(),
    };
  }

  // 実行前スナップショット
  const beforeSnapshot = captureParagraphSnapshot(editor, targetId);
  if (!beforeSnapshot) {
    return {
      success: false,
      commandId,
      commandType: 'DELETE_PARAGRAPH',
      affectedParagraphIds: [],
      error: 'スナップショット取得に失敗',
      timestamp: Date.now(),
    };
  }

  try {
    const { pos } = found;

    // 削除マークを付与（実際には削除せず、視覚的に薄く表示）
    editor
      .chain()
      .focus()
      .setNodeSelection(pos)
      .updateAttributes('paragraph', {
        'data-command-type': 'delete',
        'data-command-id': commandId,
      })
      .run();

    return {
      success: true,
      commandId,
      commandType: 'DELETE_PARAGRAPH',
      affectedParagraphIds: [targetId],
      beforeSnapshot: [beforeSnapshot],
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      commandId,
      commandType: 'DELETE_PARAGRAPH',
      affectedParagraphIds: [],
      error: error instanceof Error ? error.message : '不明なエラー',
      beforeSnapshot: [beforeSnapshot],
      timestamp: Date.now(),
    };
  }
}

/**
 * MOVE_PARAGRAPH コマンドを実行
 * 段落を移動
 * 
 * @param editor - Tiptapエディタ
 * @param command - コマンド
 * @returns 実行結果
 */
function executeMoveParagraph(
  editor: Editor,
  command: MoveParagraphCommand
): CommandExecutionResult {
  const { sourceId, targetId, commandId } = command;

  // 両方の段落を検索
  const sourceFound = findParagraphById(editor, sourceId);
  const targetFound = findParagraphById(editor, targetId);

  if (!sourceFound) {
    return {
      success: false,
      commandId,
      commandType: 'MOVE_PARAGRAPH',
      affectedParagraphIds: [],
      error: `移動元段落ID ${sourceId} が見つかりません`,
      timestamp: Date.now(),
    };
  }

  if (!targetFound) {
    return {
      success: false,
      commandId,
      commandType: 'MOVE_PARAGRAPH',
      affectedParagraphIds: [],
      error: `移動先段落ID ${targetId} が見つかりません`,
      timestamp: Date.now(),
    };
  }

  // 実行前スナップショット
  const beforeSnapshot = captureParagraphSnapshot(editor, sourceId);
  if (!beforeSnapshot) {
    return {
      success: false,
      commandId,
      commandType: 'MOVE_PARAGRAPH',
      affectedParagraphIds: [],
      error: 'スナップショット取得に失敗',
      timestamp: Date.now(),
    };
  }

  try {
    const { node: sourceNode, pos: sourcePos } = sourceFound;
    const { node: targetNode, pos: targetPos } = targetFound;

    // 移動先の直後の位置を計算
    const insertPos = targetPos + targetNode.nodeSize;

    // ノード内容を取得
    const sourceContent = sourceNode.content.toJSON();

    // 移動元を削除し、移動先に挿入（単一のチェーンで実行）
    editor
      .chain()
      .focus()
      .deleteRange({ from: sourcePos, to: sourcePos + sourceNode.nodeSize })
      .insertContentAt(insertPos, {
        type: sourceNode.type.name,
        attrs: {
          ...sourceNode.attrs,
          id: sourceId,
          'data-command-type': 'move',
          'data-command-id': commandId,
          'data-move-from': sourcePos,
        },
        content: sourceContent,
      })
      .run();

    return {
      success: true,
      commandId,
      commandType: 'MOVE_PARAGRAPH',
      affectedParagraphIds: [sourceId],
      beforeSnapshot: [beforeSnapshot],
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      commandId,
      commandType: 'MOVE_PARAGRAPH',
      affectedParagraphIds: [],
      error: error instanceof Error ? error.message : '不明なエラー',
      beforeSnapshot: [beforeSnapshot],
      timestamp: Date.now(),
    };
  }
}

/**
 * SPLIT_PARAGRAPH コマンドを実行
 * 段落を分割
 * 
 * @param editor - Tiptapエディタ
 * @param command - コマンド
 * @returns 実行結果
 */
function executeSplitParagraph(
  editor: Editor,
  command: SplitParagraphCommand
): CommandExecutionResult {
  const { targetId, beforeText, afterText, tempId, commandId } = command;

  // 段落を検索
  const found = findParagraphById(editor, targetId);
  if (!found) {
    return {
      success: false,
      commandId,
      commandType: 'SPLIT_PARAGRAPH',
      affectedParagraphIds: [],
      error: `段落ID ${targetId} が見つかりません`,
      timestamp: Date.now(),
    };
  }

  // 実行前スナップショット
  const beforeSnapshot = captureParagraphSnapshot(editor, targetId);
  if (!beforeSnapshot) {
    return {
      success: false,
      commandId,
      commandType: 'SPLIT_PARAGRAPH',
      affectedParagraphIds: [],
      error: 'スナップショット取得に失敗',
      timestamp: Date.now(),
    };
  }

  try {
    const { node, pos } = found;
    const fullText = node.textContent;

    // 分割位置を特定
    const beforeIndex = fullText.indexOf(beforeText);
    const afterIndex = fullText.indexOf(afterText);

    if (beforeIndex === -1 || afterIndex === -1) {
      return {
        success: false,
        commandId,
        commandType: 'SPLIT_PARAGRAPH',
        affectedParagraphIds: [],
        error: '分割位置の文字列が見つかりません',
        beforeSnapshot: [beforeSnapshot],
        timestamp: Date.now(),
      };
    }

    const splitPos = beforeIndex + beforeText.length;
    const firstPartText = fullText.substring(0, splitPos);
    const secondPartText = fullText.substring(splitPos);

    // 分割実行（単一のチェーンで実行）
    editor
      .chain()
      .focus()
      .setNodeSelection(pos)
      .deleteSelection()
      .insertContentAt(pos, [
        {
          type: node.type.name,
          attrs: {
            ...node.attrs,
            id: targetId,
            'data-command-type': 'split',
            'data-command-id': commandId,
          },
          content: parseHtmlText(firstPartText),
        },
        {
          type: node.type.name,
          attrs: {
            ...node.attrs,
            id: undefined,
            'data-temp-id': tempId,
            'data-command-type': 'split',
            'data-command-id': commandId,
          },
          content: parseHtmlText(secondPartText),
        }
      ])
      .run();

    return {
      success: true,
      commandId,
      commandType: 'SPLIT_PARAGRAPH',
      affectedParagraphIds: [targetId, ...(tempId ? [tempId] : [])],
      beforeSnapshot: [beforeSnapshot],
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      commandId,
      commandType: 'SPLIT_PARAGRAPH',
      affectedParagraphIds: [],
      error: error instanceof Error ? error.message : '不明なエラー',
      beforeSnapshot: [beforeSnapshot],
      timestamp: Date.now(),
    };
  }
}

/**
 * MERGE_PARAGRAPH コマンドを実行
 * 段落を結合
 * 
 * @param editor - Tiptapエディタ
 * @param command - コマンド
 * @returns 実行結果
 */
function executeMergeParagraph(
  editor: Editor,
  command: MergeParagraphCommand
): CommandExecutionResult {
  const { sourceId, targetId, commandId } = command;

  // 両方の段落を検索
  const sourceFound = findParagraphById(editor, sourceId);
  const targetFound = findParagraphById(editor, targetId);

  if (!sourceFound) {
    return {
      success: false,
      commandId,
      commandType: 'MERGE_PARAGRAPH',
      affectedParagraphIds: [],
      error: `結合元段落ID ${sourceId} が見つかりません`,
      timestamp: Date.now(),
    };
  }

  if (!targetFound) {
    return {
      success: false,
      commandId,
      commandType: 'MERGE_PARAGRAPH',
      affectedParagraphIds: [],
      error: `結合先段落ID ${targetId} が見つかりません`,
      timestamp: Date.now(),
    };
  }

  // 実行前スナップショット
  const beforeSnapshots = captureMultipleSnapshots(editor, [sourceId, targetId]);
  if (beforeSnapshots.length < 2) {
    return {
      success: false,
      commandId,
      commandType: 'MERGE_PARAGRAPH',
      affectedParagraphIds: [],
      error: 'スナップショット取得に失敗',
      timestamp: Date.now(),
    };
  }

  try {
    const { node: sourceNode, pos: sourcePos } = sourceFound;
    const { node: targetNode, pos: targetPos } = targetFound;

    // 両方のテキストを結合
    const mergedText = targetNode.textContent + sourceNode.textContent;

    // 結合実行（単一のチェーンで実行）
    editor
      .chain()
      .focus()
      .setNodeSelection(targetPos)
      .deleteSelection()
      .insertContentAt(targetPos, {
        type: targetNode.type.name,
        attrs: {
          ...targetNode.attrs,
          id: targetId,
          'data-command-type': 'merge',
          'data-command-id': commandId,
        },
        content: parseHtmlText(mergedText),
      })
      .deleteRange({ from: sourcePos, to: sourcePos + sourceNode.nodeSize })
      .run();

    return {
      success: true,
      commandId,
      commandType: 'MERGE_PARAGRAPH',
      affectedParagraphIds: [targetId, sourceId],
      beforeSnapshot: beforeSnapshots,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      commandId,
      commandType: 'MERGE_PARAGRAPH',
      affectedParagraphIds: [],
      error: error instanceof Error ? error.message : '不明なエラー',
      beforeSnapshot: beforeSnapshots,
      timestamp: Date.now(),
    };
  }
}

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
      // 中断せず続行する場合はこのbreakをコメントアウト
      break;
    }
  }

  return results;
}
