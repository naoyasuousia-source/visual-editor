
import {
    convertParagraphToTag,
    ensureParagraphWrapper
} from '../utils/dom.js';

import {
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrikeThrough,
    toggleSuperscript,
    toggleSubscript,
    applyColorHighlight,
    applyFontColor,
    resetFontColorInSelection,
    resetHighlightsInSelection,
    renumberParagraphs,
    applyPendingBlockTag
} from '../editor/formatting.js';

import { checkPageOverflow } from '../editor/page.js';

// DOM Elements
const getToolbarElement = () => document.getElementById('toolbar');
const getPagesContainer = () => document.getElementById('pages-container');
const getHighlightControlElement = () => document.querySelector<HTMLElement>('.highlight-control');
const getFileDropdownElement = () => document.querySelector<HTMLElement>('.file-dropdown');
const getParagraphChooserElement = () => document.querySelector<HTMLElement>('.paragraph-chooser');
const getFontChooserElement = () => document.querySelector<HTMLElement>('.font-chooser');

// Constants
const INDENT_STEP_PX = 36 * (96 / 72);

// Re-implement helper or import logic?
// Ideally we call window.xxx for things that are globally available to avoid circular deps with main.ts

export function bindEditorEvents(inner: HTMLElement): void {
    if (inner.dataset.bound === '1') return;
    inner.dataset.bound = '1';
    if (!inner.dataset.preferredBlockTag) {
        inner.dataset.preferredBlockTag = 'p';
    }

    inner.addEventListener('input', (e: Event) => {
        const inputEvent = e as InputEvent;
        if (inputEvent && inputEvent.inputType === 'insertParagraph') {
            applyPendingBlockTag(inner);
            renumberParagraphs();
        }
        checkPageOverflow(inner);
    });

    const updateStateWithDelay = () => setTimeout(() => {
        if (window.updateToolbarState) window.updateToolbarState();
    }, 50);

    inner.addEventListener('focus', () => {
        if (window.setActiveEditor) window.setActiveEditor(inner);
        if (window.saveTextSelectionFromEditor) window.saveTextSelectionFromEditor();
        if (window.updateToolbarState) window.updateToolbarState();
    });
    inner.addEventListener('mousedown', () => {
        if (window.setActiveEditor) window.setActiveEditor(inner);
    });
    inner.addEventListener('mouseup', () => {
        if (window.saveTextSelectionFromEditor) window.saveTextSelectionFromEditor();
        updateStateWithDelay();
    });
    inner.addEventListener('keyup', (e) => {
        if (window.saveTextSelectionFromEditor) window.saveTextSelectionFromEditor();
        updateStateWithDelay();
    });
    inner.addEventListener('click', updateStateWithDelay);

    // Caret slot logic
    inner.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const figureWrapper = target.closest('.figure-inline');
        if (figureWrapper && target.tagName !== 'IMG') {
            event.preventDefault();
            const caretSlot = figureWrapper.querySelector('.caret-slot');
            if (caretSlot && window.placeCaretBefore) {
                window.placeCaretBefore(caretSlot as HTMLElement);
            }
        }
    }, true); // Use capture phase

    inner.addEventListener('keydown', (e: KeyboardEvent) => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const isCollapsed = range.collapsed;

        const nodeAfterCaret = isCollapsed ? range.startContainer.childNodes[range.startOffset] : null;
        const isBeforeSlot = nodeAfterCaret && nodeAfterCaret.nodeType === Node.ELEMENT_NODE && (nodeAfterCaret as Element).classList.contains('caret-slot');

        if (isBeforeSlot) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const currentParagraph = (nodeAfterCaret as Element).closest('p, h1, h2, h3, h4, h5, h6');
                if (currentParagraph && currentParagraph.parentNode) {
                    const newPara = document.createElement('p');
                    newPara.innerHTML = '<br>';
                    currentParagraph.parentNode.insertBefore(newPara, currentParagraph.nextSibling);

                    const newRange = document.createRange();
                    newRange.setStart(newPara, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);

                    if (window.renumberParagraphs) window.renumberParagraphs();
                }
                return;
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                const currentParagraph = (nodeAfterCaret as Element).closest('p, h1, h2, h3, h4, h5, h6');
                if (currentParagraph) {
                    const prevElement = currentParagraph.previousElementSibling;
                    currentParagraph.remove();

                    if (prevElement && window.placeCaretAfter) {
                        window.placeCaretAfter(prevElement as HTMLElement);
                    }

                    if (window.renumberParagraphs) window.renumberParagraphs();
                }
                return;
            }
        }

        if (e.key === 'Enter') {
            const current = window.getCurrentParagraph ? window.getCurrentParagraph() : null;
            const candidate = current
                ? ((current as HTMLElement).dataset.blockStyle || current.tagName.toLowerCase())
                : (inner.dataset.preferredBlockTag || 'p');
            inner.dataset.pendingBlockTag = candidate;
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (window.handleInlineTabKey) window.handleInlineTabKey();
        } else if (e.key === 'Backspace') {
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

export function initPageLinkHandler(): void {
    const pagesContainerElement = getPagesContainer();
    if (!pagesContainerElement) return;
    pagesContainerElement.addEventListener('click', (event) => {
        const target = event.target as HTMLElement | null;
        const link = target?.closest<HTMLAnchorElement>('a');
        if (!link || !link.href) return;
        if (!target?.closest('[contenteditable="true"]')) return;
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

export function bindDocumentLevelHandlers(): void {
    document.addEventListener('mousedown', (event) => {
        const target = event.target as HTMLElement | null;
        const tab = target?.closest<HTMLElement>('.inline-tab');
        if (!tab) return;
        event.preventDefault();
        const rect = tab.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        if (event.clientX < midpoint) {
            window.placeCaretBefore?.(tab);
        } else {
            window.placeCaretAfter?.(tab);
        }
    });

    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement | null;
        const clickedEditor = Boolean(target?.closest('.page-inner'));
        if (clickedEditor) {
            const fileMenu = document.querySelector<HTMLElement>('.file-menu');
            if (fileMenu && target && !fileMenu.contains(target)) {
                if (window.closeFileDropdown) window.closeFileDropdown();
            }
            const paragraphChooserElement = getParagraphChooserElement();
            if (paragraphChooserElement && target && !paragraphChooserElement.contains(target)) {
                if (window.closeParagraphMenu) window.closeParagraphMenu();
            }
            const fontChooserElement = getFontChooserElement();
            if (fontChooserElement && target && !fontChooserElement.contains(target)) {
                if (window.closeFontMenu) window.closeFontMenu();
            }
        }
        if (window.closeImageContextMenu) window.closeImageContextMenu();
        const highlightControlElement = getHighlightControlElement();
        if (highlightControlElement && target && !highlightControlElement.contains(target)) {
            if (window.setHighlightPaletteOpen) window.setHighlightPaletteOpen(false);
        }

        const viewMenu = document.querySelector<HTMLElement>('.view-menu');
        if (viewMenu && target && !viewMenu.contains(target)) {
            const viewDropdown = viewMenu.querySelector('.view-dropdown');
            if (viewDropdown && viewDropdown.classList.contains('open')) {
                viewDropdown.classList.remove('open');
            }
        }
    });
}


