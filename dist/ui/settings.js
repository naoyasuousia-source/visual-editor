import { updateMarginButtonState } from './toolbar.js';
// Configuration
const paraNumberLeft = '6mm';
const pageMarginValues = { s: '12mm', m: '17mm', l: '24mm' };
const rootMarginRule = /:root\s*{[^}]*}/;
let currentPageMarginSize = 'm';
let currentEditorFontFamily = 'inherit';
// DOM Elements
const getStyleTagElement = () => document.querySelector('style');
export function updateRootVariables() {
    const marginValue = pageMarginValues[currentPageMarginSize] || '17mm';
    const root = document.documentElement;
    root.style.setProperty('--page-margin', marginValue);
    root.style.setProperty('--para-number-left', paraNumberLeft);
    root.style.setProperty('--editor-font-family', currentEditorFontFamily);
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
