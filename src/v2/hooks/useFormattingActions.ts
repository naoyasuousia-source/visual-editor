import { Editor } from '@tiptap/react';
import { getEffectiveTextRange } from '@/utils/selectionState';

/**
 * Formatting Actions Hook
 * 
 * Based on v1's formatting.ts, provides advanced formatting operations
 * that go beyond Tiptap's built-in commands.
 */

const PARAGRAPH_SPACING_SIZES = ['xs', 's', 'm', 'l', 'xl'] as const;
const LINE_HEIGHT_SIZES = ['s', 'm', 'l'] as const;

type ParagraphSpacingSize = typeof PARAGRAPH_SPACING_SIZES[number];
type LineHeightSize = typeof LINE_HEIGHT_SIZES[number];

/**
 * Get paragraphs intersecting with current selection
 */
function getParagraphsInRange(editor: Editor | null): HTMLElement[] {
    if (!editor) return [];
    
    const editorElement = editor.view.dom as HTMLElement;
    const selection = window.getSelection();
    
    if (!selection || !selection.rangeCount) return [];
    
    const range = selection.getRangeAt(0);
    
    // If collapsed, get current paragraph only
    if (range.collapsed) {
        let node = selection.anchorNode;
        while (node && node !== editorElement) {
            if (node.nodeType === Node.ELEMENT_NODE && 
                /^(p|h[1-6])$/i.test((node as Element).tagName)) {
                return [node as HTMLElement];
            }
            node = node.parentNode;
        }
        return [];
    }
    
    // Get all paragraphs intersecting the range
    const selector = 'p, h1, h2, h3, h4, h5, h6';
    const allParagraphs = Array.from(editorElement.querySelectorAll<HTMLElement>(selector));
    
    return allParagraphs.filter(p => range.intersectsNode(p));
}

/**
 * Apply paragraph spacing (間隔調整)
 * Based on v1's applyParagraphSpacing function
 */
export function applyParagraphSpacing(
    editor: Editor | null, 
    size: ParagraphSpacingSize | null
): void {
    if (!editor || !size || !PARAGRAPH_SPACING_SIZES.includes(size)) return;
    
    const paragraphs = getParagraphsInRange(editor);
    if (paragraphs.length === 0) return;
    
    paragraphs.forEach(paragraph => {
        // Remove all existing spacing classes
        PARAGRAPH_SPACING_SIZES.forEach(sz => {
            paragraph.classList.remove(`inline-spacing-${sz}`);
        });
        
        // Apply new spacing (except 's' which is default)
        if (size !== 's') {
            paragraph.classList.add(`inline-spacing-${size}`);
        }
    });
}

/**
 * Get current indent level from paragraph
 */
function getIndentLevel(paragraph: HTMLElement): number {
    const match = paragraph.className.match(/indent-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

/**
 * Change indent level (インデント増減)
 * Based on v1's changeIndent function
 * 
 * @param editor - Tiptap editor instance
 * @param delta - +1 to indent, -1 to outdent
 */
export function changeIndent(editor: Editor | null, delta: number): void {
    if (!editor) return;
    
    const paragraphs = getParagraphsInRange(editor);
    if (paragraphs.length === 0) return;
    
    paragraphs.forEach(paragraph => {
        const currentLevel = getIndentLevel(paragraph);
        const newLevel = Math.max(0, Math.min(5, currentLevel + delta));
        
        // Remove old indent class
        paragraph.className = paragraph.className.replace(/indent-\d+/, '').trim();
        
        // Add new indent class
        if (newLevel > 0) {
            paragraph.classList.add(`indent-${newLevel}`);
        }
    });
}

/**
 * Toggle hanging indent (ぶら下げインデント)
 * Based on v1's toggleHangingIndent function
 * 
 * Only applicable when paragraph has indent > 0
 */
export function toggleHangingIndent(editor: Editor | null, enabled: boolean): void {
    if (!editor) return;
    
    const paragraphs = getParagraphsInRange(editor);
    if (paragraphs.length === 0) return;
    
    paragraphs.forEach(paragraph => {
        const indentLevel = getIndentLevel(paragraph);
        
        // Hanging indent only makes sense with indent > 0
        if (indentLevel > 0) {
            if (enabled) {
                paragraph.classList.add('hanging-indent');
            } else {
                paragraph.classList.remove('hanging-indent');
            }
        }
    });
}

/**
 * Check if current paragraph has hanging indent enabled
 */
export function hasHangingIndent(editor: Editor | null): boolean {
    if (!editor) return false;
    
    const paragraphs = getParagraphsInRange(editor);
    if (paragraphs.length === 0) return false;
    
    return paragraphs[0].classList.contains('hanging-indent');
}

/**
 * Check if hanging indent control should be enabled
 * (i.e., if current paragraph has indent > 0)
 */
export function canHangingIndent(editor: Editor | null): boolean {
    if (!editor) return false;
    
    const paragraphs = getParagraphsInRange(editor);
    if (paragraphs.length === 0) return false;
    
    return getIndentLevel(paragraphs[0]) > 0;
}

/**
 * Apply line height to all pages
 * Based on v1's applyLineHeight function
 */
export function applyLineHeight(
    editor: Editor | null, 
    size: LineHeightSize | null
): void {
    if (!editor || !size || !LINE_HEIGHT_SIZES.includes(size)) return;
    
    const editorElement = editor.view.dom as HTMLElement;
    const inners = editorElement.querySelectorAll<HTMLElement>('.page-inner');
    
    inners.forEach(inner => {
        // Remove all existing line-height classes
        LINE_HEIGHT_SIZES.forEach(sz => {
            inner.classList.remove(`line-height-${sz}`);
        });
        
        // Apply new line-height (except 'm' which is default)
        if (size !== 'm') {
            inner.classList.add(`line-height-${size}`);
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
