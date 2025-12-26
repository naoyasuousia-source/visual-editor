import { Editor } from '@tiptap/react';

/**
 * Formatting Actions Hook
 * 
 * Based on v1's formatting.ts, but using Tiptap commands instead of DOM manipulation.
 * All formatting is stored in Tiptap's document state for persistence.
 */

const PARAGRAPH_SPACING_SIZES = ['xs', 's', 'm', 'l', 'xl'] as const;
const LINE_HEIGHT_SIZES = ['s', 'm', 'l'] as const;

type ParagraphSpacingSize = typeof PARAGRAPH_SPACING_SIZES[number];
type LineHeightSize = typeof LINE_HEIGHT_SIZES[number];

/**
 * Apply paragraph spacing using Tiptap's class attribute
 */
/**
 * Apply paragraph spacing using 'spacing' attribute
 */
export function applyParagraphSpacing(
    editor: Editor | null, 
    size: ParagraphSpacingSize | null
): void {
    if (!editor || !size || !PARAGRAPH_SPACING_SIZES.includes(size)) return;
    
    // updateAttributes applies to the text selection for the node type
    editor.chain()
        .focus()
        .updateAttributes('paragraph', { spacing: size })
        .updateAttributes('heading', { spacing: size })
        .run();
}

/**
 * Change indent level using 'indent' attribute
 */
export function changeIndent(editor: Editor | null, delta: number): void {
    if (!editor) return;
    
    const { state, view } = editor;
    const { tr } = state;
    const { from, to } = state.selection;
    
    state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            const currentIndent = parseInt(node.attrs.indent || '0', 10);
            const newIndent = Math.max(0, Math.min(5, currentIndent + delta));
            
            if (currentIndent !== newIndent) {
                // indentが0になったらnullにして属性を削除する（HTMLが綺麗になる）
                const indentVal = newIndent === 0 ? null : String(newIndent);
                
                // hangingもチェック：インデント0ならhangingも解除
                const hangingVal = (newIndent === 0) ? false : node.attrs.hanging;

                tr.setNodeMarkup(pos, undefined, {
                    ...node.attrs,
                    indent: indentVal,
                    hanging: hangingVal
                });
            }
        }
    });

    if (tr.docChanged) {
        view.dispatch(tr);
    }
}

/**
 * Toggle hanging indent using 'hanging' attribute
 */
export function toggleHangingIndent(editor: Editor | null, enabled: boolean): void {
    if (!editor) return;
    
    editor.chain()
        .focus()
        .updateAttributes('paragraph', { hanging: enabled })
        .updateAttributes('heading', { hanging: enabled })
        .run();
}

/**
 * Check if current paragraph has hanging indent enabled
 */
export function hasHangingIndent(editor: Editor | null): boolean {
    if (!editor) return false;
    
    const { state } = editor;
    const { $from } = state.selection;
    // 親ノード（paragraph/heading）の属性を確認
    // depthsを遡ってブロックを探す
    for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            return !!node.attrs.hanging;
        }
    }
    return false;
}

/**
 * Check if hanging indent control should be enabled
 * (Must have indent > 0)
 */
export function canHangingIndent(editor: Editor | null): boolean {
    if (!editor) return false;
    
    const { state } = editor;
    const { $from } = state.selection;
    for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            const indent = parseInt(node.attrs.indent || '0', 10);
            return indent > 0;
        }
    }
    return false;
}

/**
 * Apply line height to all pages using Tiptap commands
 */
export function applyLineHeight(
    editor: Editor | null, 
    size: LineHeightSize | null
): void {
    if (!editor || !size || !LINE_HEIGHT_SIZES.includes(size)) return;
    
    const { state } = editor;
    
    // Apply to all page-inner nodes
    state.doc.descendants((node, pos) => {
        if (node.type.name === 'page') {
            const currentClass = node.attrs.class || '';
            
            // Remove all line-height classes
            let newClass = currentClass;
            LINE_HEIGHT_SIZES.forEach(sz => {
                newClass = newClass.replace(new RegExp(`\\s*line-height-${sz}\\s*`, 'g'), ' ');
            });
            
            // Add new line-height (except 'm' which is default)
            if (size !== 'm') {
                newClass = `${newClass} line-height-${size}`.trim();
            }
            
            newClass = newClass.trim();
            
            editor.commands.updateAttributes('page', { class: newClass });
        }
    });
}

export const useFormattingActions = (editor: Editor | null) => {
    return {
        applyParagraphSpacing: (size: ParagraphSpacingSize | null) => 
            applyParagraphSpacing(editor, size),
        changeIndent: (delta: number) => 
            changeIndent(editor, delta),
        toggleHangingIndent: (enabled: boolean) => 
            toggleHangingIndent(editor, enabled),
        hasHangingIndent: () => 
            hasHangingIndent(editor),
        canHangingIndent: () => 
            canHangingIndent(editor),
        applyLineHeight: (size: LineHeightSize | null) => 
            applyLineHeight(editor, size),
    };
};
