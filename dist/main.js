import { renumberParagraphs } from './editor/formatting.js';
import { handleOpenFile } from './editor/io.js';
import { initPages } from './editor/page.js';
import { ensureAiImageIndex, initImageContextMenuControls } from './editor/image.js';
import { updateAiMetaGuide } from './editor/ai-meta.js';
import { initPageLinkHandler, bindDocumentLevelHandlers } from './ui/events.js';
import { bindToolbarHandlers } from './ui/toolbar.js';
import { initFileMenuControls, initViewMenuControls, initFontChooserControls, bindParagraphMenuListeners, initHighlightMenuControls, initHelpDialog, initModeSwitch } from './ui/menu.js';
import { applyPageMargin } from './ui/settings.js';
import { initNavigator, initParagraphJump, initSidebarToggle, initToolbarJump } from './ui/navigator.js';
// Phase 1: Core Utilities Implementation
// (Moved to editor/core.ts and registry.ts)
// Phase 3: Formatting & Selection Implementation
// (Imported modules handle logic)
// (Global assignments are in registry.ts)
import { checkBrowserSupport } from './ui/browser-check.js';
import { initRouter } from './core/router.js';
export function initEditor() {
    initRouter();
    checkBrowserSupport();
    initFileMenuControls();
    initViewMenuControls();
    initImageContextMenuControls();
    initPageLinkHandler();
    initFontChooserControls();
    bindParagraphMenuListeners();
    initHighlightMenuControls();
    initHelpDialog();
    initModeSwitch();
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
    initNavigator();
    initParagraphJump();
    initSidebarToggle();
    initToolbarJump();
    // Initialize AI Meta Guide
    updateAiMetaGuide();
    // Late import of registry to ensure exports are ready
    import('./registry.js')
        .catch(err => console.error('Failed to load registry', err));
}
