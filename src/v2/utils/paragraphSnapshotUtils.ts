import type { Editor } from '@tiptap/react';
import type { ParagraphId, ParagraphSnapshot, BlockType, ParagraphOptions, IndentLevel } from '@/types/command';
import { findParagraphById } from '@/utils/paragraphFinder';
import { parseHtmlText } from '@/utils/tiptapContentUtils';

/**
 * 段落の現在のスナップショットを取得
 */
export function captureParagraphSnapshot(
  editor: Editor,
  paragraphId: ParagraphId
): ParagraphSnapshot | null {
  const found = findParagraphById(editor, paragraphId);
  if (!found) return null;

  const { node } = found;
  
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
      textAlign: (node.attrs.align as any) || (node.attrs.textAlign as any) || 'left',
      spacing: (node.attrs.spacing as any) || 'none',
      indent: node.attrs.indent ? parseInt(node.attrs.indent, 10) as IndentLevel : 0,
    },
    timestamp: Date.now(),
  };
}

/**
 * 複数段落のスナップショットを取得
 */
export function captureMultipleSnapshots(
  editor: Editor,
  paragraphIds: ParagraphId[]
): ParagraphSnapshot[] {
  return paragraphIds
    .map(id => captureParagraphSnapshot(editor, id))
    .filter((s): s is ParagraphSnapshot => s !== null);
}

/**
 * スナップショットから段落を完全に復元
 */
export function restoreParagraphFromSnapshot(
  editor: Editor,
  pos: number,
  snapshot: ParagraphSnapshot
): void {
  const { options, paragraphId, text } = snapshot;
  let typeName = 'paragraph';
  const attrs: any = { id: paragraphId };

  if (options.blockType && options.blockType !== 'p') {
    typeName = 'heading';
    attrs.level = parseInt(options.blockType.substring(1), 10);
    attrs.blockType = options.blockType;
  } else {
    typeName = 'paragraph';
    attrs.blockType = 'p';
  }

  if (options.textAlign) attrs.align = options.textAlign;
  if (options.spacing) attrs.spacing = options.spacing;
  if (options.indent !== undefined) attrs.indent = options.indent !== 0 ? String(options.indent) : null;

  editor
    .chain()
    .focus()
    .setNodeSelection(pos)
    .deleteSelection()
    .insertContentAt(pos, {
      type: typeName,
      attrs,
      content: parseHtmlText(text || ''),
    })
    .run();
}
