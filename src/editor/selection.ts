import { SelectionState, ParagraphPosition, TextPosition } from '../types.js';
import { calculateOffsetWithinNode, compareParagraphOrder } from '../utils/dom.js';

// Note: Using window.currentEditor might be risky if we want pure modules.
// Ideally, pass editor context or use a robust state management.
// For now, we mimic current behavior by accessing window.currentEditor via a helper or direct access if Typescript allows.
// Since we defined Window interface in types.ts, we can cast window.

/**
 * Finds the closest paragraph or heading element for a given node.
 */
export function findParagraph(node: Node | null): Element | null {
    let current = node;
    // We need access to currentEditor to stop traversal
    const currentEditor = window.currentEditor;

    while (current && current !== currentEditor) {
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

export function findTextPositionInParagraph(block: Element | null, targetOffset: number): TextPosition | null {
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
    const fallbackOffset = Math.min(Math.max(remaining, 0), block.childNodes.length);
    return { node: block, offset: fallbackOffset };
}

export function computeSelectionStateFromRange(range: Range | null): SelectionState | null {
    if (!range) return null;
    const startParagraph = findParagraph(range.startContainer);
    const endParagraph = findParagraph(range.endContainer);
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
    let order = compareParagraphOrder(startParagraph, endParagraph);
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

export function getCurrentParagraph(): Element | null {
    const currentEditor = window.currentEditor;
    if (!currentEditor) return null;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;

    let node = sel.anchorNode;
    if (!currentEditor.contains(node)) return null;

    while (node && !(node.nodeType === 1 && /^(p|h[1-6]|div)$/i.test(node.nodeName))) {
        node = node.parentNode;
    }
    return node as Element;
}

let lastSelectionState: SelectionState | null = null;

export function isRangeInsideCurrentEditor(range: Range | null | undefined): boolean {
    const currentEditor = window.currentEditor;
    return !!(currentEditor && range && currentEditor.contains(range.commonAncestorContainer));
}

export function saveTextSelectionFromEditor(): void {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    if (!isRangeInsideCurrentEditor(range)) return;
    const state = computeSelectionStateFromRange(range);
    if (state) {
        lastSelectionState = state;
    }
}

export function getEffectiveTextRange(): Range | null {
    const selection = window.getSelection();
    if (selection && selection.rangeCount) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed && isRangeInsideCurrentEditor(range)) {
            const state = computeSelectionStateFromRange(range);
            if (state) {
                lastSelectionState = state;
            }
            return range.cloneRange();
        }
    }
    if (lastSelectionState) {
        const restored = restoreRangeFromSelectionState(lastSelectionState);
        if (restored && isRangeInsideCurrentEditor(restored)) {
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
