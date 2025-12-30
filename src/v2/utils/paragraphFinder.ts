import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { ParagraphId } from '@/types/command';
import { isValidParagraphId } from '@/utils/paragraphIdManager';

/**
 * エディタ内から段落IDで段落ノードを検索
 */
export function findParagraphById(
  editor: Editor,
  paragraphId: ParagraphId
): { node: ProseMirrorNode; pos: number } | null {
  if (!isValidParagraphId(paragraphId)) return null;

  let result: { node: ProseMirrorNode; pos: number } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (
      (node.type.name === 'paragraph' || node.type.name === 'heading') &&
      (node.attrs.id === paragraphId || node.attrs['data-temp-id'] === paragraphId)
    ) {
      result = { node, pos };
      return false;
    }
  });

  return result;
}

/**
 * 段落IDの存在を確認
 */
export function paragraphExists(
  editor: Editor,
  paragraphId: ParagraphId
): boolean {
  return findParagraphById(editor, paragraphId) !== null;
}

/**
 * 指定位置の段落IDを取得
 */
export function getParagraphIdAtPosition(
  editor: Editor,
  pos: number
): ParagraphId | null {
  const resolvedPos = editor.state.doc.resolve(pos);
  const node = resolvedPos.node();

  if (node.type.name === 'paragraph') {
    return (node.attrs.id as ParagraphId) || (node.attrs['data-temp-id'] as ParagraphId) || null;
  }

  return null;
}
