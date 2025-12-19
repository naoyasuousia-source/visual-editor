import { computeSelectionStateFromRange, restoreRangeFromSelectionState } from './selection.js';
import { convertParagraphToTag, unwrapColorSpan, removeColorSpansInNode, findParagraphWrapper, ensureParagraphWrapper } from '../utils/dom.js';
import { getCurrentParagraph } from './core.js';
import { updateToolbarState } from '../ui/toolbar.js';
// We rely on window.* extension methods for some core side-effects for now
// to maintain compatibility with the monolithic main.ts behavior during refactoring.
// Import globally available element getter
import { getPagesContainerElement } from '../globals.js';
import { rebuildFigureMetaStore } from './image.js';
import { updateAiMetaGuide } from './ai-meta.js';
export function renumberParagraphs() {
    const pagesContainer = getPagesContainerElement();
    if (!pagesContainer)
        return;
    const pages = pagesContainer.querySelectorAll('section.page');
    pages.forEach(page => {
        let pageNum = page.getAttribute('data-page');
        if (!pageNum) {
            pageNum = '1';
        }
        const inner = page.querySelector('.page-inner');
        if (!inner)
            return;
        if (!inner.querySelector('p, h1, h2, h3, h4, h5, h6')) {
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            inner.appendChild(p);
        }
        let paraIndex = 1;
        inner.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(block => {
            const el = block;
            el.querySelectorAll('.para-num').forEach(span => span.remove());
            el.querySelectorAll('.para-body').forEach(body => {
                while (body.firstChild) {
                    el.insertBefore(body.firstChild, body);
                }
                body.remove();
            });
            el.dataset.para = String(paraIndex);
            el.id = `p${pageNum}-${paraIndex}`;
            if (!el.dataset.blockStyle) {
                el.dataset.blockStyle = el.tagName.toLowerCase();
            }
            paraIndex++;
        });
    });
    rebuildFigureMetaStore();
    updateAiMetaGuide();
}
export function normalizeInlineFormatting() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    replaceInlineTag(currentEditor, 'strong', 'b');
    replaceInlineTag(currentEditor, 'em', 'i');
    replaceInlineTag(currentEditor, 'strike', 's');
    replaceInlineTag(currentEditor, 'del', 's');
}
function replaceInlineTag(currentEditor, from, to) {
    const nodes = currentEditor.querySelectorAll(from);
    nodes.forEach(node => {
        const replacement = document.createElement(to);
        Array.from(node.attributes).forEach(attr => {
            replacement.setAttribute(attr.name, attr.value);
        });
        while (node.firstChild) {
            replacement.appendChild(node.firstChild);
        }
        const parent = node.parentNode;
        if (!parent)
            return;
        parent.replaceChild(replacement, node);
    });
}
export function toggleBold() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand('bold', false, undefined);
    normalizeInlineFormatting();
}
export function toggleItalic() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand('italic', false, undefined);
    normalizeInlineFormatting();
}
export function toggleUnderline() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand('underline', false, undefined);
    normalizeInlineFormatting();
}
export function toggleStrikeThrough() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    // 1. 選択範囲を保存
    const selection = window.getSelection();
    let savedState = null;
    if (selection && selection.rangeCount > 0) {
        savedState = computeSelectionStateFromRange(selection.getRangeAt(0));
    }
    currentEditor.focus();
    document.execCommand('strikeThrough', false, undefined);
    // 2. タグ正規化（これがDOMを置換して選択を壊す原因）
    normalizeInlineFormatting();
    // 3. 選択範囲を復元
    if (savedState) {
        const restored = restoreRangeFromSelectionState(savedState);
        if (restored && selection) {
            selection.removeAllRanges();
            selection.addRange(restored);
        }
    }
}
export function applyInlineScript(command) {
    if (!command)
        return;
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand(command, false, undefined);
}
export function applyBlockElement(tag) {
    if (!tag)
        return;
    const current = getCurrentParagraph();
    if (current) {
        const selection = window.getSelection();
        let savedState = null;
        if (selection && selection.rangeCount > 0) {
            savedState = computeSelectionStateFromRange(selection.getRangeAt(0));
        }
        convertParagraphToTag(current, tag);
        renumberParagraphs();
        if (savedState) {
            const restored = restoreRangeFromSelectionState(savedState);
            if (restored && selection) {
                selection.removeAllRanges();
                selection.addRange(restored);
            }
        }
    }
}
export function toggleSuperscript() {
    applyInlineScript('superscript');
}
export function toggleSubscript() {
    applyInlineScript('subscript');
}
export function applyColorHighlight(color) {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    if (!currentEditor.contains(range.commonAncestorContainer))
        return;
    const fragment = range.extractContents();
    removeColorSpansInNode(fragment);
    let nodeToInsert = fragment;
    let newSpan = null;
    if (color) {
        newSpan = document.createElement('span');
        newSpan.className = 'inline-highlight';
        newSpan.style.backgroundColor = color;
        newSpan.appendChild(fragment);
        nodeToInsert = newSpan;
    }
    range.insertNode(nodeToInsert);
    selection.removeAllRanges();
    const newRange = document.createRange();
    if (newSpan) {
        newRange.selectNode(newSpan);
    }
    else {
        newRange.setStartAfter(nodeToInsert);
        newRange.collapse(true);
    }
    selection.addRange(newRange);
    currentEditor.focus();
}
export function applyFontColor(color) {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    if (!currentEditor.contains(range.commonAncestorContainer))
        return;
    const fragment = range.extractContents();
    removeColorSpansInNode(fragment);
    let nodeToInsert = fragment;
    let newSpan = null;
    if (color) {
        newSpan = document.createElement('span');
        newSpan.className = 'inline-color';
        newSpan.style.color = color;
        newSpan.appendChild(fragment);
        nodeToInsert = newSpan;
    }
    range.insertNode(nodeToInsert);
    selection.removeAllRanges();
    const newRange = document.createRange();
    if (newSpan) {
        newRange.selectNode(newSpan);
    }
    else {
        newRange.setStartAfter(nodeToInsert);
        newRange.collapse(true);
    }
    selection.addRange(newRange);
    currentEditor.focus();
}
export function resetFontColorInSelection() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    if (!currentEditor.contains(range.commonAncestorContainer))
        return;
    const spans = Array.from(currentEditor.querySelectorAll('.inline-color'));
    let removed = false;
    spans.forEach(span => {
        if (range.intersectsNode(span)) {
            unwrapColorSpan(span);
            removed = true;
        }
    });
    if (!removed)
        return;
    const normalized = range.cloneRange();
    selection.removeAllRanges();
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(normalized);
}
export function removeHighlightsInRange(range) {
    if (!range)
        return false;
    // 1. 範囲がハイライト要素の内側にある場合、親を分割して「裸」にする必要がある
    const ancestor = getAncestorHighlight(range.commonAncestorContainer);
    if (ancestor) {
        // 親がいる場合は親を剥がす
        unwrapColorSpan(ancestor);
        // unwrapするとDOM構造が変わるので、rangeの再取得が必要になるケースがあるが、
        // ここでは単純に「解除した」としてtrueを返す
        // (完全に正確な範囲復元は複雑だが、今回の要件では「掃除」ができればよい)
        return true;
    }
    // 2. 範囲内のハイライト要素を除去
    const clone = range.cloneContents();
    const spans = clone.querySelectorAll('.inline-highlight, .inline-color, span[style*="background-color"], span[style*="color"]');
    if (spans.length > 0) {
        const fragment = range.extractContents();
        removeColorSpansInNode(fragment); // Use the new helper
        range.insertNode(fragment);
        return true;
    }
    return false;
}
export function resetHighlightsInSelection() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    // 1. Ancestor check
    // We need getAncestorHighlight logic here. 
    // Since it's internal in main.ts, we should have moved it to utils/dom? 
    // It depends on currentEditor. We can implement a DOM util that takes a boundary.
    const ancestor = getAncestorHighlight(range.commonAncestorContainer);
    if (ancestor) {
        const first = ancestor.firstChild;
        const last = ancestor.lastChild;
        unwrapColorSpan(ancestor);
        if (first && last) {
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.setStartBefore(first);
            newRange.setEndAfter(last);
            selection.addRange(newRange);
        }
        return;
    }
    const fragment = range.extractContents();
    removeColorSpansInNode(fragment);
    const first = fragment.firstChild;
    const last = fragment.lastChild;
    range.insertNode(fragment);
    if (first && last) {
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartBefore(first);
        newRange.setEndAfter(last);
        selection.addRange(newRange);
    }
}
// Local helper mimicking main.ts logic
function getAncestorHighlight(node) {
    let curr = node;
    const editor = window.currentEditor;
    while (curr && curr !== editor && curr !== document.body) {
        if (curr.nodeType === Node.ELEMENT_NODE) {
            const el = curr;
            if (el.classList.contains('inline-highlight') ||
                el.classList.contains('inline-color') ||
                el.style.backgroundColor ||
                el.style.color) {
                return el;
            }
        }
        curr = curr.parentNode;
    }
    return null;
}
export function applyPendingBlockTag(inner) {
    const pendingTag = inner.dataset.pendingBlockTag || inner.dataset.preferredBlockTag || 'p';
    if (!pendingTag)
        return;
    const current = getCurrentParagraph();
    if (!current)
        return;
    convertParagraphToTag(current, pendingTag);
    inner.dataset.pendingBlockTag = '';
}
// --- Moved from main.ts ---
const alignDirections = ['left', 'center', 'right'];
const paragraphSpacingSizes = ['xs', 's', 'm', 'l', 'xl'];
const lineHeightSizes = ['s', 'm', 'l'];
export function toggleHangingIndent(shouldHang) {
    const current = getCurrentParagraph();
    if (!current)
        return;
    if (shouldHang) {
        current.classList.add('hanging-indent');
    }
    else {
        current.classList.remove('hanging-indent');
    }
    updateToolbarState();
}
export function changeIndent(delta) {
    const current = getCurrentParagraph();
    if (!current)
        return;
    const m = current.className.match(/indent-(\d+)/);
    let level = m ? parseInt(m[1], 10) : 0;
    level = Math.max(0, Math.min(5, level + delta));
    current.className = current.className.replace(/indent-\d+/, '').trim();
    if (level > 0)
        current.classList.add(`indent-${level}`);
    updateToolbarState();
}
export function applyParagraphAlignment(direction) {
    if (!direction)
        return;
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    // if (range.collapsed) return; // Allow collapsed range
    if (!currentEditor.contains(range.commonAncestorContainer))
        return;
    // カーソル位置のみの場合でも、現在の段落を取得して適用する
    let paragraphs = [];
    if (range.collapsed) {
        const p = getCurrentParagraph();
        if (p)
            paragraphs.push(p);
    }
    else {
        const selectors = 'p, h1, h2, h3, h4, h5, h6';
        paragraphs = Array.from(currentEditor.querySelectorAll(selectors)).filter(paragraph => {
            return range.intersectsNode(paragraph);
        });
    }
    if (!paragraphs.length)
        return;
    paragraphs.forEach(paragraph => {
        const wrapper = ensureParagraphWrapper(paragraph);
        if (!wrapper)
            return;
        alignDirections.forEach(dir => {
            wrapper.classList.remove(`inline-align-${dir}`);
        });
        if (wrapper.classList.contains('figure-inline')) {
            wrapper.classList.add('inline-align-center');
        }
        else {
            wrapper.classList.add(`inline-align-${direction}`);
        }
    });
    // 選択範囲の復元
    if (selection && paragraphs.length > 0) {
        const first = paragraphs[0];
        const last = paragraphs[paragraphs.length - 1];
        const firstTarget = findParagraphWrapper(first) || first;
        const lastTarget = findParagraphWrapper(last) || last;
        const newRange = document.createRange();
        newRange.setStart(firstTarget, 0);
        if (lastTarget.lastChild) {
            newRange.setEndAfter(lastTarget.lastChild);
        }
        else {
            newRange.setEnd(lastTarget, lastTarget.childNodes.length);
        }
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
}
export function getParagraphsInRange(range) {
    const currentEditor = window.currentEditor;
    if (!currentEditor || !range)
        return [];
    const selectors = 'p, h1, h2, h3, h4, h5, h6';
    return Array.from(currentEditor.querySelectorAll(selectors)).filter(paragraph => {
        return range.intersectsNode(paragraph);
    });
}
function clearParagraphSpacingClasses(target) {
    if (!target)
        return;
    paragraphSpacingSizes.forEach(sz => {
        target.classList.remove(`inline-spacing-${sz}`);
    });
}
export function applyParagraphSpacing(size) {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    if (!size || !paragraphSpacingSizes.includes(size))
        return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    if (!currentEditor.contains(range.commonAncestorContainer))
        return;
    const paragraphs = getParagraphsInRange(range);
    if (!paragraphs.length)
        return;
    paragraphs.forEach(paragraph => {
        const wrapper = ensureParagraphWrapper(paragraph);
        clearParagraphSpacingClasses(paragraph);
        clearParagraphSpacingClasses(wrapper);
        if (size !== 's') {
            paragraph.classList.add(`inline-spacing-${size}`);
            if (wrapper)
                wrapper.classList.add(`inline-spacing-${size}`);
        }
    });
}
export function applyLineHeight(size) {
    const pagesContainerElement = getPagesContainerElement();
    if (!size || !lineHeightSizes.includes(size) || !pagesContainerElement)
        return;
    const inners = pagesContainerElement.querySelectorAll('.page-inner');
    inners.forEach(inner => {
        lineHeightSizes.forEach(sz => inner.classList.remove(`line-height-${sz}`));
        if (size !== 'm') {
            inner.classList.add(`line-height-${size}`);
        }
    });
}
