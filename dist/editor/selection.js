import { calculateOffsetWithinNode, compareParagraphOrder } from '../utils/dom.js';
// Note: Using window.currentEditor might be risky if we want pure modules.
// Ideally, pass editor context or use a robust state management.
// For now, we mimic current behavior by accessing window.currentEditor via a helper or direct access if Typescript allows.
// Since we defined Window interface in types.ts, we can cast window.
/**
 * Finds the closest paragraph or heading element for a given node.
 */
export function findParagraph(node) {
    let current = node;
    // We need access to currentEditor to stop traversal
    const currentEditor = window.currentEditor;
    while (current && current !== currentEditor) {
        if (current.nodeType === Node.ELEMENT_NODE &&
            /^(p|h[1-6])$/i.test(current.tagName)) {
            return current;
        }
        current = current.parentNode;
    }
    return null;
}
export function findTextPositionInParagraph(block, targetOffset) {
    if (!block)
        return null;
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
export function computeSelectionStateFromRange(range) {
    if (!range)
        return null;
    const startParagraph = findParagraph(range.startContainer);
    const endParagraph = findParagraph(range.endContainer);
    if (!startParagraph || !endParagraph)
        return null;
    const startId = startParagraph.id;
    const endId = endParagraph.id;
    if (!startId || !endId)
        return null;
    const startOffset = calculateOffsetWithinNode(startParagraph, range.startContainer, range.startOffset);
    const endOffset = calculateOffsetWithinNode(endParagraph, range.endContainer, range.endOffset);
    if (startOffset == null || endOffset == null)
        return null;
    let startState = {
        block: startParagraph,
        id: startId,
        offset: startOffset
    };
    let endState = {
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
export function restoreRangeFromSelectionState(state) {
    if (!state)
        return null;
    const startBlock = document.getElementById(state.startBlockId);
    const endBlock = document.getElementById(state.endBlockId);
    if (!startBlock || !endBlock)
        return null;
    const startPosition = findTextPositionInParagraph(startBlock, state.startOffset);
    const endPosition = findTextPositionInParagraph(endBlock, state.endOffset);
    if (!startPosition || !endPosition)
        return null;
    const range = document.createRange();
    range.setStart(startPosition.node, startPosition.offset);
    range.setEnd(endPosition.node, endPosition.offset);
    return range;
}
