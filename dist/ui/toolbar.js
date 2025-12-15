import { toggleBold, toggleItalic, toggleUnderline, toggleStrikeThrough, toggleSuperscript, toggleSubscript, applyColorHighlight, applyFontColor, resetFontColorInSelection, resetHighlightsInSelection, toggleHangingIndent, changeIndent, applyParagraphAlignment, applyParagraphSpacing, applyLineHeight, applyBlockElement } from '../editor/formatting.js';
const getToolbarElement = () => document.getElementById('toolbar');
export function updateMarginButtonState(activeSize) {
    const toolbarElement = getToolbarElement();
    if (!toolbarElement)
        return;
    const buttons = toolbarElement.querySelectorAll('button[data-action="page-margin"]');
    buttons.forEach(btn => {
        btn.setAttribute('aria-pressed', btn.dataset.size === activeSize ? 'true' : 'false');
    });
}
export function updateToolbarState() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const paragraph = window.getCurrentParagraph?.();
    const toolbar = getToolbarElement();
    if (!toolbar)
        return;
    const hangingIndentCheckbox = toolbar.querySelector('[data-action="hanging-indent"]');
    if (paragraph && hangingIndentCheckbox) {
        const hasIndent = Array.from(paragraph.classList).some(cls => cls.startsWith('indent-'));
        const isHanging = paragraph.classList.contains('hanging-indent');
        if (hasIndent) {
            hangingIndentCheckbox.disabled = false;
            hangingIndentCheckbox.checked = isHanging;
        }
        else {
            hangingIndentCheckbox.disabled = true;
            hangingIndentCheckbox.checked = false;
        }
    }
    else if (hangingIndentCheckbox) {
        hangingIndentCheckbox.disabled = true;
        hangingIndentCheckbox.checked = false;
    }
}
export function bindToolbarHandlers() {
    const toolbarElement = getToolbarElement();
    if (!toolbarElement)
        return;
    toolbarElement.addEventListener('mousedown', (event) => {
        const btn = event.target?.closest('button');
        if (btn) {
            event.preventDefault();
        }
    });
    toolbarElement.addEventListener('click', async (event) => {
        // Handle input (checkbox) clicks first
        const inputTarget = event.target?.closest('input');
        if (inputTarget) {
            // メニュー内の操作であればイベント伝播を止める（メニューを閉じさせないため）
            if (inputTarget.closest('.font-chooser, .paragraph-chooser, .highlight-control')) {
                event.stopPropagation();
            }
            const action = inputTarget.dataset.action;
            if (action === 'hanging-indent') {
                toggleHangingIndent(inputTarget.checked);
            }
            return;
        }
        const btn = event.target?.closest('button');
        if (!btn)
            return;
        // メニュー内のボタンであればイベント伝播を止める
        // (.font-chooser-panel, .paragraph-panel, .highlight-palette, .file-dropdown などの子孫である場合)
        if (btn.closest('.font-chooser, .paragraph-chooser, .highlight-control, .file-dropdown')) {
            event.stopPropagation();
        }
        const action = btn.dataset.action;
        switch (action) {
            case 'bold':
                toggleBold();
                break;
            case 'italic':
                toggleItalic();
                break;
            case 'underline':
                toggleUnderline();
                break;
            case 'strike':
                toggleStrikeThrough();
                break;
            case 'superscript':
                toggleSuperscript();
                break;
            case 'subscript':
                toggleSubscript();
                break;
            case 'highlight':
                if (window.toggleHighlightPalette)
                    window.toggleHighlightPalette();
                break;
            case 'highlight-color':
                applyColorHighlight(btn.dataset.color ?? null);
                break;
            case 'highlight-reset':
                resetHighlightsInSelection();
                break;
            case 'font-color-swatch':
                applyFontColor(btn.dataset.color ?? null);
                break;
            case 'font-color-default':
                resetFontColorInSelection();
                break;
            case 'font-family':
                window.applyFontFamily?.(btn.dataset.family ?? null);
                break;
            case 'paragraph-style':
                if (window.toggleParagraphMenu)
                    window.toggleParagraphMenu();
                break;
            case 'align-left':
                applyParagraphAlignment('left');
                break;
            case 'align-center':
                applyParagraphAlignment('center');
                break;
            case 'align-right':
                applyParagraphAlignment('right');
                break;
            case 'paragraph-spacing':
                applyParagraphSpacing(btn.dataset.size ?? null);
                break;
            case 'line-height':
                applyLineHeight(btn.dataset.size ?? null);
                break;
            case 'block-element':
                applyBlockElement(btn.dataset.tag ?? null);
                break;
            case 'indent':
                changeIndent(1);
                window.syncToSource?.();
                break;
            case 'outdent':
                changeIndent(-1);
                window.syncToSource?.();
                break;
            case 'add-page':
                window.addPage?.();
                break;
            case 'remove-page':
                window.removePage?.();
                break;
            case 'save':
                window.saveFullHTML?.();
                break;
            case 'open':
                {
                    const opened = await window.openWithFilePicker?.();
                    const openFileInputElement = document.getElementById('open-file-input');
                    if (!opened && openFileInputElement) {
                        openFileInputElement.value = '';
                        openFileInputElement.click();
                    }
                }
                break;
            case 'insert-image-dropbox':
                window.promptDropboxImageUrl?.();
                break;
            case 'insert-image-web':
                window.promptWebImageUrl?.();
                break;
            case 'page-margin':
                if (btn.dataset.size) {
                    if (window.applyPageMargin)
                        window.applyPageMargin(btn.dataset.size);
                }
                break;
            case 'overwrite':
                await window.overwriteCurrentFile?.();
                break;
            case 'add-link-destination':
                if (window.addLinkDestination)
                    window.addLinkDestination();
                break;
            case 'create-link':
                if (window.createLink)
                    window.createLink();
                break;
            case 'remove-link':
                if (window.removeLink)
                    window.removeLink();
                break;
            default:
                break;
        }
    });
}
