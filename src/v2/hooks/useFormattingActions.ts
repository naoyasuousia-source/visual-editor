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
export function applyParagraphSpacing(
    editor: Editor | null, 
    size: ParagraphSpacingSize | null
): void {
    if (!editor || !size || !PARAGRAPH_SPACING_SIZES.includes(size)) return;
    
    const { state } = editor;
    const { from, to } = state.selection;
    
    // Find all paragraph/heading nodes in selection
    state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            const currentClass = node.attrs.class || '';
            
            // Remove all spacing classes
            let newClass = currentClass;
            PARAGRAPH_SPACING_SIZES.forEach(sz => {
                newClass = newClass.replace(new RegExp(`\\s*inline-spacing-${sz}\\s*`, 'g'), ' ');
            });
            
            // Add new spacing (except 's' which is default)
            if (size !== 's') {
                newClass = `${newClass} inline-spacing-${size}`.trim();
            }
            
            newClass = newClass.trim();
            
            // Update via Tiptap transaction
            editor.commands.updateAttributes(node.type.name, { class: newClass });
        }
    });
}

/**
 * Get current indent level from node attributes
 */
function getIndentLevel(className: string): number {
    const match = className?.match(/indent-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Change indent level using Tiptap commands
 */
export function changeIndent(editor: Editor | null, delta: number): void {
    if (!editor) return;
    
    const { state } = editor;
    const { from, to } = state.selection;
    
    state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            const currentClass = node.attrs.class || '';
            const currentLevel = getIndentLevel(currentClass);
            const newLevel = Math.max(0, Math.min(5, currentLevel + delta));
            
            // Remove old indent class
            let newClass = currentClass.replace(/indent-\d+/, '').trim();
            
            // Add new indent class
            if (newLevel > 0) {
                newClass = `${newClass} indent-${newLevel}`.trim();
            }
            
            editor.commands.updateAttributes(node.type.name, { class: newClass });
        }
    });
}

/**
 * Toggle hanging indent using Tiptap commands
 */
export function toggleHangingIndent(editor: Editor | null, enabled: boolean): void {
    if (!editor) return;
    
    const { state } = editor;
    const { from, to } = state.selection;
    
    state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'paragraph' || node.type.name === 'heading') {
            const currentClass = node.attrs.class || '';
            const indentLevel = getIndentLevel(currentClass);
            
            // Hanging indent only makes sense with indent > 0
            if (indentLevel > 0) {
                let newClass = currentClass.replace(/\s*hanging-indent\s*/g, ' ').trim();
                
                if (enabled) {
                    newClass = `${newClass} hanging-indent`.trim();
                }
                
                editor.commands.updateAttributes(node.type.name, { class: newClass });
            }
        }
    });
}

/**
 * Check if current paragraph has hanging indent enabled
 */
export function hasHangingIndent(editor: Editor | null): boolean {
    if (!editor) return false;
    
    const { state } = editor;
    const { $from } = state.selection;
    const node = $from.parent;
    
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        const className = node.attrs.class || '';
        return className.includes('hanging-indent');
    }
    
    return false;
}

/**
 * Check if hanging indent control should be enabled
 */
export function canHangingIndent(editor: Editor | null): boolean {
    if (!editor) return false;
    
    const { state } = editor;
    const { $from } = state.selection;
    const node = $from.parent;
    
    if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        const className = node.attrs.class || '';
        return getIndentLevel(className) > 0;
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
