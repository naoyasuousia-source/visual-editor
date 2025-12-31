/**
 * 段落操作ユーティリティ
 */

import type { Editor } from '@tiptap/react';
import type { ParagraphId, ParagraphOptions } from '@/types/command';
import { findParagraphById } from '@/utils/paragraphFinder';

// 他のファイルに移動した機能を再エクスポート
export * from './paragraphFinder';
export * from './paragraphSnapshotUtils';
export * from './tiptapContentUtils';

/**
 * 段落ノードにオプションを適用
 */
export function applyParagraphOptions(
  editor: Editor,
  paragraphId: ParagraphId,
  options: ParagraphOptions
): boolean {
  const found = findParagraphById(editor, paragraphId);
  if (!found) return false;

  const { node, pos } = found;
  const { blockType, textAlign, spacing, indent } = options;

  try {
    let typeName = 'paragraph';
    const attrs: any = { ...node.attrs };

    if (blockType && blockType !== 'p') {
      typeName = 'heading';
      attrs.level = parseInt(blockType.substring(1), 10);
      attrs.blockType = blockType;
    } else {
      typeName = 'paragraph';
      attrs.blockType = 'p';
      delete attrs.level;
    }

    if (textAlign) attrs.align = textAlign;
    if (spacing) attrs.spacing = spacing;
    if (indent !== undefined) attrs.indent = indent !== 0 ? String(indent) : null;

    editor.chain().focus().setNodeSelection(pos).setNodeMarkup(typeName, attrs).run();
    return true;
  } catch (error) {
    console.error('段落オプションの適用エラー:', error);
    return false;
  }
}

/**
 * 全段落にIDを自動付与
 */
export function assignIdsToAllParagraphs(editor: Editor): number {
  let assignedCount = 0;
  let currentPage = 1;
  let paragraphNumberInPage = 1;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      if (!node.attrs.id && !node.attrs['data-temp-id']) {
        const newId = `p${currentPage}-${paragraphNumberInPage}`;
        editor.chain().focus().setNodeSelection(pos).updateAttributes(node.type.name, {
          id: newId,
        }).run();
        assignedCount++;
        paragraphNumberInPage++;
      }
    } else if (node.type.name === 'page') {
      currentPage++;
      paragraphNumberInPage = 1;
    }
  });

  return assignedCount;
}
