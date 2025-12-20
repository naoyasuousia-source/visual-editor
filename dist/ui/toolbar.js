import { toggleBold, toggleItalic, toggleUnderline, toggleStrikeThrough, toggleSuperscript, toggleSubscript, applyColorHighlight, applyFontColor, resetFontColorInSelection, resetHighlightsInSelection, toggleHangingIndent, changeIndent, applyParagraphAlignment, applyParagraphSpacing, applyLineHeight, applyBlockElement } from '../editor/formatting.js';
import { toggleParagraphMenu, toggleHighlightPalette } from './menu.js';
import { getCurrentParagraph } from '../editor/core.js';
import { applyFontFamily, applyPageMargin } from './settings.js';
import { addPage, removePage } from '../editor/page.js';
import { saveFullHTML, openWithFilePicker, overwriteCurrentFile, saveAsWithFilePicker } from '../editor/io.js';
import { promptDropboxImageUrl, promptWebImageUrl } from '../editor/image.js';
import { addLinkDestination, createLink, removeLink } from '../editor/links.js';
import { getMode } from '../core/router.js';
import { getToolbarElement } from '../globals.js';
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
    // Update Block Element Button
    if (paragraph) {
        const blockType = paragraph.dataset.blockStyle || paragraph.tagName.toLowerCase();
        let label = '本文';
        switch (blockType) {
            case 'h1':
                label = '見出し１';
                break;
            case 'h2':
                label = '見出し２';
                break;
            case 'h3':
                label = '見出し３';
                break;
            case 'p':
                label = '本文';
                break;
            case 'mini-p':
                label = 'サブテキスト';
                break;
            default:
                label = '本文';
                break;
        }
        const labelSpan = toolbar.querySelector('.font-submenu[data-submenu="block-element"] .current-block-label');
        if (labelSpan) {
            labelSpan.textContent = label;
        }
        const wordBlockSelector = document.getElementById('word-block-selector');
        if (wordBlockSelector) {
            // Map label back to tag if needed, or just use blockType
            const wordTag = blockType === 'mini-p' ? 'h6' : blockType;
            wordBlockSelector.value = wordTag;
        }
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
        // Restriction check for Word Mode
        if (getMode() === 'word') {
            const forbiddenActions = ['insert-image-dropbox', 'insert-image-web', 'add-link-destination', 'create-link', 'remove-link'];
            if (action && forbiddenActions.includes(action)) {
                alert('Word互換モードでは、画像、リンク、表の挿入は利用できません。');
                return;
            }
        }
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
                break;
            case 'outdent':
                changeIndent(-1);
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
            case 'save-as':
                saveAsWithFilePicker();
                break;
            case 'open-html':
                {
                    const opened = await openWithFilePicker();
                    if (!opened) {
                        const openFileInputElement = document.getElementById('open-file-input');
                        if (openFileInputElement) {
                            openFileInputElement.value = '';
                            openFileInputElement.click();
                        }
                    }
                }
                break;
            case 'open-docx':
                {
                    // Word import
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.docx';
                    input.style.display = 'none';
                    input.addEventListener('change', async (e) => {
                        const target = e.target;
                        if (target.files && target.files[0]) {
                            const success = await window.importDocx?.(target.files[0]);
                            if (success) {
                                console.log('Docx imported successfully');
                            }
                        }
                    });
                    input.click();
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
            case 'print':
                {
                    window.print();
                    // 印刷ダイアログが終わった後に（少し遅延を挟んで）ポップアップを表示
                    setTimeout(() => {
                        const donateDialog = document.getElementById('donate-dialog');
                        if (donateDialog) {
                            donateDialog.showModal();
                        }
                    }, 500);
                }
                break;
            case 'zoom-in':
                if (currentZoomLevel < 2.0) {
                    currentZoomLevel = parseFloat((currentZoomLevel + 0.1).toFixed(1));
                    updateZoom();
                }
                break;
            case 'zoom-out':
                if (currentZoomLevel > 0.5) {
                    currentZoomLevel = parseFloat((currentZoomLevel - 0.1).toFixed(1));
                    updateZoom();
                }
                break;
            default:
                break;
        }
    });
}
let currentZoomLevel = 1.0;
function updateZoom() {
    const display = document.getElementById('zoom-level-display');
    const container = document.getElementById('pages-container');
    if (display) {
        display.textContent = `${Math.round(currentZoomLevel * 100)}%`;
    }
    if (container) {
        // use CSS zoom property for layout scaling
        container.style.zoom = currentZoomLevel;
    }
}
