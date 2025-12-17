
// DOM Elements
const getFileDropdownElement = () => document.querySelector<HTMLElement>('.file-dropdown');
const getNestedDropdownElements = () => document.querySelectorAll<HTMLElement>('.nested-dropdown');
const getParagraphChooserElement = () => document.querySelector<HTMLElement>('.paragraph-chooser');
const getFontChooserElement = () => document.querySelector<HTMLElement>('.font-chooser');
const getHighlightControlElement = () => document.querySelector<HTMLElement>('.highlight-control');

function adjustMenuPosition(submenu: HTMLElement): void {
    // Reset to default to measure natural size/position
    submenu.style.left = '';
    submenu.style.right = '';

    const rect = submenu.getBoundingClientRect();
    const windowWidth = window.innerWidth;

    // Check if it overflows the right edge
    if (rect.right > windowWidth) {
        // If it overflows, align to the right of the parent
        submenu.style.left = 'auto';
        submenu.style.right = '100%';
        // Note: 'right: 100%' generally puts it to the left of the parent if parent is relatively positioned.
        // Let's check CSS. .font-submenu is flex/relative. 
        // If we want it to open to the LEFT side of the trigger, we might need different logic.
        // Usually submenus open to the right (left: 100%).
        // To open to the left, we'd want right: 100% relative to the parent.

        // However, standard dropdowns might just need to shift. 
        // Let's try attempting to align right edge with viewport or parent.
        // Simple 'flip' to left side:
        submenu.style.left = 'auto';
        submenu.style.right = '100%'; // Position on the left side of the trigger

        // Check if that causes left overflow? (Rare for submenus unless very wide and very left)
    }
}

function isAnyMenuOpen(): boolean {
    const file = getFileDropdownElement();
    const font = getFontChooserElement();
    const para = getParagraphChooserElement();
    const hlControl = getHighlightControlElement();
    const view = document.querySelector('.view-dropdown');

    if (file && file.classList.contains('open')) return true;
    if (font && font.classList.contains('is-open')) return true;
    if (para && para.classList.contains('is-open')) return true;
    if (hlControl && hlControl.classList.contains('is-open')) return true;
    if (view && view.classList.contains('open')) return true;
    return false;
}

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

        const fileMenu = fileTrigger.closest<HTMLElement>('.file-menu');
        if (fileMenu) {
            fileMenu.addEventListener('mouseenter', () => {
                if (isAnyMenuOpen()) return;
                // If closed, open it? Use toggleFileDropdown or explicit open?
                // toggleFileDropdown toggles. If closed, it opens.
                // But check internal state
                const element = getFileDropdownElement();
                if (element && !element.classList.contains('open')) {
                    closeAllMenus('file');
                    element.classList.add('open');
                }
            });
        }
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
    if (open) {
        // Adjust position of the main panel
        const panel = fontChooserElement.querySelector<HTMLElement>('.font-chooser-panel');
        if (panel) {
            adjustMenuPosition(panel);
        }
    } else {
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

        // Hover to open
        submenu.addEventListener('mouseenter', () => {
            closeAllFontSubmenus();
            submenu.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            // Adjust position
            const panel = submenu.querySelector<HTMLElement>('.font-submenu-panel');
            if (panel) {
                adjustMenuPosition(panel);
            }
        });

        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !submenu.classList.contains('is-open');
            closeAllFontSubmenus();
            submenu.classList.toggle('is-open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            if (willOpen) {
                setFontMenuOpen(true);
                const panel = submenu.querySelector<HTMLElement>('.font-submenu-panel');
                if (panel) {
                    adjustMenuPosition(panel);
                }
            }
        });
    });

    // Sticky Hover for Font Menu
    if (fontChooserElement) {
        fontChooserElement.addEventListener('mouseenter', () => {
            if (isAnyMenuOpen()) return;
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
    if (open) {
        // Adjust position of the main panel
        const panel = paragraphChooserElement.querySelector<HTMLElement>('.paragraph-panel');
        if (panel) {
            adjustMenuPosition(panel);
        }
    } else {
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

        // Hover to open
        submenu.addEventListener('mouseenter', () => {
            closeAllParagraphSubmenus();
            submenu.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
            // Adjust position
            const panel = submenu.querySelector<HTMLElement>('.paragraph-submenu-panel');
            if (panel) {
                adjustMenuPosition(panel);
            }
        });

        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !submenu.classList.contains('is-open');
            closeAllParagraphSubmenus();
            submenu.classList.toggle('is-open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            if (willOpen) {
                setParagraphMenuOpen(true);
                const panel = submenu.querySelector<HTMLElement>('.paragraph-submenu-panel');
                if (panel) {
                    adjustMenuPosition(panel);
                }
            }
        });
    });

    // Sticky Hover for Paragraph Menu
    if (paragraphChooserElement) {
        paragraphChooserElement.addEventListener('mouseenter', () => {
            if (isAnyMenuOpen()) return;
            setParagraphMenuOpen(true);
        });
    }
}

