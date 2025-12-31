import type { Editor } from '@tiptap/react';
import type { MergeParagraphCommand, CommandExecutionResult } from '@/types/command';
import { 
  findParagraphById, 
  captureMultipleSnapshots, 
  parseHtmlText 
} from '@/utils/paragraphOperations';

/**
 * MERGE_PARAGRAPH コマンドを実行
 */
export function executeMergeParagraph(
  editor: Editor,
  command: MergeParagraphCommand
): CommandExecutionResult {
  const { sourceId, targetId, commandId } = command;

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

    const mergedText = targetNode.textContent + sourceNode.textContent;

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
