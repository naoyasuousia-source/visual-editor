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
      // プレースホルダーの場合は範囲指定で置換（原子的に入れ替える）
      editor
        .chain()
        .focus()
        .insertContentAt({ from: targetPos, to: targetPos + targetNode.nodeSize }, {
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

      // 移動元の削除。挿入（置換ではないが今回はサイズが違う可能性があるので注意）後の位置を計算
      // ターゲットがソースより前にある場合、挿入されたノードのサイズ分だけソースの位置が後ろにずれる
      // ただし、今回は「置換」なので、(sourceNode.nodeSize - targetNode.nodeSize) 分の変動がある
      let adjustedSourcePos = sourcePos;
      if (targetPos < sourcePos) {
        adjustedSourcePos += (sourceNode.nodeSize - targetNode.nodeSize);
      }

      editor
        .chain()
        .focus()
        .deleteRange({ from: adjustedSourcePos, to: adjustedSourcePos + sourceSize })
        .run();
    } else {
      // 通常の移動（あとに挿入）
      // ... (既存のロジックを維持)
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
