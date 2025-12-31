import type { Editor } from '@tiptap/react';
import type { SplitParagraphCommand, CommandExecutionResult } from '@/types/command';
import { 
  findParagraphById, 
  captureParagraphSnapshot, 
  parseHtmlText 
} from '@/utils/paragraphOperations';

/**
 * SPLIT_PARAGRAPH コマンドを実行
 */
export function executeSplitParagraph(
  editor: Editor,
  command: SplitParagraphCommand
): CommandExecutionResult {
  const { targetId, beforeText, afterText, tempId, commandId } = command;

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
