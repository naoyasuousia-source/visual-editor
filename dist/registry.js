// Import everything needed from main (or other modules) to expose to window
// This file acts as a central registry for global window assignments.
import { toggleBold, toggleItalic, toggleUnderline, toggleStrikeThrough, applyInlineScript, toggleSuperscript, toggleSubscript, resetHighlightsInSelection, applyColorHighlight, applyFontColor, resetFontColorInSelection, removeHighlightsInRange, applyBlockElement, renumberParagraphs, applyPendingBlockTag, toggleHangingIndent, changeIndent, applyParagraphAlignment, applyParagraphSpacing, applyLineHeight, getParagraphsInRange } from './editor/formatting.js';
import { createPage, renumberPages, addPage, removePage, initPages } from './editor/page.js';
import { saveFullHTML, openWithFilePicker, overwriteCurrentFile, handleOpenFile, setPagesHTML, importFullHTMLText, buildFullHTML } from './editor/io.js';
import { convertParagraphToTag, generateBookmarkId, getClosestBlockId, compareParagraphOrder, calculateOffsetWithinNode, isParagraphEmpty, findParagraphWrapper, ensureParagraphWrapper, ensureFigureWrapper } from './utils/dom.js';
import { updateToolbarState, updateMarginButtonState } from './ui/toolbar.js';
import { toggleFileDropdown, closeNestedDropdown, closeFileDropdown, setFontMenuOpen, closeAllFontSubmenus, toggleFontMenu, closeFontMenu, closeFontSubmenu, closeAllParagraphSubmenus, setParagraphMenuOpen, toggleParagraphMenu, closeParagraphMenu, setHighlightPaletteOpen, toggleHighlightPalette } from './ui/menu.js';
import { saveTextSelectionFromEditor, getEffectiveTextRange, isRangeInsideCurrentEditor } from './editor/selection.js';
import { setActiveEditor, getCurrentParagraph, } from './editor/core.js';
import { getCaretOffset, insertInlineTabAt, handleInlineTabKey, handleInlineTabBackspace } from './editor/input.js';
import { applyPageMargin, updateMarginRule, applyFontFamily } from './ui/settings.js';
import { addLinkDestination, createLink, removeLink } from './editor/links.js';
import { bindEditorEvents } from './ui/events.js';
import { computeSelectionStateFromRange, findTextPositionInParagraph, restoreRangeFromSelectionState, findParagraph, placeCaretBefore, placeCaretAfter } from './editor/selection.js';
import { applyImageSize, showImageContextMenu, closeImageContextMenu, closeImageSubmenu, applyImageTitle, promptDropboxImageUrl, promptWebImageUrl, insertImageAtCursor, openTitleDialog, closeTitleDialog, removeExistingImageTitle, updateImageMetaTitle, ensureAiImageIndex, rebuildFigureMetaStore } from './editor/image.js';
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
