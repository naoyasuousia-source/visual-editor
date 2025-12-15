// DOM Elements
const getFileDropdownElement = () => document.querySelector('.file-dropdown');
const getNestedDropdownElements = () => document.querySelectorAll('.nested-dropdown');
const getParagraphChooserElement = () => document.querySelector('.paragraph-chooser');
const getFontChooserElement = () => document.querySelector('.font-chooser');
const getHighlightControlElement = () => document.querySelector('.highlight-control');
// File Menu
export function toggleFileDropdown() {
    const element = getFileDropdownElement();
    if (!element)
        return;
    const willOpen = !element.classList.contains('open');
    if (willOpen) {
        closeAllMenus('file');
    }
    element.classList.toggle('open', willOpen);
}
export function closeNestedDropdown() {
    getNestedDropdownElements().forEach(dropdown => {
        dropdown.classList.remove('open');
        const trigger = dropdown.querySelector('.nested-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}
export function closeFileDropdown() {
    const element = getFileDropdownElement();
    if (!element)
        return;
    element.classList.remove('open');
    closeNestedDropdown();
}
export function initFileMenuControls() {
    const fileTrigger = document.querySelector('.file-trigger');
    const nestedTriggers = document.querySelectorAll('.nested-trigger');
    if (fileTrigger) {
        fileTrigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFileDropdown();
        });
    }
    nestedTriggers.forEach(trigger => {
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const dropdown = trigger.closest('.nested-dropdown');
            if (!dropdown)
                return;
            const willOpen = !dropdown.classList.contains('open');
            closeNestedDropdown();
            dropdown.classList.toggle('open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });
    });
}
// Font Menu
export function setFontMenuOpen(open) {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement)
        return;
    fontChooserElement.classList.toggle('is-open', open);
    const trigger = fontChooserElement.querySelector('.font-chooser-trigger');
    if (trigger) {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (!open) {
        closeAllFontSubmenus();
    }
}
export function closeAllFontSubmenus() {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement)
        return;
    fontChooserElement.querySelectorAll('.font-submenu').forEach(submenu => {
        submenu.classList.remove('is-open');
        const trigger = submenu.querySelector('.font-submenu-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}
export function toggleFontMenu() {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement)
        return;
    const willOpen = !fontChooserElement.classList.contains('is-open');
    if (willOpen) {
        closeAllMenus('font');
    }
    setFontMenuOpen(willOpen);
}
export function closeFontMenu() {
    setFontMenuOpen(false);
}
export function closeFontSubmenu(type) {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement || !type)
        return;
    const submenu = fontChooserElement.querySelector(`.font-submenu[data-submenu="${type}"]`);
    if (!submenu)
        return;
    submenu.classList.remove('is-open');
    const trigger = submenu.querySelector('.font-submenu-trigger');
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
    }
}
export function initFontChooserControls() {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement)
        return;
    const fontChooserTriggerElement = fontChooserElement.querySelector('.font-chooser-trigger');
    const fontSubmenuTriggerElements = Array.from(fontChooserElement.querySelectorAll('.font-submenu-trigger'));
    if (fontChooserTriggerElement) {
        fontChooserTriggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFontMenu();
        });
    }
    fontSubmenuTriggerElements.forEach(trigger => {
        const submenu = trigger.closest('.font-submenu');
        if (!submenu)
            return;
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !submenu.classList.contains('is-open');
            closeAllFontSubmenus();
            submenu.classList.toggle('is-open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            if (willOpen) {
                setFontMenuOpen(true);
            }
        });
    });
    // Sticky Hover for Font Menu
    if (fontChooserElement) {
        fontChooserElement.addEventListener('mouseenter', () => {
            setFontMenuOpen(true);
        });
    }
    // Font Family Options
    const fontButtons = document.querySelectorAll('.font-family-option');
    fontButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const family = btn.dataset.family;
            if (family) {
                window.applyFontFamily?.(family);
                closeFontMenu();
            }
        });
    });
}
// Paragraph Menu
export function closeAllParagraphSubmenus() {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement)
        return;
    console.log("closeAllParagraphSubmenus called"); // DEBUG
    paragraphChooserElement.querySelectorAll('.paragraph-submenu').forEach(submenu => {
        submenu.classList.remove('is-open');
        const trigger = submenu.querySelector('.paragraph-submenu-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}
export function setParagraphMenuOpen(open) {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement)
        return;
    paragraphChooserElement.classList.toggle('is-open', open);
    const paragraphTriggerElement = paragraphChooserElement.querySelector('.paragraph-trigger');
    if (paragraphTriggerElement) {
        paragraphTriggerElement.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (!open) {
        closeAllParagraphSubmenus();
    }
}
export function toggleParagraphMenu() {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement)
        return;
    const willOpen = !paragraphChooserElement.classList.contains('is-open');
    if (willOpen) {
        closeAllMenus('paragraph');
    }
    setParagraphMenuOpen(willOpen);
}
export function closeParagraphMenu() {
    setParagraphMenuOpen(false);
}
export function bindParagraphMenuListeners() {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement)
        return;
    const paragraphTriggerElement = paragraphChooserElement.querySelector('.paragraph-trigger');
    const paragraphSubmenuTriggerElements = Array.from(paragraphChooserElement.querySelectorAll('.paragraph-submenu-trigger'));
    if (paragraphTriggerElement) {
        paragraphTriggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleParagraphMenu();
        });
    }
    paragraphSubmenuTriggerElements.forEach(trigger => {
        const submenu = trigger.closest('.paragraph-submenu');
        if (!submenu)
            return;
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !submenu.classList.contains('is-open');
            closeAllParagraphSubmenus();
            submenu.classList.toggle('is-open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            if (willOpen) {
                setParagraphMenuOpen(true);
            }
        });
    });
    // Sticky Hover for Paragraph Menu
    if (paragraphChooserElement) {
        paragraphChooserElement.addEventListener('mouseenter', () => {
            setParagraphMenuOpen(true);
        });
    }
}
// Highlight Palette
export function setHighlightPaletteOpen(open) {
    const highlightControlElement = getHighlightControlElement();
    if (!highlightControlElement)
        return;
    const palette = highlightControlElement.querySelector('.highlight-palette');
    const trigger = highlightControlElement.querySelector('[data-action="highlight"]');
    if (palette) {
        palette.style.display = open ? 'grid' : 'none';
    }
    if (trigger) {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
}
export function toggleHighlightPalette() {
    const highlightControlElement = getHighlightControlElement();
    if (!highlightControlElement)
        return;
    const palette = highlightControlElement.querySelector('.highlight-palette');
    // Check computed style or current state
    const isOpen = palette ? palette.style.display !== 'none' : false;
    if (!isOpen) {
        closeAllMenus('highlight');
        setHighlightPaletteOpen(true);
    }
    else {
        setHighlightPaletteOpen(false);
    }
}
// Close All
export function closeAllMenus(exclude) {
    if (exclude !== 'file')
        closeFileDropdown();
    if (exclude !== 'font') {
        closeFontMenu();
        closeAllFontSubmenus();
    }
    if (exclude !== 'paragraph')
        closeParagraphMenu();
    if (exclude !== 'highlight') {
        setHighlightPaletteOpen(false);
    }
    window.closeImageContextMenu?.();
}
