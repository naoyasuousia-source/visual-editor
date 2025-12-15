import { renumberParagraphs } from './editor/formatting.js';
import { handleOpenFile } from './editor/io.js';
import { initPages } from './editor/page.js';
import { ensureAiImageIndex, initImageContextMenuControls } from './editor/image.js';
import { initPageLinkHandler, bindDocumentLevelHandlers } from './ui/events.js';
import { bindToolbarHandlers } from './ui/toolbar.js';
import { initFileMenuControls, initFontChooserControls, bindParagraphMenuListeners } from './ui/menu.js';
import { applyPageMargin } from './ui/settings.js';
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
const pagesContainerElement = document.getElementById('pages-container');
const sourceElement = document.getElementById('source');
export function syncToSource() {
    if (!pagesContainerElement || !sourceElement)
        return;
    sourceElement.value = pagesContainerElement.innerHTML;
}
// Main Cleaned Up
// Phase 3: Formatting & Selection Implementation
// Imported from editor/formatting.ts
// Global assignments are now in registry.ts
export function initEditor() {
    initFileMenuControls();
    initImageContextMenuControls();
    initPageLinkHandler();
    initFontChooserControls();
    bindParagraphMenuListeners();
    // Ensure file input listener is bound
    const openFileInput = document.getElementById('open-file-input');
    if (openFileInput) {
        openFileInput.removeEventListener('change', handleOpenFile);
        openFileInput.addEventListener('change', handleOpenFile);
    }
    bindDocumentLevelHandlers();
    bindToolbarHandlers();
    // Initial settings
    ensureAiImageIndex();
    applyPageMargin('m');
    // Direct initialization instead of window lookup
    initPages();
    renumberParagraphs();
    // Late import of registry to ensure exports are ready
    import('./registry.js')
        .then(() => console.log('Registry loaded'))
        .catch(err => console.error('Failed to load registry', err));
    console.log("initEditor() completed.");
}
