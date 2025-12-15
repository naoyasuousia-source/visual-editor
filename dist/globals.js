export const paraNumberLeft = '6mm';
export const pageMarginValues = { s: '12mm', m: '17mm', l: '24mm' };
// Using a function or lazy getter might be better if DOM elements aren't ready at import time,
// but for now we'll export them as-is or use getter functions.
// Note: In typical module systems, top-level code runs when imported. 
// If the script is deferred/module, DOM might be ready. 
// Safest is to use functions for DOM queries or export them as mutable let/const if established pattern allows.
export const rootMarginRule = /:root\s*{[^}]*}/;
// We will use getter functions for DOM elements to ensure we fetch them when needed (or cache them if initialized).
// However, to keep minimal changes, we can export them as consts if we are sure they exist when the script runs (module type).
// Let's assume deferred loading.
export const getToolbarElement = () => document.getElementById('toolbar');
export const getStyleTagElement = () => document.querySelector('style');
export const getFontChooserElement = () => document.querySelector('.font-chooser');
export const getParagraphChooserElement = () => document.querySelector('.paragraph-chooser');
export const getHighlightControlElement = () => document.querySelector('.highlight-control');
export const getPagesContainerElement = () => document.getElementById('pages-container');
export const getOpenFileInputElement = () => document.getElementById('open-file-input');
export const getImageContextMenuElement = () => document.getElementById('image-context-menu');
export const getAiImageIndex = () => {
    let container = document.getElementById('ai-image-index');
    // Ensure it exists logic might be handled in specific function, but basic getter here.
    return container;
};
export const INDENT_STEP_PX = 36 * (96 / 72);
// Mutable application state
export const state = {
    currentPageMarginSize: 'm',
    currentEditorFontFamily: 'inherit',
    openedFileHandle: null, // FileSystemFileHandle
    aiImageIndex: null, // Cache reference
    contextTargetImage: null,
    lastSelectionState: null // SelectionState
};
