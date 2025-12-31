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
    const isPlaceholder = node.attrs['data-virtual-placeholder'] === 'true';
    
    // プレースホルダーの場合は、「あとに挿入」ではなく「これ自体をその内容にする」（実質置換）
    const insertPos = isPlaceholder ? pos : pos + node.nodeSize;

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

    if (isPlaceholder) {
      // プレースホルダーを消して同じ位置に挿入
      editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .insertContentAt(insertPos, {
          type: typeName,
          attrs,
          content,
        })
        .run();
    } else {
      // 通常の挿入（あとに挿入）
      editor
        .chain()
        .focus()
        .insertContentAt(insertPos, {
          type: typeName,
          attrs,
          content,
        })
        .run();
    }

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
