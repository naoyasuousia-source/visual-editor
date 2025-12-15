
import { updateMarginButtonState } from './toolbar.js';

// Configuration
const paraNumberLeft = '6mm';
const pageMarginValues: Record<string, string> = { s: '12mm', m: '17mm', l: '24mm' };
const rootMarginRule = /:root\s*{[^}]*}/;

let currentPageMarginSize = 'm';
let currentEditorFontFamily = 'inherit';

const styleTagElement = document.querySelector('style');

export function updateRootVariables(): void {
    if (!styleTagElement) return;
    const marginValue = pageMarginValues[currentPageMarginSize] || '17mm';
    const formatted = `:root {
      --page-margin: ${marginValue};
      --para-number-left: ${paraNumberLeft};
      --editor-font-family: ${currentEditorFontFamily};
    }`;

    if (rootMarginRule.test(styleTagElement.innerHTML)) {
        styleTagElement.innerHTML = styleTagElement.innerHTML.replace(rootMarginRule, formatted);
    } else {
        styleTagElement.innerHTML += '\n' + formatted;
    }
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
