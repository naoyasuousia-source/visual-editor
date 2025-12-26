/**
 * Figure DOM Utilities
 * 
 * Based on v1's DOM manipulation utilities for figure elements.
 * Handles figure wrapper creation and management.
 */

/**
 * Ensure paragraph is wrapped in a figure element
 * Used for inline image alignment control
 * 
 * @param paragraph - The paragraph element containing an image
 * @returns The figure wrapper element or null
 */
export function ensureFigureWrapper(paragraph: HTMLElement): HTMLElement | null {
    if (!paragraph) return null;
    
    // Check if already wrapped
    const existingWrapper = paragraph.closest('figure.figure-inline');
    if (existingWrapper) return existingWrapper as HTMLElement;
    
    // Create figure wrapper
    const figure = document.createElement('figure');
    figure.className = 'figure-inline inline-align-center';
    
    // Replace paragraph with figure, then append paragraph to figure
    const parent = paragraph.parentNode;
    if (!parent) return null;
    
    parent.replaceChild(figure, paragraph);
    figure.appendChild(paragraph);
    
    return figure;
}

/**
 * Find paragraph wrapper (figure element if exists)
 * 
 * @param paragraph - The paragraph element
 * @returns The figure wrapper or the paragraph itself
 */
export function findParagraphWrapper(paragraph: HTMLElement): HTMLElement {
    const wrapper = paragraph.closest('figure.figure-inline');
    return wrapper ? wrapper as HTMLElement : paragraph;
}

/**
 * Create a caret slot element
 * Used after image insertion to provide an editable position
 * 
 * @returns The caret slot span element
 */
export function createCaretSlot(): HTMLSpanElement {
    const caretSlot = document.createElement('span');
    caretSlot.className = 'caret-slot';
    caretSlot.contentEditable = 'false';
    caretSlot.innerHTML = '&#8203;'; // Zero-width space
    return caretSlot;
}

/**
 * Remove existing image title and related elements
 * Cleans up br, caret-slot, and figure-title elements after an image
 * 
 * @param img - The image element
 */
export function removeExistingImageTitle(img: HTMLImageElement | null): void {
    if (!img) return;
    
    let next: ChildNode | null = img.nextSibling;
    while (next) {
        const toRemove = next;
        next = next.nextSibling;
        
        if (toRemove.nodeType === Node.TEXT_NODE && (toRemove.textContent || '').trim() === '') {
            toRemove.remove();
        } else if (toRemove.nodeType === Node.ELEMENT_NODE) {
            const element = toRemove as HTMLElement;
            if (
                element.tagName === 'BR' ||
                element.classList.contains('caret-slot') ||
                element.classList.contains('figure-title')
            ) {
                element.remove();
            } else {
                break;
            }
        } else {
            break;
        }
    }
}
