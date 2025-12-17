// DOM Elements
const getFileDropdownElement = () => document.querySelector('.file-dropdown');
const getNestedDropdownElements = () => document.querySelectorAll('.nested-dropdown');
const getParagraphChooserElement = () => document.querySelector('.paragraph-chooser');
const getFontChooserElement = () => document.querySelector('.font-chooser');
const getHighlightControlElement = () => document.querySelector('.highlight-control');
function isAnyMenuOpen() {
    const file = getFileDropdownElement();
    const font = getFontChooserElement();
    const para = getParagraphChooserElement();
    const hlControl = getHighlightControlElement();
    const view = document.querySelector('.view-dropdown');
    if (file && file.classList.contains('open'))
        return true;
    if (font && font.classList.contains('is-open'))
        return true;
    if (para && para.classList.contains('is-open'))
        return true;
    if (hlControl && hlControl.classList.contains('is-open'))
        return true;
    if (view && view.classList.contains('open'))
        return true;
    return false;
}
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
        const fileMenu = fileTrigger.closest('.file-menu');
        if (fileMenu) {
            fileMenu.addEventListener('mouseenter', () => {
                if (isAnyMenuOpen())
                    return;
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
        // Hover to open
        submenu.addEventListener('mouseenter', () => {
            closeAllFontSubmenus();
            submenu.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
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
            }
        });
    });
    // Sticky Hover for Font Menu
    if (fontChooserElement) {
        fontChooserElement.addEventListener('mouseenter', () => {
            if (isAnyMenuOpen())
                return;
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
        // Hover to open
        submenu.addEventListener('mouseenter', () => {
            closeAllParagraphSubmenus();
            submenu.classList.add('is-open');
            trigger.setAttribute('aria-expanded', 'true');
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
            }
        });
    });
    // Sticky Hover for Paragraph Menu
    if (paragraphChooserElement) {
        paragraphChooserElement.addEventListener('mouseenter', () => {
            if (isAnyMenuOpen())
                return;
            setParagraphMenuOpen(true);
        });
    }
}
// Highlight Palette
export function setHighlightPaletteOpen(open) {
    const highlightControlElement = getHighlightControlElement();
    if (!highlightControlElement)
        return;
    highlightControlElement.classList.toggle('is-open', open);
    // Clear inline display style so CSS class takes precedence
    const palette = highlightControlElement.querySelector('.highlight-palette');
    if (palette) {
        palette.style.display = '';
    }
    const trigger = highlightControlElement.querySelector('[data-action="highlight"]');
    if (trigger) {
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
}
export function toggleHighlightPalette() {
    const highlightControlElement = getHighlightControlElement();
    if (!highlightControlElement)
        return;
    const isOpen = highlightControlElement.classList.contains('is-open');
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
    const viewDropdown = document.querySelector('.view-dropdown');
    if (exclude !== 'view' && viewDropdown) {
        viewDropdown.classList.remove('open');
    }
}
export function initViewMenuControls() {
    const viewTrigger = document.querySelector('.view-trigger');
    const viewDropdown = document.querySelector('.view-dropdown');
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
        const viewMenuElement = viewTrigger.closest('.view-menu');
        if (viewMenuElement) {
            viewMenuElement.addEventListener('mouseenter', () => {
                if (isAnyMenuOpen())
                    return;
                closeAllMenus('view');
                viewDropdown.classList.add('open');
            });
        }
    }
    const pageNumCheckbox = document.querySelector('input[data-action="toggle-page-numbers"]');
    if (pageNumCheckbox) {
        pageNumCheckbox.addEventListener('change', () => {
            document.body.classList.toggle('hide-page-numbers', !pageNumCheckbox.checked);
        });
    }
    const paraNumCheckbox = document.querySelector('input[data-action="toggle-para-numbers"]');
    if (paraNumCheckbox) {
        paraNumCheckbox.addEventListener('change', () => {
            document.body.classList.toggle('hide-para-numbers', !paraNumCheckbox.checked);
        });
    }
}
export function initHighlightMenuControls() {
    const highlightControlElement = getHighlightControlElement();
    if (highlightControlElement) {
        highlightControlElement.addEventListener('mouseenter', () => {
            const anyOpen = isAnyMenuOpen();
            if (anyOpen)
                return;
            closeAllMenus('highlight');
            setHighlightPaletteOpen(true);
        });
    }
}
