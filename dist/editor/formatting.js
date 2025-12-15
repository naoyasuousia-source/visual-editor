import { computeSelectionStateFromRange, restoreRangeFromSelectionState } from './selection.js';
import { convertParagraphToTag, unwrapColorSpan, removeColorSpansInNode } from '../utils/dom.js';
// We rely on window.* extension methods for some core side-effects for now
// to maintain compatibility with the monolithic main.ts behavior during refactoring.
// Import globally available element getter
import { getPagesContainerElement } from '../globals.js';
import { rebuildFigureMetaStore } from './image.js';
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
        // --- 修正: 段落が消失してしまった場合のリカバリ ---
        // 何も入力がない、あるいはすべて消してしまった場合にも、最低1つのPタグを保証する
        // バックスペース連打で最後の1行のタグまで消えると、以後入力できなくなるのを防ぐ
        if (!inner.querySelector('p, h1, h2, h3, h4, h5, h6')) {
            const p = document.createElement('p');
            p.innerHTML = '<br>'; // カーソルが入れるようにBRを入れる
            inner.appendChild(p);
        }
        // ------------------------------------------------
        let paraIndex = 1;
        // p と h1〜h6 のみ対象
        inner.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(block => {
            const el = block;
            // 過去バージョンの para-num/para-body を除去
            el.querySelectorAll('.para-num').forEach(span => span.remove());
            el.querySelectorAll('.para-body').forEach(body => {
                while (body.firstChild) {
                    el.insertBefore(body.firstChild, body);
                }
                body.remove();
            });
            // id と data-para を付与
            el.dataset.para = String(paraIndex);
            el.id = `p${pageNum}-${paraIndex}`;
            // block.dataset.blockStyle が設定済みならそれを尊重し、
            // 未設定の場合は mini-text span の有無で判断
            if (!el.dataset.blockStyle) {
                const hasMiniTextSpan = el.querySelector(':scope > .mini-text');
                el.dataset.blockStyle = hasMiniTextSpan ? 'mini-p' : el.tagName.toLowerCase();
            }
            paraIndex++;
        });
    });
    rebuildFigureMetaStore();
    window.syncToSource?.();
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
function getCurrentParagraph() {
    return window.getCurrentParagraph?.() || null;
}
export function toggleBold() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand('bold', false, undefined);
    normalizeInlineFormatting();
    window.syncToSource();
}
export function toggleItalic() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand('italic', false, undefined);
    normalizeInlineFormatting();
    window.syncToSource();
}
export function toggleUnderline() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand('underline', false, undefined);
    normalizeInlineFormatting();
    window.syncToSource();
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
    window.syncToSource();
}
export function applyInlineScript(command) {
    if (!command)
        return;
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand(command, false, undefined);
    window.syncToSource();
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
        window.renumberParagraphs?.();
        if (savedState) {
            const restored = restoreRangeFromSelectionState(savedState);
            if (restored && selection) {
                selection.removeAllRanges();
                selection.addRange(restored);
            }
        }
        window.syncToSource();
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
    window.syncToSource();
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
    window.syncToSource();
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
    selection.addRange(normalized);
    window.syncToSource();
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
        window.syncToSource();
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
    window.syncToSource();
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
