
// Import everything needed from main (or other modules) to expose to window
// Ideally, main.ts should just import this file.

// We need to import the functions to be exposed.
// However, since we are moving things FROM main.ts, eventually we will import FROM other modules.
// For now, to support the transition, we might need to rely on main.ts exporting them,
// OR (better) we move the logic out first?

// Wait, the plan says:
// 1. Create registry.ts
// 2. Move window assignments from main.ts to registry.ts
// 3. Import functions IN registry.ts

// Since the functions are currently in main.ts, we have a circular dependency issue if we import main.ts here.
// Core functions are in modules (editor/page.ts, etc.) -> Easy.
// Local functions in main.ts -> Difficult.

// Strategy:
// We will assign to window inside the modules themselves? No, that scatters logic.
// We want a central registry.

// Correct approach for Step 1:
// 1. Identify functions in main.ts that are assigned to window.
// 2. Move those assignments to registry.ts.
// 3. BUT registry.ts needs access to those functions.
//    If they are local in main.ts, main.ts must export them.

import {
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrikeThrough,
    applyInlineScript,
    toggleSuperscript,
    toggleSubscript,
    resetHighlightsInSelection,
    applyColorHighlight,
    applyFontColor,
    resetFontColorInSelection,
    removeHighlightsInRange,
    applyBlockElement,
    renumberParagraphs,
    applyPendingBlockTag,
    toggleHangingIndent,
    changeIndent,
    applyParagraphAlignment,
    applyParagraphSpacing,
    applyLineHeight,
    getParagraphsInRange
} from './editor/formatting.js';

import {
    createPage,
    renumberPages,
    addPage,
    removePage,
    initPages
} from './editor/page.js';

import {
    saveFullHTML,
    openWithFilePicker,
    overwriteCurrentFile,
    handleOpenFile,
    setPagesHTML,
    importFullHTMLText,
    buildFullHTML
} from './editor/io.js';


// Functions still in main.ts (exported)
import {
    convertParagraphToTag,
    generateBookmarkId,
    getClosestBlockId,
    compareParagraphOrder,
    calculateOffsetWithinNode,
    isParagraphEmpty,
    findParagraphWrapper,
    ensureParagraphWrapper,
    ensureFigureWrapper
} from './utils/dom.js';

import {
    updateToolbarState,
    updateMarginButtonState,
    bindToolbarHandlers
} from './ui/toolbar.js';

import {
    toggleFileDropdown,
    closeNestedDropdown,
    closeFileDropdown,
    initFileMenuControls,
    setFontMenuOpen,
    closeAllFontSubmenus,
    toggleFontMenu,
    closeFontMenu,
    closeFontSubmenu,
    initFontChooserControls,
    closeAllParagraphSubmenus,
    setParagraphMenuOpen,
    toggleParagraphMenu,
    closeParagraphMenu,
    bindParagraphMenuListeners,
    setHighlightPaletteOpen,
    toggleHighlightPalette,
    closeAllMenus
} from './ui/menu.js';

// Functions still in main.ts (exported)
import {
    setActiveEditor,
    getCurrentParagraph,
    applyPageMargin,
    updateMarginRule,
    applyFontFamily,
    getCaretOffset,
    insertInlineTabAt,
    handleInlineTabKey,
    handleInlineTabBackspace,
    syncToSource,
    isRangeInsideCurrentEditor,
    saveTextSelectionFromEditor,
    getEffectiveTextRange,
    addLinkDestination,
    createLink,
    removeLink
} from './main.js';

import { bindEditorEvents } from './ui/events.js';

import {
    computeSelectionStateFromRange,
    findTextPositionInParagraph,
    restoreRangeFromSelectionState,
    findParagraph,
    placeCaretBefore,
    placeCaretAfter
} from './editor/selection.js';

import {
    applyImageSize,
    showImageContextMenu,
    closeImageContextMenu,
    closeImageSubmenu,
    applyImageTitle,
    promptDropboxImageUrl,
    promptWebImageUrl,
    insertImageAtCursor,
    openTitleDialog,
    closeTitleDialog,
    removeExistingImageTitle,
    updateImageMetaTitle,
    ensureAiImageIndex,
    rebuildFigureMetaStore
} from './editor/image.js';

// --- Window Assignments ---

// Editor Core & UI
window.setActiveEditor = setActiveEditor;
window.placeCaretBefore = placeCaretBefore;
window.placeCaretAfter = placeCaretAfter;
window.getCurrentParagraph = getCurrentParagraph;
window.updateToolbarState = updateToolbarState;
window.bindEditorEvents = bindEditorEvents;

// Formatting
window.toggleBold = toggleBold;
window.toggleItalic = toggleItalic;
window.toggleUnderline = toggleUnderline;
window.toggleStrikeThrough = toggleStrikeThrough;
window.applyInlineScript = applyInlineScript;
window.toggleSuperscript = toggleSuperscript;
window.toggleSubscript = toggleSubscript;
window.applyBlockElement = applyBlockElement;
window.renumberParagraphs = renumberParagraphs;
window.toggleHangingIndent = toggleHangingIndent;
window.changeIndent = changeIndent;
window.applyPendingBlockTag = applyPendingBlockTag;

