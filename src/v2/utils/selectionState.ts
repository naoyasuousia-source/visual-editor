import { Editor } from '@tiptap/react';

/**
 * Selection state structure
 * Based on v1's selection.ts for cross-paragraph selection tracking
 */
export interface SelectionState {
    startBlockId: string;
    endBlockId: string;
    startOffset: number;
    endOffset: number;
}

interface ParagraphPosition {
    block: Element;
    id: string;
    offset: number;
}

interface TextPosition {
    node: Node;
    offset: number;
}

/**
 * Finds the closest paragraph or heading element for a given node
 * @param node - The starting node
 * @param editor - The Tiptap editor instance (for boundary checking)
 * @returns The paragraph element or null
 */
export function findParagraph(node: Node | null, editorElement: HTMLElement | null): Element | null {
    let current = node;
    
    while (current && current !== editorElement && current !== document.body) {
        if (
            current.nodeType === Node.ELEMENT_NODE &&
            /^(p|h[1-6])$/i.test((current as Element).tagName)
        ) {
            return current as Element;
        }
        current = current.parentNode;
    }
    return null;
}

/**
 * Calculate text offset within a paragraph
 * @param block - The paragraph element
 * @param targetNode - The target text node
 * @param targetOffset - Offset within the target node
 * @returns Total character offset from paragraph start
 */
function calculateOffsetWithinNode(block: Element, targetNode: Node, targetOffset: number): number | null {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
    let node = walker.nextNode();
    let offset = 0;
    
    while (node) {
        if (node === targetNode) {
            return offset + targetOffset;
        }
        offset += node.textContent?.length ?? 0;
        node = walker.nextNode();
    }
    
    return null;
}

/**
 * Find text position in paragraph by character offset
 * @param block - The paragraph element
 * @param targetOffset - Character offset from paragraph start
 * @returns Text node and offset within that node
 */
function findTextPositionInParagraph(block: Element | null, targetOffset: number): TextPosition | null {
    if (!block) return null;
    
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
    let node = walker.nextNode();
    let remaining = Math.max(0, targetOffset);
    
    while (node) {
        const length = node.textContent?.length ?? 0;
        if (remaining <= length) {
            return { node, offset: remaining };
        }
        remaining -= length;
        node = walker.nextNode();
    }
    
    // Fallback to end of block
    const fallbackOffset = Math.min(Math.max(remaining, 0), block.childNodes.length);
    return { node: block, offset: fallbackOffset };
}

/**
 * Compare paragraph order in document
 * @returns Negative if p1 comes before p2, positive if after, 0 if same
 */
function compareParagraphOrder(p1: Element, p2: Element): number {
    if (p1 === p2) return 0;
    const position = p1.compareDocumentPosition(p2);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
}

/**
 * Compute selection state from a Range
 * Preserves selection across DOM mutations by storing paragraph IDs and offsets
 * 
 * @param range - The current selection range
 * @param editorElement - The editor container element
 * @returns SelectionState or null if invalid
 */
export function computeSelectionStateFromRange(
    range: Range | null, 
    editorElement: HTMLElement | null
): SelectionState | null {
    if (!range || !editorElement) return null;
    
    const startParagraph = findParagraph(range.startContainer, editorElement);
    const endParagraph = findParagraph(range.endContainer, editorElement);
    
    if (!startParagraph || !endParagraph) return null;
    
    const startId = startParagraph.id;
    const endId = endParagraph.id;
    
    if (!startId || !endId) return null;
    
    const startOffset = calculateOffsetWithinNode(startParagraph, range.startContainer, range.startOffset);
    const endOffset = calculateOffsetWithinNode(endParagraph, range.endContainer, range.endOffset);
    
    if (startOffset == null || endOffset == null) return null;
    
    let startState: ParagraphPosition = {
        block: startParagraph,
        id: startId,
        offset: startOffset
    };
    let endState: ParagraphPosition = {
        block: endParagraph,
        id: endId,
        offset: endOffset
    };
    
    // Normalize order
    const order = compareParagraphOrder(startParagraph, endParagraph);
    if (order > 0 || (order === 0 && startOffset > endOffset)) {
        [startState, endState] = [endState, startState];
    }
    
    return {
        startBlockId: startState.id,
        endBlockId: endState.id,
        startOffset: startState.offset,
        endOffset: endState.offset
    };
}

/**
 * Restore Range from saved SelectionState
 * 
 * @param state - The saved selection state
 * @returns Restored Range or null if restoration failed
 */
export function restoreRangeFromSelectionState(state: SelectionState | null): Range | null {
    if (!state) return null;
    
    const startBlock = document.getElementById(state.startBlockId);
    const endBlock = document.getElementById(state.endBlockId);
    
    if (!startBlock || !endBlock) return null;
    
    const startPosition = findTextPositionInParagraph(startBlock, state.startOffset);
    const endPosition = findTextPositionInParagraph(endBlock, state.endOffset);
    
    if (!startPosition || !endPosition) return null;
    
    const range = document.createRange();
    range.setStart(startPosition.node, startPosition.offset);
    range.setEnd(endPosition.node, endPosition.offset);
    
    return range;
}

/**
 * Place caret before an element
 * @param node - The element to place caret before
 */
export function placeCaretBefore(node: Element | null): void {
    if (!node) return;
    
    const range = document.createRange();
    range.setStartBefore(node);
    range.collapse(true);
    
    const selection = window.getSelection();
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * Place caret after an element
 * @param node - The element to place caret after
 */
export function placeCaretAfter(node: Element | null): void {
    if (!node) return;
    
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    
    const selection = window.getSelection();
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

/**
 * Check if range is inside the editor element
 * @param range - The range to check
 * @param editorElement - The editor container
 * @returns True if range is inside editor
 */
export function isRangeInsideEditor(
    range: Range | null | undefined, 
    editorElement: HTMLElement | null
): boolean {
    return !!(editorElement && range && editorElement.contains(range.commonAncestorContainer));
}

// Module-level storage for last valid selection
let lastSelectionState: SelectionState | null = null;

/**
 * Save current text selection from editor
 * @param editorElement - The editor container
 */
export function saveTextSelectionFromEditor(editorElement: HTMLElement | null): void {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    if (!isRangeInsideEditor(range, editorElement)) return;
    
    const state = computeSelectionStateFromRange(range, editorElement);
    if (state) {
        lastSelectionState = state;
    }
}

/**
 * Get effective text range (current or last saved)
 * Useful for formatting operations when selection may have been lost
 * 
 * @param editorElement - The editor container
 * @returns Effective Range or null
 */
export function getEffectiveTextRange(editorElement: HTMLElement | null): Range | null {
    const selection = window.getSelection();
    
    if (selection && selection.rangeCount) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed && isRangeInsideEditor(range, editorElement)) {
            const state = computeSelectionStateFromRange(range, editorElement);
            if (state) {
                lastSelectionState = state;
            }
            return range.cloneRange();
        }
    }
    
    // Try to restore last selection
    if (lastSelectionState) {
        const restored = restoreRangeFromSelectionState(lastSelectionState);
        if (restored && isRangeInsideEditor(restored, editorElement)) {
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(restored);
            }
            return restored.cloneRange();
        }
        return restoreRangeFromSelectionState(lastSelectionState);
    }
    
    return null;
}
