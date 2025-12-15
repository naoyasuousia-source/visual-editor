import { toggleBold, toggleItalic, toggleUnderline, toggleStrikeThrough, toggleSuperscript, toggleSubscript, applyColorHighlight, applyFontColor, resetFontColorInSelection, renumberParagraphs, applyPendingBlockTag } from '../editor/formatting.js';
// DOM Elements
const getToolbarElement = () => document.getElementById('toolbar');
const getPagesContainer = () => document.getElementById('pages-container');
const getHighlightControlElement = () => document.querySelector('.highlight-control');
const getFileDropdownElement = () => document.querySelector('.file-dropdown');
const getParagraphChooserElement = () => document.querySelector('.paragraph-chooser');
const getFontChooserElement = () => document.querySelector('.font-chooser');
// Constants
const INDENT_STEP_PX = 36 * (96 / 72);
// Re-implement helper or import logic?
// Ideally we call window.xxx for things that are globally available to avoid circular deps with main.ts
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
            window.syncToSource?.();
        }
    });
    const updateStateWithDelay = () => setTimeout(() => {
        if (window.updateToolbarState)
            window.updateToolbarState();
    }, 50);
    inner.addEventListener('focus', () => {
        if (window.setActiveEditor)
            window.setActiveEditor(inner);
        if (window.saveTextSelectionFromEditor)
            window.saveTextSelectionFromEditor();
        if (window.updateToolbarState)
            window.updateToolbarState();
    });
    inner.addEventListener('mousedown', () => {
        if (window.setActiveEditor)
            window.setActiveEditor(inner);
    });
    inner.addEventListener('mouseup', () => {
        if (window.saveTextSelectionFromEditor)
            window.saveTextSelectionFromEditor();
        updateStateWithDelay();
    });
    inner.addEventListener('keyup', (e) => {
        if (window.saveTextSelectionFromEditor)
            window.saveTextSelectionFromEditor();
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
            if (caretSlot && window.placeCaretBefore) {
                window.placeCaretBefore(caretSlot);
            }
        }
    }, true); // Use capture phase
    inner.addEventListener('keydown', (e) => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount)
            return;
        const range = selection.getRangeAt(0);
        const isCollapsed = range.collapsed;
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
                    if (window.renumberParagraphs)
                        window.renumberParagraphs();
                }
                return;
            }
            else if (e.key === 'Backspace') {
                e.preventDefault();
                const currentParagraph = nodeAfterCaret.closest('p, h1, h2, h3, h4, h5, h6');
                if (currentParagraph) {
                    const prevElement = currentParagraph.previousElementSibling;
                    currentParagraph.remove();
                    if (prevElement && window.placeCaretAfter) {
                        window.placeCaretAfter(prevElement);
                    }
                    if (window.renumberParagraphs)
                        window.renumberParagraphs();
                }
                return;
            }
        }
        if (e.key === 'Enter') {
            const current = window.getCurrentParagraph ? window.getCurrentParagraph() : null;
            const candidate = current
                ? (current.dataset.blockStyle || current.tagName.toLowerCase())
                : (inner.dataset.preferredBlockTag || 'p');
            inner.dataset.pendingBlockTag = candidate;
        }
        else if (e.key === 'Tab') {
            e.preventDefault();
            if (window.handleInlineTabKey)
                window.handleInlineTabKey();
        }
        else if (e.key === 'Backspace') {
            const blocks = inner.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
            if (blocks.length === 1) {
                const block = blocks[0];
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (range.collapsed && range.startOffset === 0) {
                        e.preventDefault();
                        return;
                    }
                }
            }
            if (window.handleInlineTabBackspace) {
                if (window.handleInlineTabBackspace()) {
                    e.preventDefault();
                }
            }
        }
    });
}
export function initPageLinkHandler() {
    const pagesContainerElement = getPagesContainer();
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
export function bindDocumentLevelHandlers() {
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
                if (window.closeFileDropdown)
                    window.closeFileDropdown();
            }
            const paragraphChooserElement = getParagraphChooserElement();
            if (paragraphChooserElement && target && !paragraphChooserElement.contains(target)) {
                if (window.closeParagraphMenu)
                    window.closeParagraphMenu();
            }
            const fontChooserElement = getFontChooserElement();
            if (fontChooserElement && target && !fontChooserElement.contains(target)) {
                if (window.closeFontMenu)
                    window.closeFontMenu();
            }
        }
        if (window.closeImageContextMenu)
            window.closeImageContextMenu();
        const highlightControlElement = getHighlightControlElement();
        if (highlightControlElement && target && !highlightControlElement.contains(target)) {
            if (window.setHighlightPaletteOpen)
                window.setHighlightPaletteOpen(false);
        }
    });
}
export function bindParagraphMenuListeners() {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement)
        return;
    const paragraphTriggerElement = paragraphChooserElement.querySelector('.paragraph-trigger');
    const paragraphSubmenuTriggerElements = Array.from(paragraphChooserElement.querySelectorAll('.paragraph-submenu-trigger'));
    if (paragraphTriggerElement) {
        paragraphTriggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (window.toggleParagraphMenu)
                window.toggleParagraphMenu();
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
            if (window.closeAllParagraphSubmenus)
                window.closeAllParagraphSubmenus();
            submenu.classList.toggle('is-open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            if (willOpen) {
                if (window.setParagraphMenuOpen)
                    window.setParagraphMenuOpen(true);
            }
        });
    });
}
export function bindToolbarHandlers() {
    const toolbarElement = getToolbarElement();
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
                if (window.toggleHighlightPalette)
                    window.toggleHighlightPalette();
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
                if (window.toggleParagraphMenu)
                    window.toggleParagraphMenu();
                break;
            case 'align-left':
                if (window.applyParagraphAlignment)
                    window.applyParagraphAlignment('left');
                break;
            case 'align-center':
                if (window.applyParagraphAlignment)
                    window.applyParagraphAlignment('center');
                break;
            case 'align-right':
                if (window.applyParagraphAlignment)
                    window.applyParagraphAlignment('right');
                break;
            case 'paragraph-spacing':
                if (window.applyParagraphSpacing)
                    window.applyParagraphSpacing(btn.dataset.size ?? null);
                break;
            case 'line-height':
                if (window.applyLineHeight)
                    window.applyLineHeight(btn.dataset.size ?? null);
                break;
            case 'block-element':
                window.applyBlockElement?.(btn.dataset.tag ?? null);
                break;
            case 'indent':
                window.changeIndent?.(1);
                window.syncToSource?.();
                break;
            case 'outdent':
                window.changeIndent?.(-1);
                window.syncToSource?.();
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
                    const openFileInputElement = document.getElementById('open-file-input');
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
                    if (window.applyPageMargin)
                        window.applyPageMargin(btn.dataset.size);
                }
                break;
            case 'overwrite':
                await window.overwriteCurrentFile?.();
                break;
            case 'add-link-destination':
                if (window.addLinkDestination)
                    window.addLinkDestination();
                break;
            case 'create-link':
                if (window.createLink)
                    window.createLink();
                break;
            case 'remove-link':
                if (window.removeLink)
                    window.removeLink();
                break;
            default:
                break;
        }
    });
}
