
import { updateMarginButtonState } from './toolbar.js';

// Configuration
const paraNumberLeft = '6mm';
const pageMarginValues: Record<string, string> = { s: '12mm', m: '17mm', l: '24mm' };
const rootMarginRule = /:root\s*{[^}]*}/;

let currentPageMarginSize = 'm';
let currentEditorFontFamily = 'inherit';

// DOM Elements
const getStyleTagElement = () => document.querySelector<HTMLStyleElement>('style');

export function updateRootVariables(): void {
    const marginValue = pageMarginValues[currentPageMarginSize] || '17mm';
    const root = document.documentElement;

    root.style.setProperty('--page-margin', marginValue);
    root.style.setProperty('--para-number-left', paraNumberLeft);
    root.style.setProperty('--editor-font-family', currentEditorFontFamily);
}

export function applyPageMargin(size: string): void {
    if (!pageMarginValues[size]) return;
    currentPageMarginSize = size;
    updateRootVariables();
    updateMarginButtonState(size);
}

// Deprecated: Internal use only -> updateRootVariables
export function updateMarginRule(value: string): void {
    updateRootVariables();
}

export function applyFontFamily(family: string | null | undefined): void {
    if (!family) return;
    currentEditorFontFamily = family;
    updateRootVariables();
}
