import type { Editor } from '@tiptap/react';
import type { ReplaceParagraphCommand, CommandExecutionResult } from '@/types/command';
import { 
  findParagraphById, 
  captureParagraphSnapshot, 
  parseHtmlText, 
  applyParagraphOptions 
} from '@/utils/paragraphOperations';

/**
 * REPLACE_PARAGRAPH コマンドを実行
 */
export function executeReplaceParagraph(
  editor: Editor,
  command: ReplaceParagraphCommand
): CommandExecutionResult {
  const { targetId, text, options, commandId } = command;

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
    const content = parseHtmlText(text);

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

    editor
      .chain()
      .focus()
      .insertContentAt({ from: pos, to: pos + found.node.nodeSize }, {
        type: typeName,
        attrs,
        content,
      })
      .run();

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
