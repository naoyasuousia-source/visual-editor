import { computeSelectionStateFromRange, restoreRangeFromSelectionState, placeCaretBefore, placeCaretAfter } from './editor/selection.js';
import { toggleBold, toggleItalic, toggleUnderline, toggleStrikeThrough, applyInlineScript, toggleSuperscript, toggleSubscript, applyColorHighlight, applyFontColor, resetFontColorInSelection, resetHighlightsInSelection, removeHighlightsInRange, renumberParagraphs } from './editor/formatting.js';
import { saveFullHTML, openWithFilePicker, overwriteCurrentFile, handleOpenFile, setPagesHTML, importFullHTMLText, buildFullHTML } from './editor/io.js';
import { createPage, renumberPages, addPage, removePage, initPages } from './editor/page.js';
import { ensureAiImageIndex, closeImageContextMenu, promptDropboxImageUrl, promptWebImageUrl, insertImageAtCursor, initImageContextMenuControls } from './editor/image.js';
import { convertParagraphToTag, generateBookmarkId, findParagraphWrapper, ensureParagraphWrapper } from './utils/dom.js';
// Note: Window interface extension is now in types.ts. 
// We don't need to redeclare it here if we include types.ts in compilation, 
// but TS needs to know about it. Since this is an entry point, imports might suffice.
// Phase 1: Core Utilities Implementation
export function setActiveEditor(inner) {
    window.currentEditor = inner;
    document.querySelectorAll('section.page').forEach(p => p.classList.remove('active'));
    if (inner) {
        const page = inner.closest('section.page');
        if (page)
            page.classList.add('active');
    }
}
export function getCurrentParagraph() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return null;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount)
        return null;
    let node = sel.anchorNode;
    if (!currentEditor.contains(node))
        return null;
    while (node && !(node.nodeType === 1 && /^(p|h[1-6]|div)$/i.test(node.nodeName))) {
        node = node.parentNode;
    }
    return node;
}
// Ensure global exposure for index.html compatibility
window.setActiveEditor = setActiveEditor;
window.placeCaretBefore = placeCaretBefore;
window.placeCaretAfter = placeCaretAfter;
window.getCurrentParagraph = getCurrentParagraph;
// 段階的移行のため、ローカル定義の helper を維持しつつ、必要に応じて utils からインポートしたものを使う
// ここではまず、重複している型定義と convertParagraphToTag を削除・インポートに置換
/**
 * 段落要素が空（テキストや<br>以外の要素がない）かどうかを判定します。
 * @param block - 判定対象の要素
 * @returns 空であれば true
 */
