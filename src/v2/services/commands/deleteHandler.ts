import type { Editor } from '@tiptap/react';
import type { DeleteParagraphCommand, CommandExecutionResult } from '@/types/command';
import { 
  findParagraphById, 
  captureParagraphSnapshot 
} from '@/utils/paragraphOperations';

/**
 * DELETE_PARAGRAPH コマンドを実行
 */
export function executeDeleteParagraph(
  editor: Editor,
  command: DeleteParagraphCommand
): CommandExecutionResult {
  const { targetId, commandId } = command;

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
