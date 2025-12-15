import { toggleBold, toggleItalic, toggleUnderline, toggleStrikeThrough, toggleSuperscript, toggleSubscript, applyColorHighlight, applyFontColor, resetFontColorInSelection, resetHighlightsInSelection, toggleHangingIndent, changeIndent, applyParagraphAlignment, applyParagraphSpacing, applyLineHeight, applyBlockElement } from '../editor/formatting.js';
import { toggleParagraphMenu, toggleHighlightPalette } from './menu.js';
import { getCurrentParagraph, syncToSource } from '../editor/core.js';
import { applyFontFamily, applyPageMargin } from './settings.js';
import { addPage, removePage } from '../editor/page.js';
import { saveFullHTML, openWithFilePicker, overwriteCurrentFile } from '../editor/io.js';
import { promptDropboxImageUrl, promptWebImageUrl } from '../editor/image.js';
import { addLinkDestination, createLink, removeLink } from '../editor/links.js';
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
    const paragraph = getCurrentParagraph();
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
                toggleHighlightPalette();
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
                applyFontFamily(btn.dataset.family ?? null);
                break;
            case 'paragraph-style':
                toggleParagraphMenu();
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
                syncToSource();
                break;
            case 'outdent':
                changeIndent(-1);
                syncToSource();
                break;
            case 'add-page':
                addPage();
                break;
            case 'remove-page':
                removePage();
                break;
            case 'save':
                saveFullHTML();
                break;
            case 'open':
                {
                    const opened = await openWithFilePicker();
                    const openFileInputElement = document.getElementById('open-file-input');
                    if (!opened && openFileInputElement) {
                        openFileInputElement.value = '';
                        openFileInputElement.click();
                    }
                }
                break;
            case 'insert-image-dropbox':
                promptDropboxImageUrl();
                break;
            case 'insert-image-web':
                promptWebImageUrl();
                break;
            case 'page-margin':
                if (btn.dataset.size) {
                    applyPageMargin(btn.dataset.size);
                }
                break;
            case 'overwrite':
                await overwriteCurrentFile();
                break;
            case 'add-link-destination':
                addLinkDestination();
                break;
            case 'create-link':
                createLink();
                break;
            case 'remove-link':
                removeLink();
                break;
            default:
                break;
        }
    });
}
