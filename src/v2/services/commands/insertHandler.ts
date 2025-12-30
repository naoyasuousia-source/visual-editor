import type { Editor } from '@tiptap/react';
import type { InsertParagraphCommand, CommandExecutionResult } from '@/types/command';
import { 
  findParagraphById, 
  parseHtmlText, 
  applyParagraphOptions 
} from '@/utils/paragraphOperations';

/**
 * INSERT_PARAGRAPH コマンドを実行
 */
export function executeInsertParagraph(
  editor: Editor,
  command: InsertParagraphCommand
): CommandExecutionResult {
  const { targetId, text, options, tempId, commandId } = command;

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
    const insertPos = pos + node.nodeSize;

    const content = parseHtmlText(text);

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

    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, {
        type: typeName,
        attrs,
        content,
      })
      .run();

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
