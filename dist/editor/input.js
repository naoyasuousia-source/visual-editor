import { syncToSource } from '../main.js';
const INDENT_STEP_PX = 36 * (96 / 72);
export function getCaretOffset(range) {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return 0;
    const rects = range.getClientRects();
    const editorRect = currentEditor.getBoundingClientRect();
    const rect = rects.length ? rects[0] : range.getBoundingClientRect();
    if (!rect || (rect.left === 0 && rect.width === 0 && rect.height === 0)) {
        return 0;
    }
    const offset = rect.left - editorRect.left + currentEditor.scrollLeft;
    if (!Number.isFinite(offset))
        return 0;
    return Math.max(0, offset);
}
export function insertInlineTabAt(range, width) {
    if (!width || width <= 0)
        return false;
    const span = document.createElement('span');
    span.className = 'inline-tab';
    span.setAttribute('aria-hidden', 'true');
    span.style.width = `${width}px`;
    const insertionRange = range.cloneRange();
    insertionRange.collapse(true);
    insertionRange.insertNode(span);
    const newRange = document.createRange();
    newRange.setStartAfter(span);
    newRange.collapse(true);
    const selection = window.getSelection();
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
    return true;
}
export function handleInlineTabKey() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return false;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return false;
    const range = selection.getRangeAt(0);
    if (!currentEditor.contains(range.commonAncestorContainer))
        return false;
    if (!range.collapsed) {
        range.collapse(false);
    }
    const step = INDENT_STEP_PX;
    const caretX = getCaretOffset(range);
    const currentStep = Math.floor(caretX / step);
    const target = (currentStep + 1) * step;
    let delta = target - caretX;
    if (delta < 0.5) {
        delta = step;
    }
    if (delta <= 0)
        return false;
    const inserted = insertInlineTabAt(range, delta);
    if (inserted) {
        syncToSource();
    }
    return inserted;
}
function getInlineTabNodeBefore(range) {
    let container = range.startContainer;
    let offset = range.startOffset;
    if (container && container.nodeType === Node.TEXT_NODE) {
        if (offset > 0)
            return null;
        container = container.previousSibling;
    }
    else if (container) {
        if (offset > 0) {
            container = container.childNodes[offset - 1];
        }
        else {
            container = container.previousSibling;
        }
    }
    if (container &&
        container.nodeType === 1 &&
        container.classList &&
        container.classList.contains('inline-tab')) {
        return container;
    }
    return null;
}
export function handleInlineTabBackspace() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return false;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return false;
    const range = selection.getRangeAt(0);
    if (!currentEditor.contains(range.commonAncestorContainer))
        return false;
    if (!range.collapsed)
        return false;
    const inlineTab = getInlineTabNodeBefore(range);
    if (!inlineTab)
        return false;
    const newRange = document.createRange();
    newRange.setStartBefore(inlineTab);
    newRange.collapse(true);
    inlineTab.parentNode?.removeChild(inlineTab);
    selection.removeAllRanges();
    selection.addRange(newRange);
    syncToSource();
    return true;
}
