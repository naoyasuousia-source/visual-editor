/**
 * 段落操作ユーティリティ
 * Tiptapエディタ上での段落検索と操作を行う
 */

import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { ParagraphId, ParagraphOptions, ParagraphSnapshot } from '@/types/command';
import { isValidParagraphId } from '@/utils/paragraphIdManager';

/**
 * エディタ内から段落IDで段落ノードを検索
 * 
 * @param editor - Tiptapエディタインスタンス
 * @param paragraphId - 検索する段落ID
 * @returns 段落ノードとその位置、見つからない場合はnull
 */
export function findParagraphById(
  editor: Editor,
  paragraphId: ParagraphId
): { node: ProseMirrorNode; pos: number } | null {
  if (!isValidParagraphId(paragraphId)) {
    return null;
  }

  let result: { node: ProseMirrorNode; pos: number } | null = null;

  editor.state.doc.descendants((node, pos) => {
    // 段落または見出しノードかつIDが一致する場合
    if (
      (node.type.name === 'paragraph' || node.type.name === 'heading') &&
      (node.attrs.id === paragraphId || node.attrs['data-temp-id'] === paragraphId)
    ) {
      result = { node, pos };
      return false; // 検索終了
    }
  });

  return result;
}

/**
 * 段落の現在のスナップショットを取得
 * 
 * @param editor - Tiptapエディタインスタンス
 * @param paragraphId - 段落ID
 * @returns スナップショット、見つからない場合はnull
 */
export function captureParagraphSnapshot(
  editor: Editor,
  paragraphId: ParagraphId
): ParagraphSnapshot | null {
  const found = findParagraphById(editor, paragraphId);
  if (!found) {
    return null;
  }

  const { node } = found;
  
  // blockType の判定（heading の場合は level から判定）
  let blockType: BlockType = 'p';
  if (node.type.name === 'heading') {
    blockType = `h${node.attrs.level}` as BlockType;
  } else {
    blockType = (node.attrs.blockType as BlockType) || 'p';
  }

  return {
    paragraphId,
    text: node.textContent,
    html: node.type.spec.toDOM?.(node) 
      ? (node.type.spec.toDOM(node) as any).outerHTML || ''
      : '',
    options: {
      blockType,
      textAlign: (node.attrs.textAlign as ParagraphOptions['textAlign']) || 'left',
      spacing: (node.attrs.spacing as ParagraphOptions['spacing']) || 'none',
      indent: (node.attrs.indent as ParagraphOptions['indent']) || 0,
    },
    timestamp: Date.now(),
  };
}

/**
 * 複数段落のスナップショットを取得
 * 
 * @param editor - Tiptapエディタインスタンス
 * @param paragraphIds - 段落ID配列
 * @returns スナップショット配列
 */
export function captureMultipleSnapshots(
  editor: Editor,
  paragraphIds: ParagraphId[]
): ParagraphSnapshot[] {
  const snapshots: ParagraphSnapshot[] = [];
  
  for (const id of paragraphIds) {
    const snapshot = captureParagraphSnapshot(editor, id);
    if (snapshot) {
      snapshots.push(snapshot);
    }
  }

  return snapshots;
}

/**
 * 段落ノードにオプションを適用
 * 
 * @param editor - Tiptapエディタインスタンス
 * @param paragraphId - 段落ID
 * @param options - 適用するオプション
 * @returns 成功した場合true
 */
export function applyParagraphOptions(
  editor: Editor,
  paragraphId: ParagraphId,
  options: ParagraphOptions
): boolean {
  const found = findParagraphById(editor, paragraphId);
  if (!found) {
    return false;
  }

  const { node, pos } = found;
  const { blockType, textAlign, spacing, indent } = options;

  try {
    let typeName = 'paragraph';
    const attrs: any = { ...node.attrs };

    // blockType に応じてノードタイプを決定
    if (blockType && blockType !== 'p') {
      typeName = 'heading';
      attrs.level = parseInt(blockType.substring(1), 10);
      attrs.blockType = blockType;
    } else {
      typeName = 'paragraph';
      attrs.blockType = 'p';
      delete attrs.level;
    }

    // その他の属性を更新
    if (textAlign) attrs.textAlign = textAlign;
    if (spacing) attrs.spacing = spacing;
    if (indent !== undefined) attrs.indent = indent;

    // ノードのタイプと属性を更新
    editor.chain().focus().setNodeSelection(pos).setNodeMarkup(typeName, attrs).run();

    return true;
  } catch (error) {
    console.error('段落オプションの適用エラー:', error);
    return false;
  }
}

/**
 * HTMLテキストをパースしてTiptapノード用のコンテンツに変換
 * 太字、改行、上付き下付きタグを解釈
 * 
 * @param htmlText - HTMLタグを含むテキスト
 * @returns パースされたコンテンツ配列
 */
export function parseHtmlText(htmlText: string): any[] {
  const content: any[] = [];
  
  // 簡易的なHTMLパーサー（<b>、<br>、<sup>、<sub>をサポート）
  const regex = /(<b>|<\/b>|<br>|<sup>|<\/sup>|<sub>|<\/sub>)|([^<]+)/g;
  let match;
  let currentMarks: string[] = [];

  while ((match = regex.exec(htmlText)) !== null) {
    if (match[1]) {
      // タグ
      const tag = match[1];
      if (tag === '<b>') {
        currentMarks.push('bold');
      } else if (tag === '</b>') {
        currentMarks = currentMarks.filter(m => m !== 'bold');
      } else if (tag === '<sup>') {
        currentMarks.push('superscript');
      } else if (tag === '</sup>') {
        currentMarks = currentMarks.filter(m => m !== 'superscript');
      } else if (tag === '<sub>') {
        currentMarks.push('subscript');
      } else if (tag === '</sub>') {
        currentMarks = currentMarks.filter(m => m !== 'subscript');
      } else if (tag === '<br>') {
        content.push({ type: 'hardBreak' });
      }
    } else if (match[2]) {
      // テキスト
      const text = match[2];
      const node: any = { type: 'text', text };
      if (currentMarks.length > 0) {
        node.marks = currentMarks.map(mark => ({ type: mark }));
      }
      content.push(node);
    }
  }

  return content;
}

/**
 * 全段落にIDを自動付与（まだIDがない場合）
 * 
 * @param editor - Tiptapエディタインスタンス
 * @returns 付与したID数
 */
export function assignIdsToAllParagraphs(editor: Editor): number {
  let assignedCount = 0;
  let currentPage = 1;
  let paragraphNumberInPage = 1;

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
      // すでにIDがある場合はスキップ
      if (!node.attrs.id && !node.attrs['data-temp-id']) {
        const newId = `p${currentPage}-${paragraphNumberInPage}`;
        editor.chain().focus().setNodeSelection(pos).updateAttributes(node.type.name, {
          id: newId,
        }).run();
        assignedCount++;
        paragraphNumberInPage++;
      }
    } else if (node.type.name === 'page') {
      // ページ境界を検知
      currentPage++;
      paragraphNumberInPage = 1;
    }
  });

  return assignedCount;
}

/**
 * 段落IDの存在を確認
 * 
 * @param editor - Tiptapエディタインスタンス
 * @param paragraphId - 段落ID
 * @returns 存在する場合true
 */
export function paragraphExists(
  editor: Editor,
  paragraphId: ParagraphId
): boolean {
  return findParagraphById(editor, paragraphId) !== null;
}

/**
 * 指定位置の段落IDを取得
 * 
 * @param editor - Tiptapエディタインスタンス
 * @param pos - ドキュメント内の位置
 * @returns 段落ID、見つからない場合はnull
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