// Highlight & Colors
window.toggleHighlightPalette = toggleHighlightPalette;
window.setHighlightPaletteOpen = setHighlightPaletteOpen;
window.resetHighlightsInSelection = resetHighlightsInSelection;
window.applyColorHighlight = applyColorHighlight;
window.applyFontColor = applyFontColor;
window.resetFontColorInSelection = resetFontColorInSelection;
window.removeHighlightsInRange = removeHighlightsInRange;

// Page Management
window.createPage = createPage;
window.renumberPages = renumberPages;
window.addPage = addPage;
window.removePage = removePage;
window.initPages = initPages;
window.setPagesHTML = setPagesHTML;
window.applyPageMargin = applyPageMargin;
window.updateMarginRule = updateMarginRule;
window.updateMarginButtonState = updateMarginButtonState;

// File I/O
window.saveFullHTML = saveFullHTML;
window.openWithFilePicker = openWithFilePicker;
window.overwriteCurrentFile = overwriteCurrentFile;
window.handleOpenFile = handleOpenFile;
window.importFullHTMLText = importFullHTMLText;
window.buildFullHTML = buildFullHTML;

// Fonts & Paragraph Style
window.applyFontFamily = applyFontFamily;
// window.alignDirections = alignDirections;
window.applyParagraphAlignment = applyParagraphAlignment;
window.getParagraphsInRange = getParagraphsInRange;
window.applyParagraphSpacing = applyParagraphSpacing;
window.closeAllFontSubmenus = closeAllFontSubmenus;
window.setFontMenuOpen = setFontMenuOpen;
window.toggleFontMenu = toggleFontMenu;
window.closeFontMenu = closeFontMenu;
window.closeFontSubmenu = closeFontSubmenu;
window.closeAllParagraphSubmenus = closeAllParagraphSubmenus;
window.setParagraphMenuOpen = setParagraphMenuOpen;
window.toggleParagraphMenu = toggleParagraphMenu;
window.closeParagraphMenu = closeParagraphMenu;
window.applyLineHeight = applyLineHeight;

// Tabs & Caret
window.getCaretOffset = getCaretOffset;
window.insertInlineTabAt = insertInlineTabAt;
window.handleInlineTabKey = handleInlineTabKey;
window.handleInlineTabBackspace = handleInlineTabBackspace;

// UI & Utils
window.syncToSource = syncToSource;
window.toggleFileDropdown = toggleFileDropdown;
window.closeNestedDropdown = closeNestedDropdown;
window.closeFileDropdown = closeFileDropdown;
window.isRangeInsideCurrentEditor = isRangeInsideCurrentEditor;
window.saveTextSelectionFromEditor = saveTextSelectionFromEditor;
window.getEffectiveTextRange = getEffectiveTextRange;
window.compareParagraphOrder = compareParagraphOrder;
window.calculateOffsetWithinNode = calculateOffsetWithinNode;
window.computeSelectionStateFromRange = computeSelectionStateFromRange;
window.findTextPositionInParagraph = findTextPositionInParagraph;
window.restoreRangeFromSelectionState = restoreRangeFromSelectionState;
window.findParagraph = findParagraph;
window.findParagraphWrapper = findParagraphWrapper;
window.ensureParagraphWrapper = ensureParagraphWrapper;
window.ensureFigureWrapper = ensureFigureWrapper;
window.convertParagraphToTag = convertParagraphToTag;
window.generateBookmarkId = generateBookmarkId;
window.getClosestBlockId = getClosestBlockId;
window.isParagraphEmpty = isParagraphEmpty;

// Links
window.addLinkDestination = addLinkDestination;
window.createLink = createLink;
window.removeLink = removeLink;

// Images
window.applyImageSize = applyImageSize;
window.ensureAiImageIndex = ensureAiImageIndex;
window.rebuildFigureMetaStore = rebuildFigureMetaStore;
window.showImageContextMenu = showImageContextMenu;
window.closeImageContextMenu = closeImageContextMenu;
window.closeImageSubmenu = closeImageSubmenu;
window.openTitleDialog = openTitleDialog;
window.closeTitleDialog = closeTitleDialog;
window.applyImageTitle = applyImageTitle;
window.removeExistingImageTitle = removeExistingImageTitle;
window.updateImageMetaTitle = updateImageMetaTitle;
window.promptDropboxImageUrl = promptDropboxImageUrl;
window.promptWebImageUrl = promptWebImageUrl;
window.insertImageAtCursor = insertImageAtCursor;

// Helper: Paragraph empty check assignment (keeping local in main.ts if not exported, or moving?)
// isParagraphEmpty is not exported in main.ts, but assigned to window.
// We can't import it if it's not exported.
// Sol: Export it in main.ts or defined here?
// Ideally, move utils to utils/dom.ts.
// For now, let's assume we will export it from main.ts.
