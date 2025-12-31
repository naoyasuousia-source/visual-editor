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

/**
 * エディタ内の最大ページ番号を取得
 */
export function getMaxPageNumber(editor: Editor): number {
  let maxPage = 0;
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'page') {
      const pageNum = parseInt(node.attrs['data-page'] || '0', 10);
      if (pageNum > maxPage) maxPage = pageNum;
    }
  });
  
  // pageノードがない場合は、ドキュメント全体を1ページ目とみなす
  return maxPage || 1;
}

/**
 * 指定されたIDが「まだ存在しない新ページの最初の段落」を指しているか判定
 */
export function isVirtualNewPageTarget(
  editor: Editor,
  paragraphId: ParagraphId,
  maxPage?: number
): boolean {
  if (!isValidParagraphId(paragraphId)) return false;
  
  // 公式ID形式 (pX-1) であることを確認 (ページ番号X, 段落番号1)
  const match = paragraphId.match(/^p(\d+)-1$/);
  if (!match) return false;
  
  const pageNum = parseInt(match[1], 10);
  const currentMaxPage = maxPage !== undefined ? maxPage : getMaxPageNumber(editor);
  
  // 現在の最大ページ数より大きいページ番号の1段落目であればバーチャルターゲット
  return pageNum > currentMaxPage;
}