let lastSelectionState = null;
const alignDirections = ['left', 'center', 'right'];
const paragraphSpacingSizes = ['xs', 's', 'm', 'l', 'xl'];
const isParagraphSpacingSize = (value) => !!value && paragraphSpacingSizes.includes(value);
export function addLinkDestination() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
        alert('テキストを選択してください。');
        return;
    }
    if (!currentEditor.contains(range.commonAncestorContainer)) {
        alert('編集エリア内のテキストを選択してください。');
        return;
    }
    const span = document.createElement('span');
    span.id = generateBookmarkId();
    try {
        range.surroundContents(span);
    }
    catch (err) {
        console.error('Failed to wrap selection: ', err);
        alert('複雑な選択範囲のため、リンク先を追加できませんでした。段落をまたがない単純なテキストを選択してください。');
        return;
    }
    selection.removeAllRanges();
    window.syncToSource();
}
export function createLink() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
        alert('リンクにしたいテキストを選択してください。');
        return;
    }
    const range = selection.getRangeAt(0);
    const currentEditor = window.currentEditor;
    if (!currentEditor || !currentEditor.contains(range.commonAncestorContainer)) {
        alert('編集エリア内のテキストを選択してください。');
        return;
    }
    const destinations = Array.from(document.querySelectorAll('.page-inner [id^="bm-"]'));
    if (destinations.length === 0) {
        alert('リンク先が登録されていません。');
        return;
    }
    let promptMessage = 'どのリンク先にリンクしますか？番号を入力してください。\n\n';
    const destinationMap = new Map();
    destinations.forEach((dest, index) => {
        const text = dest.textContent?.trim().substring(0, 50) || '(テキストなし)';
        promptMessage += `${index + 1}: ${text}\n`;
        destinationMap.set(String(index + 1), dest.id);
    });
    const choice = window.prompt(promptMessage);
    if (!choice)
        return;
    const destinationId = destinationMap.get(choice.trim());
    if (!destinationId) {
        alert('無効な番号です。');
        return;
    }
    document.execCommand('createLink', false, `#${destinationId}`);
    currentEditor.normalize();
    window.syncToSource();
}
export function removeLink() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const links = Array.from(currentEditor.querySelectorAll('a[href^="#bm-"]'));
    if (links.length === 0) {
        alert('削除できるリンクがありません。');
        return;
    }
    let promptMessage = 'どのリンクを削除しますか？番号を入力してください。\\n\\n';
    const linkMap = new Map();
    links.forEach((link, index) => {
        const text = link.textContent?.trim().substring(0, 50) || '(テキストなし)';
        promptMessage += `${index + 1}: ${text}\\n`;
        linkMap.set(String(index + 1), link);
    });
    const choice = window.prompt(promptMessage);
    if (!choice)
        return;
    const linkToRemove = linkMap.get(choice.trim());
    if (!linkToRemove) {
        alert('無効な番号です。');
        return;
    }
    const parent = linkToRemove.parentNode;
    if (!parent)
        return;
    while (linkToRemove.firstChild) {
        parent.insertBefore(linkToRemove.firstChild, linkToRemove);
    }
    parent.removeChild(linkToRemove);
    parent.normalize();
    window.syncToSource();
}
export function isRangeInsideCurrentEditor(range) {
    const currentEditor = window.currentEditor;
    return !!(currentEditor && range && currentEditor.contains(range.commonAncestorContainer));
}
export function saveTextSelectionFromEditor() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    if (!isRangeInsideCurrentEditor(range))
        return;
    const state = computeSelectionStateFromRange(range);
    if (state) {
        lastSelectionState = state;
    }
}
export function getEffectiveTextRange() {
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
const paraNumberLeft = '6mm';
const pageMarginValues = { s: '12mm', m: '17mm', l: '24mm' };
const rootMarginRule = /:root\s*{[^}]*}/;
const toolbarElement = document.getElementById('toolbar');
const styleTagElement = document.querySelector('style');
const fontChooserElement = document.querySelector('.font-chooser');
const fontChooserTriggerElement = fontChooserElement
    ? (fontChooserElement.querySelector('.font-chooser-trigger') ?? null)
    : null;
const fontSubmenuTriggerElements = fontChooserElement
    ? Array.from(fontChooserElement.querySelectorAll('.font-submenu-trigger'))
    : [];
const paragraphChooserElement = document.querySelector('.paragraph-chooser');
const paragraphTriggerElement = paragraphChooserElement
    ? (paragraphChooserElement.querySelector('.paragraph-trigger') ?? null)
    : null;
const paragraphSubmenuTriggerElements = paragraphChooserElement
    ? Array.from(paragraphChooserElement.querySelectorAll('.paragraph-submenu-trigger'))
    : [];
const highlightControlElement = document.querySelector('.highlight-control');
const highlightButtonElement = highlightControlElement
    ? (highlightControlElement.querySelector('[data-action="highlight"]') ?? null)
    : null;
const getFileDropdownElement = () => document.querySelector('.file-dropdown');
const getNestedDropdownElements = () => document.querySelectorAll('.nested-dropdown');
const INDENT_STEP_PX = 36 * (96 / 72);
let currentPageMarginSize = 'm';
let currentEditorFontFamily = 'inherit';
const pagesContainerElement = document.getElementById('pages-container');
const sourceElement = document.getElementById('source');
const openFileInputElement = document.getElementById('open-file-input');
const imageContextMenuElement = document.getElementById('image-context-menu');
const imageContextDropdownElement = document.querySelector('.image-context-dropdown');
export function updateRootVariables() {
    if (!styleTagElement)
        return;
    const marginValue = pageMarginValues[currentPageMarginSize] || '17mm';
    const formatted = `:root {
      --page-margin: ${marginValue};
      --para-number-left: ${paraNumberLeft};
      --editor-font-family: ${currentEditorFontFamily};
    }`;
    if (rootMarginRule.test(styleTagElement.innerHTML)) {
        styleTagElement.innerHTML = styleTagElement.innerHTML.replace(rootMarginRule, formatted);
    }
    else {
        styleTagElement.innerHTML += '\n' + formatted;
    }
}
export function applyPageMargin(size) {
    if (!pageMarginValues[size])
        return;
    currentPageMarginSize = size;
    updateRootVariables();
    updateMarginButtonState(size);
}
// Deprecated: Internal use only -> updateRootVariables
export function updateMarginRule(value) {
    updateRootVariables();
}
export function applyFontFamily(family) {
    if (!family)
        return;
    currentEditorFontFamily = family;
    updateRootVariables();
}
const imageContextTriggerElement = document.querySelector('.image-context-trigger');
const imageTitleDialogElement = document.getElementById('image-title-dialog');
const imageTitleInputElement = document.getElementById('image-title-input');
const imageTitleFontRadios = imageTitleDialogElement
    ? Array.from(imageTitleDialogElement.querySelectorAll('input[name="image-title-font-size"]'))
    : [];
