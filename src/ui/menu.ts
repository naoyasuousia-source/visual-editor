
// DOM Elements
const getFileDropdownElement = () => document.querySelector<HTMLElement>('.file-dropdown');
const getNestedDropdownElements = () => document.querySelectorAll<HTMLElement>('.nested-dropdown');
const getParagraphChooserElement = () => document.querySelector<HTMLElement>('.paragraph-chooser');
const getFontChooserElement = () => document.querySelector<HTMLElement>('.font-chooser');
const getHighlightControlElement = () => document.querySelector<HTMLElement>('.highlight-control');

// File Menu
export function toggleFileDropdown(): void {
    const element = getFileDropdownElement();
    if (!element) return;
    const willOpen = !element.classList.contains('open');
    if (willOpen) {
        closeAllMenus('file');
    }
    element.classList.toggle('open', willOpen);
}

export function closeNestedDropdown(): void {
    getNestedDropdownElements().forEach(dropdown => {
        dropdown.classList.remove('open');
        const trigger = dropdown.querySelector<HTMLElement>('.nested-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}

export function closeFileDropdown(): void {
    const element = getFileDropdownElement();
    if (!element) return;
    element.classList.remove('open');
    closeNestedDropdown();
}

export function initFileMenuControls(): void {
    const fileTrigger = document.querySelector<HTMLElement>('.file-trigger');
    const nestedTriggers = document.querySelectorAll<HTMLElement>('.nested-trigger');

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
            const dropdown = trigger.closest<HTMLElement>('.nested-dropdown');
            if (!dropdown) return;
            const willOpen = !dropdown.classList.contains('open');
            closeNestedDropdown();
            dropdown.classList.toggle('open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });
    });
}

// Font Menu
export function setFontMenuOpen(open: boolean): void {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement) return;
    fontChooserElement.classList.toggle('is-open', open);
    const trigger = fontChooserElement.querySelector<HTMLElement>('.font-chooser-trigger');
    if (trigger) {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (!open) {
        closeAllFontSubmenus();
    }
}

export function closeAllFontSubmenus(): void {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement) return;
    fontChooserElement.querySelectorAll<HTMLElement>('.font-submenu').forEach(submenu => {
        submenu.classList.remove('is-open');
        const trigger = submenu.querySelector<HTMLElement>('.font-submenu-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}

export function toggleFontMenu(): void {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement) return;
    const willOpen = !fontChooserElement.classList.contains('is-open');
    if (willOpen) {
        closeAllMenus('font');
    }
    setFontMenuOpen(willOpen);
}

export function closeFontMenu(): void {
    setFontMenuOpen(false);
}

export function closeFontSubmenu(type?: string | null): void {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement || !type) return;
    const submenu = fontChooserElement.querySelector<HTMLElement>(`.font-submenu[data-submenu="${type}"]`);
    if (!submenu) return;
    submenu.classList.remove('is-open');
    const trigger = submenu.querySelector<HTMLElement>('.font-submenu-trigger');
    if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
    }
}

export function initFontChooserControls(): void {
    const fontChooserElement = getFontChooserElement();
    if (!fontChooserElement) return;
    const fontChooserTriggerElement = fontChooserElement.querySelector<HTMLElement>('.font-chooser-trigger');
    const fontSubmenuTriggerElements = Array.from(fontChooserElement.querySelectorAll<HTMLElement>('.font-submenu-trigger'));

    if (fontChooserTriggerElement) {
        fontChooserTriggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFontMenu();
        });
    }

    fontSubmenuTriggerElements.forEach(trigger => {
        const submenu = trigger.closest<HTMLElement>('.font-submenu');
        if (!submenu) return;
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
    const fontButtons = document.querySelectorAll<HTMLElement>('.font-family-option');
    fontButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const family = btn.dataset.family;
            if (family) {
                (window as any).applyFontFamily?.(family);
                closeFontMenu();
            }
        });
    });
}

// Paragraph Menu
export function closeAllParagraphSubmenus(): void {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement) return;
    console.log("closeAllParagraphSubmenus called"); // DEBUG
    paragraphChooserElement.querySelectorAll<HTMLElement>('.paragraph-submenu').forEach(submenu => {
        submenu.classList.remove('is-open');
        const trigger = submenu.querySelector<HTMLElement>('.paragraph-submenu-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}

export function setParagraphMenuOpen(open: boolean): void {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement) return;
    paragraphChooserElement.classList.toggle('is-open', open);
    const paragraphTriggerElement = paragraphChooserElement.querySelector<HTMLElement>('.paragraph-trigger');
    if (paragraphTriggerElement) {
        paragraphTriggerElement.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (!open) {
        closeAllParagraphSubmenus();
    }
}

export function toggleParagraphMenu(): void {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement) return;
    const willOpen = !paragraphChooserElement.classList.contains('is-open');
    if (willOpen) {
        closeAllMenus('paragraph');
    }
    setParagraphMenuOpen(willOpen);
}

export function closeParagraphMenu(): void {
    setParagraphMenuOpen(false);
}

export function bindParagraphMenuListeners(): void {
    const paragraphChooserElement = getParagraphChooserElement();
    if (!paragraphChooserElement) return;

    const paragraphTriggerElement = paragraphChooserElement.querySelector<HTMLElement>('.paragraph-trigger');
    const paragraphSubmenuTriggerElements = Array.from(paragraphChooserElement.querySelectorAll<HTMLElement>('.paragraph-submenu-trigger'));

    if (paragraphTriggerElement) {
        paragraphTriggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleParagraphMenu();
        });
    }

    paragraphSubmenuTriggerElements.forEach(trigger => {
        const submenu = trigger.closest<HTMLElement>('.paragraph-submenu');
        if (!submenu) return;
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
export function setHighlightPaletteOpen(open: boolean): void {
    const highlightControlElement = getHighlightControlElement();
    if (!highlightControlElement) return;
    const palette = highlightControlElement.querySelector<HTMLElement>('.highlight-palette');
    const trigger = highlightControlElement.querySelector<HTMLElement>('[data-action="highlight"]');
    if (palette) {
        palette.style.display = open ? 'grid' : 'none';
    }
    if (trigger) {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
}

export function toggleHighlightPalette(): void {
    const highlightControlElement = getHighlightControlElement();
    if (!highlightControlElement) return;
    const palette = highlightControlElement.querySelector<HTMLElement>('.highlight-palette');
    // Check computed style or current state
    const isOpen = palette ? palette.style.display !== 'none' : false;
    if (!isOpen) {
        closeAllMenus('highlight');
        setHighlightPaletteOpen(true);
    } else {
        setHighlightPaletteOpen(false);
    }
}


// Close All
export function closeAllMenus(exclude?: 'font' | 'paragraph' | 'highlight' | 'file'): void {
    if (exclude !== 'file') closeFileDropdown();
    if (exclude !== 'font') {
        closeFontMenu();
        closeAllFontSubmenus();
    }
    if (exclude !== 'paragraph') closeParagraphMenu();
    if (exclude !== 'highlight') {
        setHighlightPaletteOpen(false);
    }
    (window as any).closeImageContextMenu?.();
}
