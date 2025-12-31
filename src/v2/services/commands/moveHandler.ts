import type { Editor } from '@tiptap/react';
import type { MoveParagraphCommand, CommandExecutionResult } from '@/types/command';
import { 
  findParagraphById, 
  captureParagraphSnapshot 
} from '@/utils/paragraphOperations';

/**
 * MOVE_PARAGRAPH コマンドを実行
 */
export function executeMoveParagraph(
  editor: Editor,
  command: MoveParagraphCommand
): CommandExecutionResult {
  const { sourceId, targetId, commandId } = command;

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
    const isPlaceholder = targetNode.attrs['data-virtual-placeholder'] === 'true';

    const sourceSize = sourceNode.nodeSize;
    let insertPos = isPlaceholder ? targetPos : targetPos + targetNode.nodeSize;

    // 移動元と移動先が同じ、または移動元が既にターゲットの直後にある場合は何もしない
    if (sourcePos === insertPos || (!isPlaceholder && sourcePos === targetPos + targetNode.nodeSize)) {
      return {
        success: true,
        commandId,
        commandType: 'MOVE_PARAGRAPH',
        affectedParagraphIds: [sourceId],
        beforeSnapshot: [beforeSnapshot],
        timestamp: Date.now(),
      };
    }

    // 移動元が移動先より前にある場合、削除によって移動先のIndexが手前にずれるのを補正
    if (sourcePos < insertPos) {
      insertPos -= sourceSize;
    }

    const sourceContent = sourceNode.content.toJSON();

    if (isPlaceholder) {
      // プレースホルダーの場合はその場所に割り込む形で移動し、プレースホルダーを消す
      editor
        .chain()
        .focus()
        .deleteRange({ from: sourcePos, to: sourcePos + sourceSize })
        // sourcePos < insertPos の補正は済んでいるので insertPos をそのまま使う
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
        // 挿入後にずれたプレースホルダー（元あった場所＋挿入分）を削除
        // プレースホルダーの新しい位置 = insertPos + sourceSize
        .deleteRange({ from: insertPos + sourceSize, to: insertPos + sourceSize + targetNode.nodeSize })
        .run();
    } else {
      // 通常の移動（あとに挿入）
      editor
        .chain()
        .focus()
        .deleteRange({ from: sourcePos, to: sourcePos + sourceSize })
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
    }

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