const imageTitleApplyButtonElement = document.querySelector('[data-action="apply-image-title"]');
const imageTitleCancelButtonElement = document.querySelector('[data-action="cancel-image-title"]');
const imageSizeClasses = ['xs', 's', 'm', 'l', 'xl'];
const isImageSizeClass = (value) => !!value && imageSizeClasses.includes(value);
let contextTargetImage = null;
let aiImageIndex = null;
export function toggleHangingIndent(shouldHang) {
    const p = getCurrentParagraph();
    if (!p)
        return;
    if (shouldHang) {
        p.classList.add('hanging-indent');
    }
    else {
        p.classList.remove('hanging-indent');
    }
    window.syncToSource();
    updateToolbarState();
}
export function changeIndent(delta) {
    const p = getCurrentParagraph();
    if (!p)
        return;
    const m = p.className.match(/indent-(\d+)/);
    let level = m ? parseInt(m[1], 10) : 0;
    level = Math.max(0, Math.min(5, level + delta));
    p.className = p.className.replace(/indent-\d+/, '').trim();
    if (level > 0)
        p.classList.add(`indent-${level}`);
    window.syncToSource();
    updateToolbarState();
}
export function toggleFileDropdown() {
    const element = getFileDropdownElement();
    if (!element)
        return;
    const willOpen = !element.classList.contains('open');
    if (willOpen) {
        closeAllMenus('file');
    }
    element.classList.toggle('open', willOpen);
}
export function closeNestedDropdown() {
    getNestedDropdownElements().forEach(dropdown => {
        dropdown.classList.remove('open');
        const trigger = dropdown.querySelector('.nested-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}
export function closeFileDropdown() {
    const element = getFileDropdownElement();
    if (!element)
        return;
    element.classList.remove('open');
    closeNestedDropdown();
}
function initFileMenuControls() {
    const fileTrigger = document.querySelector('.file-trigger');
    const nestedTriggers = document.querySelectorAll('.nested-trigger');
    if (fileTrigger) {
        fileTrigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFileDropdown();
        });
    }
    nestedTriggers.forEach(trigger => {
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const dropdown = trigger.closest('.nested-dropdown');
            if (!dropdown)
                return;
            const willOpen = !dropdown.classList.contains('open');
            closeNestedDropdown();
            dropdown.classList.toggle('open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });
    });
}
// Phase 2 & 3 Migration: Paragraph Management & Image Insertion & Event Binding
export function bindEditorEvents(inner) {
    if (inner.dataset.bound === '1')
        return;
    inner.dataset.bound = '1';
    if (!inner.dataset.preferredBlockTag) {
        inner.dataset.preferredBlockTag = 'p';
    }
    inner.addEventListener('input', (e) => {
        const inputEvent = e;
        if (inputEvent && inputEvent.inputType === 'insertParagraph') {
            applyPendingBlockTag(inner);
            renumberParagraphs();
        }
        else {
            window.syncToSource();
        }
    });
    // existing definition in index.html used a timeout for updateToolbarState
    // function updateToolbarState() is likely still in index.html (Phase 4 target),
    // but we can try to call it via window if it exists, or migrate it now.
    // For safety in this "Mixed" phase, we will assume it might be on window or we need to migrate it.
    // Let's migrate updateToolbarState briefly here to ensure dependency.
    const updateStateWithDelay = () => setTimeout(updateToolbarState, 50);
    inner.addEventListener('focus', () => {
        setActiveEditor(inner);
        saveTextSelectionFromEditor();
        updateToolbarState();
    });
    inner.addEventListener('mousedown', () => setActiveEditor(inner));
    inner.addEventListener('mouseup', () => {
        saveTextSelectionFromEditor();
        updateStateWithDelay();
    });
    inner.addEventListener('keyup', (e) => {
        saveTextSelectionFromEditor();
        updateStateWithDelay();
    });
    inner.addEventListener('click', updateStateWithDelay);
    // Caret slot logic
    inner.addEventListener('click', (event) => {
        const target = event.target;
        const figureWrapper = target.closest('.figure-inline');
        if (figureWrapper && target.tagName !== 'IMG') {
            event.preventDefault();
            const caretSlot = figureWrapper.querySelector('.caret-slot');
            if (caretSlot) {
                placeCaretBefore(caretSlot);
            }
        }
    }, true); // Use capture phase
    inner.addEventListener('keydown', (e) => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount)
            return;
        const range = selection.getRangeAt(0);
        const isCollapsed = range.collapsed;
        // isCaretBeforeCaretSlotの判定ロジック
        const nodeAfterCaret = isCollapsed ? range.startContainer.childNodes[range.startOffset] : null;
        const isBeforeSlot = nodeAfterCaret && nodeAfterCaret.nodeType === Node.ELEMENT_NODE && nodeAfterCaret.classList.contains('caret-slot');
        if (isBeforeSlot) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const currentParagraph = nodeAfterCaret.closest('p, h1, h2, h3, h4, h5, h6');
                if (currentParagraph && currentParagraph.parentNode) {
                    const newPara = document.createElement('p');
                    newPara.innerHTML = '<br>';
                    currentParagraph.parentNode.insertBefore(newPara, currentParagraph.nextSibling);
                    const newRange = document.createRange();
                    newRange.setStart(newPara, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    renumberParagraphs();
                }
                return;
            }
            else if (e.key === 'Backspace') {
                e.preventDefault();
                const currentParagraph = nodeAfterCaret.closest('p, h1, h2, h3, h4, h5, h6');
                if (currentParagraph) {
                    const prevElement = currentParagraph.previousElementSibling;
                    currentParagraph.remove();
                    if (prevElement) {
                        placeCaretAfter(prevElement);
                    }
                    renumberParagraphs();
                }
                return;
            }
        }
        if (e.key === 'Enter') {
            const current = getCurrentParagraph();
            const candidate = current
                ? (current.dataset.blockStyle || current.tagName.toLowerCase())
                : (inner.dataset.preferredBlockTag || 'p');
            inner.dataset.pendingBlockTag = candidate;
        }
        else if (e.key === 'Tab') {
            e.preventDefault();
            handleInlineTabKey();
        }
        else if (e.key === 'Backspace') {
            // --- 修正: 最後の1段落を消させない処理 ---
            // 現在のページ内のブロック要素（p, h1-h6）を取得
            const blocks = inner.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
            if (blocks.length === 1) {
                const block = blocks[0];
                // カーソルがそのブロックの先頭にあるかどうかを確認
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    // 選択範囲が潰れていて(collapsed)、かつ始点がブロックの先頭(offset 0)の場合
                    // または、ブロックが空の場合
                    if (range.collapsed && range.startOffset === 0) {
                        // さらに厳密に、ブロックが空（またはBRのみ）なら削除禁止
                        // 「テキストの途中でのバックスペース」は許可するが、「段落そのものを消すバックスペース」は禁止する
                        e.preventDefault();
                        return;
                    }
                }
            }
            // ------------------------------------------
            if (handleInlineTabBackspace()) {
                e.preventDefault();
            }
        }
    });
}
// Helper: updateToolbarState (Migrated to support bindEditorEvents)
export function updateToolbarState() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const paragraph = getCurrentParagraph();
    const toolbar = document.getElementById('toolbar');
    if (!toolbar)
        return;
    const hangingIndentCheckbox = toolbar.querySelector('[data-action="hanging-indent"]');
    if (paragraph && hangingIndentCheckbox) {
        const hasIndent = Array.from(paragraph.classList).some(cls => cls.startsWith('indent-'));
        const isHanging = paragraph.classList.contains('hanging-indent');
        if (hasIndent) {
            hangingIndentCheckbox.disabled = false;
            hangingIndentCheckbox.checked = isHanging;
        }
        else {
            hangingIndentCheckbox.disabled = true;
            hangingIndentCheckbox.checked = false;
        }
    }
    else if (hangingIndentCheckbox) {
        hangingIndentCheckbox.disabled = true;
        hangingIndentCheckbox.checked = false;
    }
}
// Helper: applyPendingBlockTag (Migrated since used in bindEditorEvents)
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
// Global Assignments
window.renumberParagraphs = renumberParagraphs;
window.bindEditorEvents = bindEditorEvents;
window.promptDropboxImageUrl = promptDropboxImageUrl;
window.promptWebImageUrl = promptWebImageUrl;
window.insertImageAtCursor = insertImageAtCursor;
window.updateToolbarState = updateToolbarState;
window.applyPendingBlockTag = applyPendingBlockTag;
window.toggleHangingIndent = toggleHangingIndent;
window.toggleHighlightPalette = toggleHighlightPalette;
window.applyColorHighlight = applyColorHighlight;
window.removeHighlightsInRange = removeHighlightsInRange;
window.resetHighlightsInSelection = resetHighlightsInSelection;
window.setHighlightPaletteOpen = setHighlightPaletteOpen;
window.changeIndent = changeIndent;
window.setPagesHTML = setPagesHTML;
// Page functions (Restored)
window.createPage = createPage;
window.renumberPages = renumberPages;
window.addPage = addPage;
window.removePage = removePage;
window.initPages = initPages;
window.importFullHTMLText = importFullHTMLText;
window.handleOpenFile = handleOpenFile;
window.openWithFilePicker = openWithFilePicker;
window.overwriteCurrentFile = overwriteCurrentFile;
window.buildFullHTML = buildFullHTML;
window.saveFullHTML = saveFullHTML;
function initPageLinkHandler() {
    if (!pagesContainerElement)
        return;
    pagesContainerElement.addEventListener('click', (event) => {
        const target = event.target;
        const link = target?.closest('a');
        if (!link || !link.href)
            return;
        if (!target?.closest('[contenteditable="true"]'))
            return;
        event.preventDefault();
        const href = link.getAttribute('href') ?? '';
        if (href.startsWith('#')) {
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }
        window.open(link.href, '_blank', 'noopener,noreferrer');
    });
}
function initFontChooserControls() {
    if (fontChooserTriggerElement) {
        fontChooserTriggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFontMenu();
        });
    }
    fontSubmenuTriggerElements.forEach(trigger => {
        const submenu = trigger.closest('.font-submenu');
        if (!submenu)
            return;
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !submenu.classList.contains('is-open');
            closeAllFontSubmenus();
            submenu.classList.toggle('is-open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            if (willOpen) {
                setFontMenuOpen(true);
            }
        });
    });
    // Font Family Options
    const fontButtons = document.querySelectorAll('.font-family-option');
    fontButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const family = btn.dataset.family;
            if (family) {
                applyFontFamily(family);
                closeFontMenu();
            }
        });
    });
}
export function updateMarginButtonState(activeSize) {
    if (!toolbarElement)
        return;
    const buttons = toolbarElement.querySelectorAll('button[data-action="page-margin"]');
    buttons.forEach(btn => {
        btn.setAttribute('aria-pressed', btn.dataset.size === activeSize ? 'true' : 'false');
    });
}
export function closeAllParagraphSubmenus() {
    if (!paragraphChooserElement)
        return;
    paragraphChooserElement.querySelectorAll('.paragraph-submenu').forEach(submenu => {
        submenu.classList.remove('is-open');
        const trigger = submenu.querySelector('.paragraph-submenu-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}
export function setParagraphMenuOpen(open) {
    if (!paragraphChooserElement)
        return;
    paragraphChooserElement.classList.toggle('is-open', open);
    if (paragraphTriggerElement) {
        paragraphTriggerElement.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (!open) {
        closeAllParagraphSubmenus();
    }
}
export function toggleParagraphMenu() {
    if (!paragraphChooserElement)
        return;
    const willOpen = !paragraphChooserElement.classList.contains('is-open');
    if (willOpen) {
        closeAllMenus('paragraph');
    }
    setParagraphMenuOpen(willOpen);
}
export function closeParagraphMenu() {
    setParagraphMenuOpen(false);
}
const lineHeightSizes = ['s', 'm', 'l'];
const isLineHeightSize = (value) => !!value && lineHeightSizes.includes(value);
export function syncToSource() {
    if (!pagesContainerElement || !sourceElement)
        return;
    sourceElement.value = pagesContainerElement.innerHTML;
}
export function applyLineHeight(size) {
    if (!isLineHeightSize(size) || !pagesContainerElement)
        return;
    const inners = pagesContainerElement.querySelectorAll('.page-inner');
    inners.forEach(inner => {
        lineHeightSizes.forEach(sz => inner.classList.remove(`line-height-${sz}`));
        if (size !== 'm') {
            inner.classList.add(`line-height-${size}`);
        }
    });
    syncToSource();
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
    if (range.collapsed)
        return;
    if (!currentEditor.contains(range.commonAncestorContainer))
        return;
    const selectors = 'p, h1, h2, h3, h4, h5, h6';
    const paragraphs = Array.from(currentEditor.querySelectorAll(selectors)).filter(paragraph => {
        return range.intersectsNode(paragraph);
    });
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
    // 選択範囲の復元（DOM構造変化により失われるため）
    if (selection && paragraphs.length > 0) {
        const first = paragraphs[0];
        const last = paragraphs[paragraphs.length - 1];
        // ラッパーまたはパラグラフ自体を取得
        const firstTarget = findParagraphWrapper(first) || first;
        const lastTarget = findParagraphWrapper(last) || last;
        const newRange = document.createRange();
        // ざっくりと最初の要素の先頭から最後の要素の末尾までを選択
        newRange.setStart(firstTarget, 0);
        // lastTargetの中身を含めるため、childNodesのlengthを使うか、afterを使う
        // ここでは要素全体を選択するイメージで
        if (lastTarget.lastChild) {
            newRange.setEndAfter(lastTarget.lastChild);
        }
        else {
            newRange.setEnd(lastTarget, lastTarget.childNodes.length);
        }
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
    window.syncToSource();
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
    if (!isParagraphSpacingSize(size))
        return;
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
    window.syncToSource();
}
// Phase 3: Formatting & Selection Implementation
// Imported from editor/formatting.ts
// Legacy exports for HTML usage via window
window.toggleBold = toggleBold;
window.toggleItalic = toggleItalic;
window.toggleUnderline = toggleUnderline;
window.toggleStrikeThrough = toggleStrikeThrough;
window.applyInlineScript = applyInlineScript;
window.toggleSuperscript = toggleSuperscript;
window.toggleSubscript = toggleSubscript;
window.resetHighlightsInSelection = resetHighlightsInSelection;
window.applyColorHighlight = applyColorHighlight;
window.applyFontColor = applyFontColor;
window.resetFontColorInSelection = resetFontColorInSelection;
window.removeHighlightsInRange = removeHighlightsInRange;
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
        window.syncToSource();
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
    window.syncToSource();
    return true;
}
export function setHighlightPaletteOpen(open) {
    if (!highlightControlElement || !highlightButtonElement)
        return;
    highlightControlElement.classList.toggle('is-open', open);
    highlightButtonElement.setAttribute('aria-expanded', open ? 'true' : 'false');
}
export function toggleHighlightPalette() {
    if (!highlightControlElement)
        return;
    const willOpen = !highlightControlElement.classList.contains('is-open');
    if (willOpen) {
        closeAllMenus('highlight');
    }
    setHighlightPaletteOpen(willOpen);
}
export function closeAllFontSubmenus() {
    if (!fontChooserElement)
        return;
    fontChooserElement.querySelectorAll('.font-submenu').forEach(submenu => {
        submenu.classList.remove('is-open');
        const trigger = submenu.querySelector('.font-submenu-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}
export function setFontMenuOpen(open) {
    if (!fontChooserElement)
        return;
    fontChooserElement.classList.toggle('is-open', open);
    if (fontChooserTriggerElement) {
        fontChooserTriggerElement.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (!open) {
        closeAllFontSubmenus();
    }
}
// Helper to close all valid menus
function closeAllMenus(exclude) {
    // Note: These functions must be hoisted or defined
    if (exclude !== 'file' && typeof closeFileDropdown === 'function')
        closeFileDropdown();
    if (exclude !== 'font' && typeof closeFontMenu === 'function') {
        closeFontMenu();
        if (typeof closeAllFontSubmenus === 'function')
            closeAllFontSubmenus();
    }
    if (exclude !== 'paragraph' && typeof closeParagraphMenu === 'function')
        closeParagraphMenu();
    if (exclude !== 'highlight') {
        if (highlightControlElement)
            setHighlightPaletteOpen(false);
    }
    closeImageContextMenu(); // Context menu should usually close on other interactions
}
export function toggleFontMenu() {
    if (!fontChooserElement)
        return;
    const willOpen = !fontChooserElement.classList.contains('is-open');
    if (willOpen) {
        closeAllMenus('font');
    }
    setFontMenuOpen(willOpen);
}
export function closeFontMenu() {
    setFontMenuOpen(false);
}
export function closeFontSubmenu(type) {
    if (!fontChooserElement || !type)
        return;
    const submenu = fontChooserElement.querySelector(`.font-submenu[data-submenu="${type}"]`);
    if (!submenu)
        return;
    submenu.classList.remove('is-open');
    const trigger = submenu.querySelector('.font-submenu-trigger');
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
    }
}
// Global Assignments
// Moved to registry.ts
function bindParagraphMenuListeners() {
    if (paragraphTriggerElement) {
        paragraphTriggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleParagraphMenu();
        });
    }
    paragraphSubmenuTriggerElements.forEach(trigger => {
        const submenu = trigger.closest('.paragraph-submenu');
        if (!submenu)
            return;
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !submenu.classList.contains('is-open');
            closeAllParagraphSubmenus();
            submenu.classList.toggle('is-open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            if (willOpen) {
                setParagraphMenuOpen(true);
            }
        });
    });
}
function bindDocumentLevelHandlers() {
    document.addEventListener('mousedown', (event) => {
        const target = event.target;
        const tab = target?.closest('.inline-tab');
        if (!tab)
            return;
        event.preventDefault();
        const rect = tab.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        if (event.clientX < midpoint) {
            window.placeCaretBefore?.(tab);
        }
        else {
            window.placeCaretAfter?.(tab);
        }
    });
    document.addEventListener('click', (event) => {
        const target = event.target;
        const clickedEditor = Boolean(target?.closest('.page-inner'));
        if (clickedEditor) {
            const fileMenu = document.querySelector('.file-menu');
            if (fileMenu && target && !fileMenu.contains(target)) {
                closeFileDropdown();
            }
            if (paragraphChooserElement && target && !paragraphChooserElement.contains(target)) {
                closeParagraphMenu();
            }
            if (fontChooserElement && target && !fontChooserElement.contains(target)) {
                closeFontMenu();
            }
        }
        closeImageContextMenu();
        if (highlightControlElement && target && !highlightControlElement.contains(target)) {
            setHighlightPaletteOpen(false);
        }
    });
}
function bindToolbarHandlers() {
    if (!toolbarElement)
        return;
    toolbarElement.addEventListener('mousedown', (event) => {
        const btn = event.target?.closest('button');
        if (btn) {
            event.preventDefault();
        }
    });
    toolbarElement.addEventListener('click', async (event) => {
        // Handle input (checkbox) clicks first
        const inputTarget = event.target?.closest('input');
        if (inputTarget) {
            // メニュー内の操作であればイベント伝播を止める（メニューを閉じさせないため）
            if (inputTarget.closest('.font-chooser, .paragraph-chooser, .highlight-control')) {
                event.stopPropagation();
            }
            const action = inputTarget.dataset.action;
            if (action === 'hanging-indent') {
                window.toggleHangingIndent?.(inputTarget.checked);
            }
            return;
        }
        const btn = event.target?.closest('button');
        if (!btn)
            return;
        // メニュー内のボタンであればイベント伝播を止める
        // (.font-chooser-panel, .paragraph-panel, .highlight-palette, .file-dropdown などの子孫である場合)
        if (btn.closest('.font-chooser, .paragraph-chooser, .highlight-control, .file-dropdown')) {
            event.stopPropagation();
        }
        const action = btn.dataset.action;
        switch (action) {
            case 'bold':
                toggleBold();
                break;
            case 'italic':
                toggleItalic();
                break;
            case 'underline':
                toggleUnderline();
                break;
            case 'strike':
                toggleStrikeThrough();
                break;
            case 'superscript':
                toggleSuperscript();
                break;
            case 'subscript':
                toggleSubscript();
                break;
            case 'highlight':
                toggleHighlightPalette();
                break;
            case 'highlight-color':
                applyColorHighlight(btn.dataset.color ?? null);
                break;
            case 'highlight-reset':
                window.resetHighlightsInSelection?.();
                break;
            case 'font-color-swatch':
                applyFontColor(btn.dataset.color ?? null);
                break;
            case 'font-color-default':
                resetFontColorInSelection();
                break;
            case 'font-family':
                window.applyFontFamily?.(btn.dataset.family ?? null);
                break;
            case 'paragraph-style':
                toggleParagraphMenu();
                break;
            case 'align-left':
                applyParagraphAlignment('left');
                break;
            case 'align-center':
                applyParagraphAlignment('center');
                break;
            case 'align-right':
                applyParagraphAlignment('right');
                break;
            case 'paragraph-spacing':
                applyParagraphSpacing(btn.dataset.size ?? null);
                break;
            case 'line-height':
                applyLineHeight(btn.dataset.size ?? null);
                break;
            case 'block-element':
                window.applyBlockElement?.(btn.dataset.tag ?? null);
                break;
            case 'indent':
                window.changeIndent?.(1);
                syncToSource();
                break;
            case 'outdent':
                window.changeIndent?.(-1);
                syncToSource();
                break;
            case 'add-page':
                window.addPage?.();
                break;
            case 'remove-page':
                window.removePage?.();
                break;
            case 'save':
                window.saveFullHTML?.();
                break;
            case 'open':
                {
                    const opened = await window.openWithFilePicker?.();
                    if (!opened && openFileInputElement) {
                        openFileInputElement.value = '';
                        openFileInputElement.click();
                    }
                }
                break;
            case 'insert-image-dropbox':
                window.promptDropboxImageUrl?.();
                break;
            case 'insert-image-web':
                window.promptWebImageUrl?.();
                break;
            case 'page-margin':
                if (btn.dataset.size) {
                    applyPageMargin(btn.dataset.size);
                }
                break;
            case 'overwrite':
                await window.overwriteCurrentFile?.();
                break;
            case 'add-link-destination':
                addLinkDestination();
                break;
            case 'create-link':
                createLink();
                break;
            case 'remove-link':
                removeLink();
                break;
            default:
                break;
        }
    });
}
// index.html からインポートされるため、再度エクスポートする
export function initEditor() {
    initFileMenuControls();
    initImageContextMenuControls();
    initPageLinkHandler();
    initFontChooserControls();
    if (typeof window.bindParagraphMenuListeners === 'function') {
        window.bindParagraphMenuListeners();
    }
    else if (typeof bindParagraphMenuListeners === 'function') {
        bindParagraphMenuListeners();
    }
    // Ensure file input listener is bound
    const openFileInput = document.getElementById('open-file-input');
    if (openFileInput) {
        openFileInput.removeEventListener('change', handleOpenFile);
        openFileInput.addEventListener('change', handleOpenFile);
    }
    bindDocumentLevelHandlers();
    if (typeof window.bindToolbarHandlers === 'function') {
        window.bindToolbarHandlers();
    }
    else if (typeof bindToolbarHandlers === 'function') {
        bindToolbarHandlers();
    }
    ensureAiImageIndex();
    applyPageMargin(currentPageMarginSize);
    ensureAiImageIndex();
    applyPageMargin(currentPageMarginSize);
    console.log("Checking window.initPages:", window.initPages);
    if (window.initPages) {
        window.initPages();
    }
    else {
        console.error("window.initPages is MISSING!");
    }
    if (window.renumberParagraphs) {
        window.renumberParagraphs();
    }
    else {
        console.error("window.renumberParagraphs is MISSING!");
    }
    // Late import of registry to ensure exports are ready
    import('./registry.js')
        .then(() => console.log('Registry loaded'))
        .catch(err => console.error('Failed to load registry', err));
    console.log("initEditor() completed.");
}
console.log("main.ts module evaluated. window.bindEditorEvents:", window.bindEditorEvents);