// Highlight Palette
export function setHighlightPaletteOpen(open: boolean): void {
    const highlightControlElement = getHighlightControlElement();
    if (!highlightControlElement) return;

    highlightControlElement.classList.toggle('is-open', open);

    // Clear inline display style so CSS class takes precedence
    const palette = highlightControlElement.querySelector<HTMLElement>('.highlight-palette');
    if (palette) {
        palette.style.display = '';
        if (open) {
            adjustMenuPosition(palette);
        }
    }

    const trigger = highlightControlElement.querySelector<HTMLElement>('[data-action="highlight"]');
    if (trigger) {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
}

export function toggleHighlightPalette(): void {
    const highlightControlElement = getHighlightControlElement();
    if (!highlightControlElement) return;

    const isOpen = highlightControlElement.classList.contains('is-open');
    if (!isOpen) {
        closeAllMenus('highlight');
        setHighlightPaletteOpen(true);
    } else {
        setHighlightPaletteOpen(false);
    }
}


// Close All
export function closeAllMenus(exclude?: 'font' | 'paragraph' | 'highlight' | 'file' | 'view'): void {
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
    const viewDropdown = document.querySelector<HTMLElement>('.view-dropdown');
    if (exclude !== 'view' && viewDropdown) {
        viewDropdown.classList.remove('open');
    }
}

export function initViewMenuControls(): void {
    const viewTrigger = document.querySelector<HTMLElement>('.view-trigger');
    const viewDropdown = document.querySelector<HTMLElement>('.view-dropdown');

    if (viewTrigger && viewDropdown) {
        viewTrigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !viewDropdown.classList.contains('open');
            if (willOpen) {
                closeAllMenus('view');
            }
            viewDropdown.classList.toggle('open', willOpen);
        });

        const viewMenuElement = viewTrigger.closest<HTMLElement>('.view-menu');
        if (viewMenuElement) {
            viewMenuElement.addEventListener('mouseenter', () => {
                if (isAnyMenuOpen()) return;
                closeAllMenus('view');
                viewDropdown.classList.add('open');
            });
        }
    }

    const pageNumCheckbox = document.querySelector<HTMLInputElement>('input[data-action="toggle-page-numbers"]');
    if (pageNumCheckbox) {
        pageNumCheckbox.addEventListener('change', () => {
            document.body.classList.toggle('hide-page-numbers', !pageNumCheckbox.checked);
        });
    }

    const paraNumCheckbox = document.querySelector<HTMLInputElement>('input[data-action="toggle-para-numbers"]');
    if (paraNumCheckbox) {
        paraNumCheckbox.addEventListener('change', () => {
            document.body.classList.toggle('hide-para-numbers', !paraNumCheckbox.checked);
        });
    }
}

export function initHighlightMenuControls(): void {
    const highlightControlElement = getHighlightControlElement();
    if (highlightControlElement) {
        highlightControlElement.addEventListener('mouseenter', () => {
            const anyOpen = isAnyMenuOpen();
            if (anyOpen) return;
            closeAllMenus('highlight');
            setHighlightPaletteOpen(true);
        });
    }
}
