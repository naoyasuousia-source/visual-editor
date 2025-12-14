// Phase 1: Core Utilities Implementation
export function setActiveEditor(inner) {
    window.currentEditor = inner;
    document.querySelectorAll('section.page').forEach(p => p.classList.remove('active'));
    if (inner) {
        const page = inner.closest('section.page');
        if (page)
            page.classList.add('active');
    }
}
export function placeCaretBefore(node) {
    if (!node)
        return;
    const range = document.createRange();
    range.setStartBefore(node);
    range.collapse(true);
    const selection = window.getSelection();
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
export function placeCaretAfter(node) {
    if (!node)
        return;
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    const selection = window.getSelection();
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
export function getCurrentParagraph() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return null;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount)
        return null;
    let node = sel.anchorNode;
    if (!currentEditor.contains(node))
        return null;
    while (node && !(node.nodeType === 1 && /^(p|h[1-6]|div)$/i.test(node.nodeName))) {
        node = node.parentNode;
    }
    return node;
}
// Ensure global exposure for index.html compatibility
window.setActiveEditor = setActiveEditor;
window.placeCaretBefore = placeCaretBefore;
window.placeCaretAfter = placeCaretAfter;
window.getCurrentParagraph = getCurrentParagraph;
/**
 * 段落要素が空（テキストや<br>以外の要素がない）かどうかを判定します。
 * @param block - 判定対象の要素
 * @returns 空であれば true
 */
const isParagraphEmpty = (block) => {
    if (!block)
        return false;
    for (const child of block.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            // textContent が null の可能性を考慮し、オプショナルチェイニング(?.)を使用
            if (child.textContent?.trim() !== '') {
                return false;
            }
        }
        else if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.tagName !== 'BR') {
                return false;
            }
        }
    }
    return true;
};
// 段階的な移行のため、グローバルスコープで利用できるようにする
window.isParagraphEmpty = isParagraphEmpty;
let lastSelectionState = null;
const alignDirections = ['left', 'center', 'right'];
const paragraphSpacingSizes = ['xs', 's', 'm', 'l', 'xl'];
const isParagraphSpacingSize = (value) => !!value && paragraphSpacingSizes.includes(value);
export function findParagraphWrapper(paragraph) {
    if (!paragraph || !(paragraph instanceof HTMLElement))
        return null;
    return (Array.from(paragraph.children).find((child) => child instanceof HTMLElement && child.classList.contains('inline-align')) ?? null);
}
export function ensureParagraphWrapper(paragraph) {
    let wrapper = findParagraphWrapper(paragraph);
    if (wrapper)
        return wrapper;
    const fragment = document.createDocumentFragment();
    while (paragraph.firstChild) {
        fragment.appendChild(paragraph.firstChild);
    }
    wrapper = document.createElement('span');
    wrapper.classList.add('inline-align');
    wrapper.appendChild(fragment);
    paragraph.appendChild(wrapper);
    return wrapper;
}
export function ensureFigureWrapper(paragraph) {
    if (!paragraph || !(paragraph instanceof HTMLElement))
        return null;
    const wrapper = ensureParagraphWrapper(paragraph);
    alignDirections.forEach(dir => {
        wrapper.classList.remove(`inline-align-${dir}`);
    });
    wrapper.classList.add('inline-align-center', 'figure-inline');
    return wrapper;
}
export function convertParagraphToTag(paragraph, tag) {
    if (!paragraph || !(paragraph instanceof HTMLElement))
        return null;
    const desiredTag = tag === 'mini-p' ? 'p' : tag;
    const currentTag = paragraph.tagName.toLowerCase();
    let replacement = paragraph;
    if (currentTag !== desiredTag) {
        const replacementElement = document.createElement(desiredTag);
        Array.from(paragraph.attributes).forEach(attr => {
            replacementElement.setAttribute(attr.name, attr.value);
        });
        while (paragraph.firstChild) {
            replacementElement.appendChild(paragraph.firstChild);
        }
        const parent = paragraph.parentNode;
        if (parent) {
            parent.replaceChild(replacementElement, paragraph);
        }
        replacement = replacementElement;
    }
    if (tag === 'mini-p') {
        let miniTextSpan = replacement.querySelector(':scope > .mini-text');
        if (miniTextSpan) {
            miniTextSpan.style.fontSize = '8pt';
            if (!miniTextSpan.classList.contains('mini-text')) {
                miniTextSpan.classList.add('mini-text');
            }
        }
        else {
            const fragment = document.createDocumentFragment();
            while (replacement.firstChild) {
                fragment.appendChild(replacement.firstChild);
            }
            miniTextSpan = document.createElement('span');
            miniTextSpan.className = 'mini-text';
            miniTextSpan.style.fontSize = '8pt';
            miniTextSpan.appendChild(fragment);
            replacement.appendChild(miniTextSpan);
        }
        replacement.dataset.blockStyle = 'mini-p';
    }
    else {
        const miniTextSpan = replacement.querySelector(':scope > .mini-text');
        if (miniTextSpan) {
            while (miniTextSpan.firstChild) {
                replacement.insertBefore(miniTextSpan.firstChild, miniTextSpan);
            }
            replacement.removeChild(miniTextSpan);
        }
        replacement.dataset.blockStyle = desiredTag;
    }
    return replacement;
}
export function generateBookmarkId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'bm-';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
export function addLinkDestination() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
        alert('テキストを選択してください。');
        return;
    }
    if (!currentEditor.contains(range.commonAncestorContainer)) {
        alert('編集エリア内のテキストを選択してください。');
        return;
    }
    const span = document.createElement('span');
    span.id = generateBookmarkId();
    try {
        range.surroundContents(span);
    }
    catch (err) {
        console.error('Failed to wrap selection: ', err);
        alert('複雑な選択範囲のため、リンク先を追加できませんでした。段落をまたがない単純なテキストを選択してください。');
        return;
    }
    selection.removeAllRanges();
    window.syncToSource();
}
export function createLink() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
        alert('リンクにしたいテキストを選択してください。');
        return;
    }
    const range = selection.getRangeAt(0);
    const currentEditor = window.currentEditor;
    if (!currentEditor || !currentEditor.contains(range.commonAncestorContainer)) {
        alert('編集エリア内のテキストを選択してください。');
        return;
    }
    const destinations = Array.from(document.querySelectorAll('.page-inner [id^="bm-"]'));
    if (destinations.length === 0) {
        alert('リンク先が登録されていません。');
        return;
    }
    let promptMessage = 'どのリンク先にリンクしますか？番号を入力してください。\n\n';
    const destinationMap = new Map();
    destinations.forEach((dest, index) => {
        const text = dest.textContent?.trim().substring(0, 50) || '(テキストなし)';
        promptMessage += `${index + 1}: ${text}\n`;
        destinationMap.set(String(index + 1), dest.id);
    });
    const choice = window.prompt(promptMessage);
    if (!choice)
        return;
    const destinationId = destinationMap.get(choice.trim());
    if (!destinationId) {
        alert('無効な番号です。');
        return;
    }
    document.execCommand('createLink', false, `#${destinationId}`);
    currentEditor.normalize();
    window.syncToSource();
}
export function removeLink() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const links = Array.from(currentEditor.querySelectorAll('a[href^="#bm-"]'));
    if (links.length === 0) {
        alert('削除できるリンクがありません。');
        return;
    }
    let promptMessage = 'どのリンクを削除しますか？番号を入力してください。\\n\\n';
    const linkMap = new Map();
    links.forEach((link, index) => {
        const text = link.textContent?.trim().substring(0, 50) || '(テキストなし)';
        promptMessage += `${index + 1}: ${text}\\n`;
        linkMap.set(String(index + 1), link);
    });
    const choice = window.prompt(promptMessage);
    if (!choice)
        return;
    const linkToRemove = linkMap.get(choice.trim());
    if (!linkToRemove) {
        alert('無効な番号です。');
        return;
    }
    const parent = linkToRemove.parentNode;
    if (!parent)
        return;
    while (linkToRemove.firstChild) {
        parent.insertBefore(linkToRemove.firstChild, linkToRemove);
    }
    parent.removeChild(linkToRemove);
    parent.normalize();
    window.syncToSource();
}
export function isRangeInsideCurrentEditor(range) {
    const currentEditor = window.currentEditor;
    return !!(currentEditor && range && currentEditor.contains(range.commonAncestorContainer));
}
export function saveTextSelectionFromEditor() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    if (!isRangeInsideCurrentEditor(range))
        return;
    const state = computeSelectionStateFromRange(range);
    if (state) {
        lastSelectionState = state;
    }
}
export function getEffectiveTextRange() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed && isRangeInsideCurrentEditor(range)) {
            const state = computeSelectionStateFromRange(range);
            if (state) {
                lastSelectionState = state;
            }
            return range.cloneRange();
        }
    }
    if (lastSelectionState) {
        const restored = restoreRangeFromSelectionState(lastSelectionState);
        if (restored && isRangeInsideCurrentEditor(restored)) {
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(restored);
            }
            return restored.cloneRange();
        }
    }
    return null;
}
export function compareParagraphOrder(a, b) {
    if (a === b)
        return 0;
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
    }
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
    }
    return 0;
}
export function calculateOffsetWithinNode(root, container, offset) {
    if (!root || !container)
        return null;
    try {
        const temp = document.createRange();
        temp.setStart(root, 0);
        temp.setEnd(container, offset);
        return temp.toString().length;
    }
    catch (err) {
        return null;
    }
}
export function computeSelectionStateFromRange(range) {
    if (!range)
        return null;
    const startParagraph = findParagraph(range.startContainer);
    const endParagraph = findParagraph(range.endContainer);
    if (!startParagraph || !endParagraph)
        return null;
    const startId = startParagraph.id;
    const endId = endParagraph.id;
    if (!startId || !endId)
        return null;
    const startOffset = calculateOffsetWithinNode(startParagraph, range.startContainer, range.startOffset);
    const endOffset = calculateOffsetWithinNode(endParagraph, range.endContainer, range.endOffset);
    if (startOffset == null || endOffset == null)
        return null;
    let startState = {
        block: startParagraph,
        id: startId,
        offset: startOffset
    };
    let endState = {
        block: endParagraph,
        id: endId,
        offset: endOffset
    };
    let order = compareParagraphOrder(startParagraph, endParagraph);
    if (order > 0 || (order === 0 && startOffset > endOffset)) {
        [startState, endState] = [endState, startState];
    }
    return {
        startBlockId: startState.id,
        endBlockId: endState.id,
        startOffset: startState.offset,
        endOffset: endState.offset
    };
}
export function findTextPositionInParagraph(block, targetOffset) {
    if (!block)
        return null;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
    let node = walker.nextNode();
    let remaining = Math.max(0, targetOffset);
    while (node) {
        const length = node.textContent?.length ?? 0;
        if (remaining <= length) {
            return { node, offset: remaining };
        }
        remaining -= length;
        node = walker.nextNode();
    }
    const fallbackOffset = Math.min(Math.max(remaining, 0), block.childNodes.length);
    return { node: block, offset: fallbackOffset };
}
export function restoreRangeFromSelectionState(state) {
    if (!state)
        return null;
    const startBlock = document.getElementById(state.startBlockId);
    const endBlock = document.getElementById(state.endBlockId);
    if (!startBlock || !endBlock)
        return null;
    const startPosition = findTextPositionInParagraph(startBlock, state.startOffset);
    const endPosition = findTextPositionInParagraph(endBlock, state.endOffset);
    if (!startPosition || !endPosition)
        return null;
    const range = document.createRange();
    range.setStart(startPosition.node, startPosition.offset);
    range.setEnd(endPosition.node, endPosition.offset);
    return range;
}
export function findParagraph(node) {
    let current = node;
    const currentEditor = window.currentEditor;
    while (current && current !== currentEditor) {
        if (current.nodeType === Node.ELEMENT_NODE &&
            /^(p|h[1-6])$/i.test(current.tagName)) {
            return current;
        }
        current = current.parentNode;
    }
    return null;
}
const paraNumberLeft = '6mm';
const pageMarginValues = { s: '12mm', m: '17mm', l: '24mm' };
const rootMarginRule = /:root\s*{[^}]*}/;
const toolbarElement = document.getElementById('toolbar');
const styleTagElement = document.querySelector('style');
const fontChooserElement = document.querySelector('.font-chooser');
const fontChooserTriggerElement = fontChooserElement
    ? (fontChooserElement.querySelector('.font-chooser-trigger') ?? null)
    : null;
const fontSubmenuTriggerElements = fontChooserElement
    ? Array.from(fontChooserElement.querySelectorAll('.font-submenu-trigger'))
    : [];
const paragraphChooserElement = document.querySelector('.paragraph-chooser');
const paragraphTriggerElement = paragraphChooserElement
    ? (paragraphChooserElement.querySelector('.paragraph-trigger') ?? null)
    : null;
const paragraphSubmenuTriggerElements = paragraphChooserElement
    ? Array.from(paragraphChooserElement.querySelectorAll('.paragraph-submenu-trigger'))
    : [];
const highlightControlElement = document.querySelector('.highlight-control');
const highlightButtonElement = highlightControlElement
    ? (highlightControlElement.querySelector('[data-action="highlight"]') ?? null)
    : null;
const getFileDropdownElement = () => document.querySelector('.file-dropdown');
const getNestedDropdownElements = () => document.querySelectorAll('.nested-dropdown');
const INDENT_STEP_PX = 36 * (96 / 72);
let currentPageMarginSize = 'm';
let currentEditorFontFamily = 'inherit';
const pagesContainerElement = document.getElementById('pages-container');
const sourceElement = document.getElementById('source');
const openFileInputElement = document.getElementById('open-file-input');
const imageContextMenuElement = document.getElementById('image-context-menu');
const imageContextDropdownElement = document.querySelector('.image-context-dropdown');
export function updateRootVariables() {
    if (!styleTagElement)
        return;
    const marginValue = pageMarginValues[currentPageMarginSize] || '17mm';
    const formatted = `:root {
      --page-margin: ${marginValue};
      --para-number-left: ${paraNumberLeft};
      --editor-font-family: ${currentEditorFontFamily};
    }`;
    if (rootMarginRule.test(styleTagElement.innerHTML)) {
        styleTagElement.innerHTML = styleTagElement.innerHTML.replace(rootMarginRule, formatted);
    }
    else {
        styleTagElement.innerHTML += '\n' + formatted;
    }
}
export function applyPageMargin(size) {
    if (!pageMarginValues[size])
        return;
    currentPageMarginSize = size;
    updateRootVariables();
    updateMarginButtonState(size);
}
// Deprecated: Internal use only -> updateRootVariables
export function updateMarginRule(value) {
    updateRootVariables();
}
export function applyFontFamily(family) {
    if (!family)
        return;
    currentEditorFontFamily = family;
    updateRootVariables();
}
const imageContextTriggerElement = document.querySelector('.image-context-trigger');
const imageTitleDialogElement = document.getElementById('image-title-dialog');
const imageTitleInputElement = document.getElementById('image-title-input');
const imageTitleFontRadios = imageTitleDialogElement
    ? Array.from(imageTitleDialogElement.querySelectorAll('input[name="image-title-font-size"]'))
    : [];
const imageTitleApplyButtonElement = document.querySelector('[data-action="apply-image-title"]');
const imageTitleCancelButtonElement = document.querySelector('[data-action="cancel-image-title"]');
const imageSizeClasses = ['xs', 's', 'm', 'l', 'xl'];
const isImageSizeClass = (value) => !!value && imageSizeClasses.includes(value);
let contextTargetImage = null;
let aiImageIndex = null;
let openedFileHandle = null; // FileSystemFileHandle
export function toggleHangingIndent(shouldHang) {
    const p = getCurrentParagraph();
    if (!p)
        return;
    if (shouldHang) {
        p.classList.add('hanging-indent');
    }
    else {
        p.classList.remove('hanging-indent');
    }
    window.syncToSource();
    updateToolbarState();
}
export function changeIndent(delta) {
    const p = getCurrentParagraph();
    if (!p)
        return;
    const m = p.className.match(/indent-(\d+)/);
    let level = m ? parseInt(m[1], 10) : 0;
    level = Math.max(0, Math.min(5, level + delta));
    p.className = p.className.replace(/indent-\d+/, '').trim();
    if (level > 0)
        p.classList.add(`indent-${level}`);
    window.syncToSource();
    updateToolbarState();
}
export function setPagesHTML(html) {
    if (!pagesContainerElement)
        return;
    pagesContainerElement.innerHTML = html || '';
    ensureAiImageIndex();
    pagesContainerElement.querySelectorAll('.page-inner').forEach(inner => {
        inner.setAttribute('contenteditable', 'true');
        inner.removeAttribute('data-bound');
    });
    if (aiImageIndex) {
        aiImageIndex.innerHTML = '';
    }
    if (!pagesContainerElement.querySelector('.page-inner')) {
        // もし空になったら最低1ページだけ作る
        if (typeof window.createPage === 'function') {
            const page = window.createPage(1, '<p>ここに本文を書く</p>');
            pagesContainerElement.appendChild(page);
        }
    }
    ensureAiImageIndex();
    // applyEditorFontFamily is likely a global helper or style manipulation. 
    // We can assume it's available or we need to migrate it. 
    // For now let's skip explicit font re-app otherwise we need to migrate that too.
    // Actually applyFontFamily is in valid Window interface.
    if (window.applyFontFamily) {
        const style = getComputedStyle(document.documentElement).getPropertyValue('--editor-font-family').trim();
        if (style)
            window.applyFontFamily(style);
    }
    if (window.renumberPages)
        window.renumberPages();
    if (window.initPages)
        window.initPages();
}
export function importFullHTMLText(text) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const importedContainer = doc.querySelector('#pages-container');
        if (!importedContainer) {
            alert('このツールで保存したHTMLではなさそうです。');
            return false;
        }
        setPagesHTML(importedContainer.innerHTML);
        if (typeof renumberParagraphs === 'function') {
            renumberParagraphs();
        }
        return true;
    }
    catch (err) {
        console.error(err);
        alert('ファイルの読み込み中にエラーが発生しました。');
        return false;
    }
}
export function handleOpenFile(event) {
    const input = event.target;
    const file = input.files && input.files[0];
    if (!file)
        return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === 'string' && importFullHTMLText(text)) {
            openedFileHandle = null;
        }
    };
    reader.onerror = () => {
        alert('ファイルを読み込めませんでした。');
    };
    reader.readAsText(file, 'utf-8');
}
export async function openWithFilePicker() {
    // @ts-ignore
    if (!window.showOpenFilePicker)
        return false;
    try {
        // @ts-ignore
        const [handle] = await window.showOpenFilePicker({
            types: [
                {
                    description: 'HTML Files',
                    accept: {
                        'text/html': ['.html', '.htm']
                    }
                }
            ],
            multiple: false
        });
        if (!handle)
            return false;
        const file = await handle.getFile();
        const text = await file.text();
        if (importFullHTMLText(text)) {
            openedFileHandle = handle;
            return true;
        }
    }
    catch (err) {
        if (err.name !== 'AbortError') {
            console.error(err);
            alert('ファイルを開けませんでした。');
        }
    }
    return false;
}
export function buildFullHTML() {
    if (typeof renumberParagraphs === "function") {
        renumberParagraphs();
    }
    if (!pagesContainerElement)
        return '';
    // 編集用DOMをそのまま使うと contenteditable が混ざるので、
    // クローンを作ってから contenteditable を削除する
    const pagesContainerClone = pagesContainerElement.cloneNode(true);
    pagesContainerClone
        .querySelectorAll('section.page')
        .forEach(p => p.classList.remove('active'));
    pagesContainerClone
        .querySelectorAll('.page-inner')
        .forEach(inner => {
        inner.removeAttribute('contenteditable');
        inner.removeAttribute('data-bound');
    });
    // A4エリアのHTML内容（編集不可バージョン）
    const pagesHTML = pagesContainerClone.innerHTML;
    // ページ内の <style> を抽出
    // Note: main.ts might not have access to 'styleTag' global from index.html if not defined.
    // We use document.querySelector('style') as in the original code.
    const styleTag = document.querySelector("style");
    const styleContent = styleTag ? styleTag.innerHTML : "";
    // 完全HTMLを組み立て
    let html = "<!doctype html>\n";
    html += "<html>\n<head>\n<meta charset=\"utf-8\">\n";
    html += "<title>Document</title>\n<style>\n";
    html += styleContent;
    html += "\n</style>\n</head>\n<body>\n";
    html += "<div id=\"pages-container\">\n";
    html += pagesHTML;
    html += "\n<\/div>\n<\/body>\n<\/html>";
    return html;
}
export async function overwriteCurrentFile() {
    if (!openedFileHandle) {
        alert('File System Access API で開いたファイルのみ上書きできます（Chrome 推奨）。');
        return;
    }
    try {
        const writable = await openedFileHandle.createWritable();
        await writable.write(buildFullHTML());
        await writable.close();
        alert('上書き保存しました。');
    }
    catch (err) {
        console.error(err);
        alert('上書き保存に失敗しました。');
    }
}
export function saveFullHTML() {
    const html = buildFullHTML();
    // HTML文字列から Blob を作成
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    // 一時的な <a> を作成してクリック → ダウンロード
    const a = document.createElement('a');
    a.href = url;
    // ファイル名をざっくり日時付きにする
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    a.download = `document-${y}${m}${d}-${hh}${mm}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // 一時URLを解放
    URL.revokeObjectURL(url);
}
export function toggleFileDropdown() {
    const element = getFileDropdownElement();
    if (!element)
        return;
    element.classList.toggle('open');
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
function initFileMenuControls() {
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
export function applyImageSize(img, size) {
    if (!img || !isImageSizeClass(size))
        return;
    imageSizeClasses.forEach(s => {
        img.classList.remove(`img-${s}`);
    });
    img.classList.add(`img-${size}`);
}
export function ensureAiImageIndex() {
    if (!pagesContainerElement)
        return;
    let container = document.getElementById('ai-image-index');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ai-image-index';
        container.style.display = 'none';
    }
    else if (container.parentNode) {
        container.parentNode.removeChild(container);
    }
    pagesContainerElement.appendChild(container);
    aiImageIndex = container;
}
export function getClosestBlockId(element) {
    if (!element)
        return '';
    const block = element.closest('p, h1, h2, h3, h4, h5, h6');
    return block ? block.id : '';
}
export function rebuildFigureMetaStore() {
    if (!pagesContainerElement)
        return;
    ensureAiImageIndex();
    if (!aiImageIndex)
        return;
    const preservedMetas = new Map();
    aiImageIndex.querySelectorAll('.figure-meta').forEach(meta => {
        const key = meta.dataset.src || '';
        if (!preservedMetas.has(key)) {
            preservedMetas.set(key, []);
        }
        preservedMetas.get(key).push(meta);
    });
    aiImageIndex.innerHTML = '';
    const images = pagesContainerElement.querySelectorAll('.page-inner img');
    images.forEach(img => {
        const key = img.src || '';
        const candidates = preservedMetas.get(key);
        let meta = null;
        if (candidates && candidates.length) {
            meta = candidates.shift();
        }
        else {
            meta = document.createElement('div');
            meta.className = 'figure-meta';
            meta.dataset.src = img.src;
            meta.dataset.title = '';
            meta.dataset.caption = '';
            meta.dataset.tag = '';
        }
        meta.dataset.anchor = getClosestBlockId(img);
        if (!meta.dataset.src) {
            meta.dataset.src = img.src;
        }
        meta.dataset.title = meta.dataset.title || '';
        meta.dataset.caption = meta.dataset.caption || '';
        meta.dataset.tag = meta.dataset.tag || '';
        aiImageIndex.appendChild(meta);
    });
}
export function showImageContextMenu(event, img) {
    if (!imageContextMenuElement)
        return;
    contextTargetImage = img;
    closeImageSubmenu();
    const { clientX, clientY } = event;
    const { width, height } = imageContextMenuElement.getBoundingClientRect();
    const maxX = window.innerWidth - width - 8;
    const maxY = window.innerHeight - height - 8;
    const x = Math.max(8, Math.min(clientX, maxX));
    const y = Math.max(8, Math.min(clientY, maxY));
    imageContextMenuElement.style.left = `${x}px`;
    imageContextMenuElement.style.top = `${y}px`;
    imageContextMenuElement.classList.add('open');
}
export function closeImageSubmenu() {
    if (!imageContextDropdownElement)
        return;
    imageContextDropdownElement.classList.remove('open');
    if (imageContextTriggerElement) {
        imageContextTriggerElement.setAttribute('aria-expanded', 'false');
    }
}
export function closeImageContextMenu() {
    if (!imageContextMenuElement)
        return;
    imageContextMenuElement.classList.remove('open');
    closeImageSubmenu();
}
function openTitleDialog() {
    if (!imageTitleDialogElement || !contextTargetImage)
        return;
    const block = contextTargetImage.closest('p, h1, h2, h3, h4, h5, h6');
    if (!block)
        return;
    let existingTitle = '';
    // 修正: まず明示的な .figure-title 要素を探す
    const existingTitleSpan = block.querySelector('.figure-title');
    if (existingTitleSpan) {
        existingTitle = (existingTitleSpan.textContent || '').trim();
    }
    else {
        // 後方互換性: 古い構造（BRのあとに直書きテキストがある場合など）への対応
        let sibling = contextTargetImage.nextSibling;
        while (sibling && sibling.nodeType === Node.TEXT_NODE && (sibling.textContent || '').trim() === '') {
            sibling = sibling.nextSibling;
        }
        if (sibling && sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === 'BR') {
            const textNode = sibling.nextSibling;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                existingTitle = textNode.textContent || '';
            }
        }
    }
    if (imageTitleInputElement) {
        imageTitleInputElement.value = existingTitle;
        imageTitleInputElement.focus();
        imageTitleInputElement.select();
    }
    const figureTitleSpan = block.querySelector('.figure-title');
    const hasMiniTextInTitle = !!figureTitleSpan?.querySelector('.mini-text');
    const isBlockStyleMini = block.dataset.blockStyle === 'mini-p';
    const fontValue = (isBlockStyleMini || hasMiniTextInTitle) ? 'mini' : 'default';
    imageTitleFontRadios.forEach(radio => {
        radio.checked = radio.value === fontValue;
    });
    if (typeof imageTitleDialogElement.showModal === 'function') {
        imageTitleDialogElement.showModal();
    }
    else {
        imageTitleDialogElement.setAttribute('open', '');
    }
}
function closeTitleDialog() {
    if (!imageTitleDialogElement)
        return;
    if (typeof imageTitleDialogElement.close === 'function') {
        imageTitleDialogElement.close();
    }
    else {
        imageTitleDialogElement.removeAttribute('open');
    }
    if (imageTitleInputElement) {
        imageTitleInputElement.value = '';
    }
    contextTargetImage = null;
}
function removeExistingImageTitle(img) {
    if (!img)
        return;
    let next = img.nextSibling;
    while (next) {
        const toRemove = next;
        next = next.nextSibling;
        if (toRemove.nodeType === Node.TEXT_NODE && (toRemove.textContent || '').trim() === '') {
            toRemove.remove();
        }
        else if (toRemove.nodeType === Node.ELEMENT_NODE) {
            const element = toRemove;
            if (element.tagName === 'BR' ||
                element.classList.contains('caret-slot') ||
                element.classList.contains('figure-title')) {
                element.remove();
            }
            else {
                break;
            }
        }
        else {
            break;
        }
    }
}
// Phase 2 & 3 Migration: Paragraph Management & Image Insertion & Event Binding
export function renumberParagraphs() {
    const pagesContainer = document.getElementById('pages-container');
    if (!pagesContainer)
        return;
    const pages = pagesContainer.querySelectorAll('section.page');
    pages.forEach(page => {
        let pageNum = page.getAttribute('data-page');
        if (!pageNum) {
            pageNum = '1';
        }
        const inner = page.querySelector('.page-inner');
        if (!inner)
            return;
        // --- 修正: 段落が消失してしまった場合のリカバリ ---
        // 何も入力がない、あるいはすべて消してしまった場合にも、最低1つのPタグを保証する
        // バックスペース連打で最後の1行のタグまで消えると、以後入力できなくなるのを防ぐ
        if (!inner.querySelector('p, h1, h2, h3, h4, h5, h6')) {
            const p = document.createElement('p');
            p.innerHTML = '<br>'; // カーソルが入れるようにBRを入れる
            inner.appendChild(p);
        }
        // ------------------------------------------------
        let paraIndex = 1;
        // p と h1〜h6 のみ対象
        inner.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(block => {
            const el = block;
            // 過去バージョンの para-num/para-body を除去
            el.querySelectorAll('.para-num').forEach(span => span.remove());
            el.querySelectorAll('.para-body').forEach(body => {
                while (body.firstChild) {
                    el.insertBefore(body.firstChild, body);
                }
                body.remove();
            });
            // id と data-para を付与
            el.dataset.para = String(paraIndex);
            el.id = `p${pageNum}-${paraIndex}`;
            // block.dataset.blockStyle が設定済みならそれを尊重し、
            // 未設定の場合は mini-text span の有無で判断
            if (!el.dataset.blockStyle) {
                const hasMiniTextSpan = el.querySelector(':scope > .mini-text');
                el.dataset.blockStyle = hasMiniTextSpan ? 'mini-p' : el.tagName.toLowerCase();
            }
            paraIndex++;
        });
    });
    rebuildFigureMetaStore();
    window.syncToSource();
}
export function promptDropboxImageUrl() {
    const inputUrl = window.prompt('Dropbox画像の共有URLを貼り付けてください。');
    if (!inputUrl)
        return;
    let parsed;
    try {
        parsed = new URL(inputUrl);
    }
    catch (err) {
        alert('正しいURL形式を入力してください。');
        return;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname.includes('dropbox.com')) {
        alert('Dropboxドメインではありません。dropbox.com のURLを選択してください。');
        return;
    }
    parsed.searchParams.delete('dl');
    parsed.searchParams.set('raw', '1');
    const normalizedUrl = parsed.toString();
    insertImageAtCursor({
        src: normalizedUrl,
        alt: parsed.pathname.split('/').pop() || ''
    });
}
export function promptWebImageUrl() {
    const inputUrl = window.prompt('画像URLを貼り付けてください。');
    if (!inputUrl)
        return;
    let parsed;
    try {
        parsed = new URL(inputUrl);
    }
    catch (err) {
        alert('正しいURL形式を入力してください。');
        return;
    }
    insertImageAtCursor({
        src: parsed.toString(),
        alt: parsed.pathname.split('/').pop() || ''
    });
}
export function insertImageAtCursor({ src, alt }) {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    let range = selection && selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
    if (!range) {
        range = document.createRange();
        range.selectNodeContents(currentEditor);
        range.collapse(false);
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    // rangeがnullの場合の対策 (TypeScript用)
    if (!range)
        return;
    const block = findParagraph(range.startContainer);
    const isEmptyLine = block && isParagraphEmpty(block);
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || src;
    img.classList.add('img-m');
    const insertSlotAndPositionCaret = (container) => {
        const caretSlot = document.createElement('span');
        caretSlot.className = 'caret-slot';
        caretSlot.contentEditable = 'false';
        caretSlot.innerHTML = '&#8203;';
        const br = document.createElement('br');
        container.appendChild(caretSlot);
        container.appendChild(br);
        placeCaretBefore(caretSlot);
    };
    if (isEmptyLine && block) {
        block.innerHTML = '';
        const wrapper = ensureFigureWrapper(block);
        const container = wrapper || block;
        container.appendChild(img);
        insertSlotAndPositionCaret(container);
    }
    else {
        const newPara = document.createElement('p');
        if (block && block.parentNode) {
            block.parentNode.insertBefore(newPara, block.nextSibling);
        }
        else {
            currentEditor.appendChild(newPara);
        }
        const wrapper = ensureFigureWrapper(newPara);
        const container = wrapper || newPara;
        container.appendChild(img);
        insertSlotAndPositionCaret(container);
    }
    setActiveEditor(currentEditor);
    renumberParagraphs();
}
export function bindEditorEvents(inner) {
    if (inner.dataset.bound === '1')
        return;
    inner.dataset.bound = '1';
    if (!inner.dataset.preferredBlockTag) {
        inner.dataset.preferredBlockTag = 'p';
    }
    inner.addEventListener('input', (e) => {
        const inputEvent = e;
        if (inputEvent && inputEvent.inputType === 'insertParagraph') {
            applyPendingBlockTag(inner);
            renumberParagraphs();
        }
        else {
            window.syncToSource();
        }
    });
    // existing definition in index.html used a timeout for updateToolbarState
    // function updateToolbarState() is likely still in index.html (Phase 4 target),
    // but we can try to call it via window if it exists, or migrate it now.
    // For safety in this "Mixed" phase, we will assume it might be on window or we need to migrate it.
    // Let's migrate updateToolbarState briefly here to ensure dependency.
    const updateStateWithDelay = () => setTimeout(updateToolbarState, 50);
    inner.addEventListener('focus', () => {
        setActiveEditor(inner);
        saveTextSelectionFromEditor();
        updateToolbarState();
    });
    inner.addEventListener('mousedown', () => setActiveEditor(inner));
    inner.addEventListener('mouseup', () => {
        saveTextSelectionFromEditor();
        updateStateWithDelay();
    });
    inner.addEventListener('keyup', (e) => {
        saveTextSelectionFromEditor();
        updateStateWithDelay();
    });
    inner.addEventListener('click', updateStateWithDelay);
    // Caret slot logic
    inner.addEventListener('click', (event) => {
        const target = event.target;
        const figureWrapper = target.closest('.figure-inline');
        if (figureWrapper && target.tagName !== 'IMG') {
            event.preventDefault();
            const caretSlot = figureWrapper.querySelector('.caret-slot');
            if (caretSlot) {
                placeCaretBefore(caretSlot);
            }
        }
    }, true); // Use capture phase
    inner.addEventListener('keydown', (e) => {
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount)
            return;
        const range = selection.getRangeAt(0);
        const isCollapsed = range.collapsed;
        // isCaretBeforeCaretSlotの判定ロジック
        const nodeAfterCaret = isCollapsed ? range.startContainer.childNodes[range.startOffset] : null;
        const isBeforeSlot = nodeAfterCaret && nodeAfterCaret.nodeType === Node.ELEMENT_NODE && nodeAfterCaret.classList.contains('caret-slot');
        if (isBeforeSlot) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const currentParagraph = nodeAfterCaret.closest('p, h1, h2, h3, h4, h5, h6');
                if (currentParagraph && currentParagraph.parentNode) {
                    const newPara = document.createElement('p');
                    newPara.innerHTML = '<br>';
                    currentParagraph.parentNode.insertBefore(newPara, currentParagraph.nextSibling);
                    const newRange = document.createRange();
                    newRange.setStart(newPara, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    renumberParagraphs();
                }
                return;
            }
            else if (e.key === 'Backspace') {
                e.preventDefault();
                const currentParagraph = nodeAfterCaret.closest('p, h1, h2, h3, h4, h5, h6');
                if (currentParagraph) {
                    const prevElement = currentParagraph.previousElementSibling;
                    currentParagraph.remove();
                    if (prevElement) {
                        placeCaretAfter(prevElement);
                    }
                    renumberParagraphs();
                }
                return;
            }
        }
        if (e.key === 'Enter') {
            const current = getCurrentParagraph();
            const candidate = current
                ? (current.dataset.blockStyle || current.tagName.toLowerCase())
                : (inner.dataset.preferredBlockTag || 'p');
            inner.dataset.pendingBlockTag = candidate;
        }
        else if (e.key === 'Tab') {
            e.preventDefault();
            handleInlineTabKey();
        }
        else if (e.key === 'Backspace') {
            // --- 修正: 最後の1段落を消させない処理 ---
            // 現在のページ内のブロック要素（p, h1-h6）を取得
            const blocks = inner.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
            if (blocks.length === 1) {
                const block = blocks[0];
                // カーソルがそのブロックの先頭にあるかどうかを確認
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    // 選択範囲が潰れていて(collapsed)、かつ始点がブロックの先頭(offset 0)の場合
                    // または、ブロックが空の場合
                    if (range.collapsed && range.startOffset === 0) {
                        // さらに厳密に、ブロックが空（またはBRのみ）なら削除禁止
                        // 「テキストの途中でのバックスペース」は許可するが、「段落そのものを消すバックスペース」は禁止する
                        e.preventDefault();
                        return;
                    }
                }
            }
            // ------------------------------------------
            if (handleInlineTabBackspace()) {
                e.preventDefault();
            }
        }
    });
}
// Helper: updateToolbarState (Migrated to support bindEditorEvents)
export function updateToolbarState() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const paragraph = getCurrentParagraph();
    const toolbar = document.getElementById('toolbar');
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
// Helper: applyPendingBlockTag (Migrated since used in bindEditorEvents)
export function applyPendingBlockTag(inner) {
    const pendingTag = inner.dataset.pendingBlockTag || inner.dataset.preferredBlockTag || 'p';
    if (!pendingTag)
        return;
    const current = getCurrentParagraph();
    if (!current)
        return;
    convertParagraphToTag(current, pendingTag);
    inner.dataset.pendingBlockTag = '';
}
// Global Assignments
window.renumberParagraphs = renumberParagraphs;
window.bindEditorEvents = bindEditorEvents;
window.promptDropboxImageUrl = promptDropboxImageUrl;
window.promptWebImageUrl = promptWebImageUrl;
window.insertImageAtCursor = insertImageAtCursor;
window.updateToolbarState = updateToolbarState;
window.applyPendingBlockTag = applyPendingBlockTag;
window.toggleHangingIndent = toggleHangingIndent;
window.toggleHighlightPalette = toggleHighlightPalette;
window.applyColorHighlight = applyColorHighlight;
window.removeHighlightsInRange = removeHighlightsInRange;
window.resetHighlightsInSelection = resetHighlightsInSelection;
window.setHighlightPaletteOpen = setHighlightPaletteOpen;
window.changeIndent = changeIndent;
window.setPagesHTML = setPagesHTML;
window.importFullHTMLText = importFullHTMLText;
window.handleOpenFile = handleOpenFile;
window.openWithFilePicker = openWithFilePicker;
window.overwriteCurrentFile = overwriteCurrentFile;
window.buildFullHTML = buildFullHTML;
window.saveFullHTML = saveFullHTML;
function updateImageMetaTitle(img, rawTitle) {
    if (!img)
        return;
    ensureAiImageIndex();
    if (!aiImageIndex)
        return;
    let meta = Array.from(aiImageIndex.querySelectorAll('.figure-meta')).find(m => m.dataset.src === img.src);
    if (!meta) {
        rebuildFigureMetaStore();
        meta = Array.from(aiImageIndex.querySelectorAll('.figure-meta')).find(m => m.dataset.src === img.src);
    }
    if (meta) {
        meta.dataset.title = rawTitle || '';
    }
}
export function applyImageTitle() {
    if (!contextTargetImage)
        return;
    const rawTitle = imageTitleInputElement ? imageTitleInputElement.value : '';
    const fontRadio = imageTitleFontRadios.find(radio => radio.checked);
    const fontSize = fontRadio ? fontRadio.value : 'default';
    const block = contextTargetImage.closest('p, h1, h2, h3, h4, h5, h6');
    if (!block)
        return;
    const paragraph = block.tagName.toLowerCase() === 'p'
        ? block
        : convertParagraphToTag(block, 'p');
    if (!paragraph)
        return;
    const isMini = fontSize === 'mini';
    paragraph.dataset.blockStyle = isMini ? 'mini-p' : 'p';
    const wrapper = ensureFigureWrapper(paragraph);
    removeExistingImageTitle(contextTargetImage);
    if (rawTitle) {
        const br = document.createElement('br');
        const caretSlot = document.createElement('span');
        caretSlot.className = 'caret-slot';
        caretSlot.contentEditable = 'false';
        caretSlot.innerHTML = '&#8203;';
        let titleContent;
        if (isMini) {
            const miniSpan = document.createElement('span');
            miniSpan.className = 'mini-text';
            miniSpan.style.fontSize = '8pt';
            miniSpan.textContent = rawTitle;
            titleContent = miniSpan;
        }
        else {
            titleContent = document.createTextNode(rawTitle);
        }
        const titleSpan = document.createElement('span');
        titleSpan.className = 'figure-title';
        titleSpan.contentEditable = 'false';
        titleSpan.appendChild(titleContent);
        const container = wrapper || paragraph;
        container.appendChild(caretSlot);
        container.appendChild(br);
        container.appendChild(titleSpan);
    }
    updateImageMetaTitle(contextTargetImage, rawTitle);
    syncToSource();
}
function initImageContextMenuControls() {
    document.addEventListener('contextmenu', (event) => {
        const target = event.target;
        const img = target?.closest('img');
        if (img && pagesContainerElement && pagesContainerElement.contains(img)) {
            event.preventDefault();
            event.stopPropagation();
            showImageContextMenu(event, img);
            return;
        }
        closeImageContextMenu();
    });
    if (imageContextTriggerElement) {
        imageContextTriggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!imageContextDropdownElement)
                return;
            const willOpen = !imageContextDropdownElement.classList.contains('open');
            imageContextDropdownElement.classList.toggle('open', willOpen);
            imageContextTriggerElement.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });
    }
    if (imageContextMenuElement) {
        imageContextMenuElement.addEventListener('click', (event) => {
            const btn = event.target.closest('button[data-action]');
            if (!btn)
                return;
            event.stopPropagation();
            const action = btn.dataset.action;
            if (action === 'image-size') {
                const size = btn.dataset.size;
                applyImageSize(contextTargetImage, size);
                closeImageContextMenu();
                contextTargetImage = null;
                return;
            }
            if (action === 'image-title') {
                closeImageContextMenu();
                openTitleDialog();
                return;
            }
            closeImageContextMenu();
            contextTargetImage = null;
        });
    }
    if (imageTitleApplyButtonElement) {
        imageTitleApplyButtonElement.addEventListener('click', (event) => {
            event.preventDefault();
            applyImageTitle();
            closeTitleDialog();
        });
    }
    if (imageTitleCancelButtonElement) {
        imageTitleCancelButtonElement.addEventListener('click', (event) => {
            event.preventDefault();
            closeTitleDialog();
        });
    }
    if (imageTitleDialogElement) {
        imageTitleDialogElement.addEventListener('cancel', (event) => {
            event.preventDefault();
            closeTitleDialog();
        });
    }
    window.addEventListener('resize', closeImageContextMenu);
    window.addEventListener('blur', closeImageContextMenu);
}
function initPageLinkHandler() {
    if (!pagesContainerElement)
        return;
    pagesContainerElement.addEventListener('click', (event) => {
        const target = event.target;
        const link = target?.closest('a');
        if (!link || !link.href)
            return;
        if (!target?.closest('[contenteditable="true"]'))
            return;
        event.preventDefault();
        const href = link.getAttribute('href') ?? '';
        if (href.startsWith('#')) {
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }
        window.open(link.href, '_blank', 'noopener,noreferrer');
    });
}
function initFontChooserControls() {
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
    // Font Family Options
    const fontButtons = document.querySelectorAll('.font-family-option');
    fontButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const family = btn.dataset.family;
            if (family) {
                applyFontFamily(family);
                closeFontMenu();
            }
        });
    });
}
export function updateMarginButtonState(activeSize) {
    if (!toolbarElement)
        return;
    const buttons = toolbarElement.querySelectorAll('button[data-action="page-margin"]');
    buttons.forEach(btn => {
        btn.setAttribute('aria-pressed', btn.dataset.size === activeSize ? 'true' : 'false');
    });
}
export function closeAllParagraphSubmenus() {
    if (!paragraphChooserElement)
        return;
    paragraphChooserElement.querySelectorAll('.paragraph-submenu').forEach(submenu => {
        submenu.classList.remove('is-open');
        const trigger = submenu.querySelector('.paragraph-submenu-trigger');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    });
}
export function setParagraphMenuOpen(open) {
    if (!paragraphChooserElement)
        return;
    paragraphChooserElement.classList.toggle('is-open', open);
    if (paragraphTriggerElement) {
        paragraphTriggerElement.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (!open) {
        closeAllParagraphSubmenus();
    }
}
export function toggleParagraphMenu() {
    if (!paragraphChooserElement)
        return;
    const willOpen = !paragraphChooserElement.classList.contains('is-open');
    setParagraphMenuOpen(willOpen);
}
export function closeParagraphMenu() {
    setParagraphMenuOpen(false);
}
const lineHeightSizes = ['s', 'm', 'l'];
const isLineHeightSize = (value) => !!value && lineHeightSizes.includes(value);
export function syncToSource() {
    if (!pagesContainerElement || !sourceElement)
        return;
    sourceElement.value = pagesContainerElement.innerHTML;
}
export function applyLineHeight(size) {
    if (!isLineHeightSize(size) || !pagesContainerElement)
        return;
    const inners = pagesContainerElement.querySelectorAll('.page-inner');
    inners.forEach(inner => {
        lineHeightSizes.forEach(sz => inner.classList.remove(`line-height-${sz}`));
        if (size !== 'm') {
            inner.classList.add(`line-height-${size}`);
        }
    });
    syncToSource();
}
export function applyParagraphAlignment(direction) {
    if (!direction)
        return;
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    if (!currentEditor.contains(range.commonAncestorContainer))
        return;
    const selectors = 'p, h1, h2, h3, h4, h5, h6';
    const paragraphs = Array.from(currentEditor.querySelectorAll(selectors)).filter(paragraph => {
        return range.intersectsNode(paragraph);
    });
    if (!paragraphs.length)
        return;
    paragraphs.forEach(paragraph => {
        const wrapper = ensureParagraphWrapper(paragraph);
        if (!wrapper)
            return;
        alignDirections.forEach(dir => {
            wrapper.classList.remove(`inline-align-${dir}`);
        });
        if (wrapper.classList.contains('figure-inline')) {
            wrapper.classList.add('inline-align-center');
        }
        else {
            wrapper.classList.add(`inline-align-${direction}`);
        }
    });
    window.syncToSource();
}
export function getParagraphsInRange(range) {
    const currentEditor = window.currentEditor;
    if (!currentEditor || !range)
        return [];
    const selectors = 'p, h1, h2, h3, h4, h5, h6';
    return Array.from(currentEditor.querySelectorAll(selectors)).filter(paragraph => {
        return range.intersectsNode(paragraph);
    });
}
function clearParagraphSpacingClasses(target) {
    if (!target)
        return;
    paragraphSpacingSizes.forEach(sz => {
        target.classList.remove(`inline-spacing-${sz}`);
    });
}
export function applyParagraphSpacing(size) {
    if (!isParagraphSpacingSize(size))
        return;
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    if (!currentEditor.contains(range.commonAncestorContainer))
        return;
    const paragraphs = getParagraphsInRange(range);
    if (!paragraphs.length)
        return;
    paragraphs.forEach(paragraph => {
        const wrapper = ensureParagraphWrapper(paragraph);
        clearParagraphSpacingClasses(paragraph);
        clearParagraphSpacingClasses(wrapper);
        if (size !== 's') {
            paragraph.classList.add(`inline-spacing-${size}`);
            if (wrapper)
                wrapper.classList.add(`inline-spacing-${size}`);
        }
    });
    window.syncToSource();
}
export function toggleBold() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand('bold', false, undefined);
    normalizeInlineFormatting();
    syncToSource();
}
export function toggleItalic() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand('italic', false, undefined);
    normalizeInlineFormatting();
    syncToSource();
}
export function toggleUnderline() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand('underline', false, undefined);
    normalizeInlineFormatting();
    syncToSource();
}
export function toggleStrikeThrough() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand('strikeThrough', false, undefined);
    normalizeInlineFormatting();
    syncToSource();
}
export function applyInlineScript(command) {
    if (!command)
        return;
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    currentEditor.focus();
    document.execCommand(command, false, undefined);
    syncToSource();
}
export function toggleSuperscript() {
    applyInlineScript('superscript');
}
export function toggleSubscript() {
    applyInlineScript('subscript');
}
export function normalizeInlineFormatting() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    replaceInlineTag(currentEditor, 'strong', 'b');
    replaceInlineTag(currentEditor, 'em', 'i');
    replaceInlineTag(currentEditor, 'strike', 's');
    replaceInlineTag(currentEditor, 'del', 's');
}
function replaceInlineTag(currentEditor, from, to) {
    const nodes = currentEditor.querySelectorAll(from);
    nodes.forEach(node => {
        const replacement = document.createElement(to);
        Array.from(node.attributes).forEach(attr => {
            replacement.setAttribute(attr.name, attr.value);
        });
        while (node.firstChild) {
            replacement.appendChild(node.firstChild);
        }
        const parent = node.parentNode;
        if (!parent)
            return;
        parent.replaceChild(replacement, node);
    });
}
export function getCaretOffset(range) {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return 0;
    const rects = range.getClientRects();
    const editorRect = currentEditor.getBoundingClientRect();
    const rect = rects.length ? rects[0] : range.getBoundingClientRect();
    if (!rect || (rect.left === 0 && rect.width === 0 && rect.height === 0)) {
        return 0;
    }
    const offset = rect.left - editorRect.left + currentEditor.scrollLeft;
    if (!Number.isFinite(offset))
        return 0;
    return Math.max(0, offset);
}
export function insertInlineTabAt(range, width) {
    if (!width || width <= 0)
        return false;
    const span = document.createElement('span');
    span.className = 'inline-tab';
    span.setAttribute('aria-hidden', 'true');
    span.style.width = `${width}px`;
    const insertionRange = range.cloneRange();
    insertionRange.collapse(true);
    insertionRange.insertNode(span);
    const newRange = document.createRange();
    newRange.setStartAfter(span);
    newRange.collapse(true);
    const selection = window.getSelection();
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);
    }
    return true;
}
export function handleInlineTabKey() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return false;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return false;
    const range = selection.getRangeAt(0);
    if (!currentEditor.contains(range.commonAncestorContainer))
        return false;
    if (!range.collapsed) {
        range.collapse(false);
    }
    const step = INDENT_STEP_PX;
    const caretX = getCaretOffset(range);
    const currentStep = Math.floor(caretX / step);
    const target = (currentStep + 1) * step;
    let delta = target - caretX;
    if (delta < 0.5) {
        delta = step;
    }
    if (delta <= 0)
        return false;
    const inserted = insertInlineTabAt(range, delta);
    if (inserted) {
        window.syncToSource();
    }
    return inserted;
}
function getInlineTabNodeBefore(range) {
    let container = range.startContainer;
    let offset = range.startOffset;
    if (container && container.nodeType === Node.TEXT_NODE) {
        if (offset > 0)
            return null;
        container = container.previousSibling;
    }
    else if (container) {
        if (offset > 0) {
            container = container.childNodes[offset - 1];
        }
        else {
            container = container.previousSibling;
        }
    }
    if (container &&
        container.nodeType === 1 &&
        container.classList &&
        container.classList.contains('inline-tab')) {
        return container;
    }
    return null;
}
export function handleInlineTabBackspace() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return false;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return false;
    const range = selection.getRangeAt(0);
    if (!currentEditor.contains(range.commonAncestorContainer))
        return false;
    if (!range.collapsed)
        return false;
    const inlineTab = getInlineTabNodeBefore(range);
    if (!inlineTab)
        return false;
    const newRange = document.createRange();
    newRange.setStartBefore(inlineTab);
    newRange.collapse(true);
    inlineTab.parentNode?.removeChild(inlineTab);
    selection.removeAllRanges();
    selection.addRange(newRange);
    window.syncToSource();
    return true;
}
export function setHighlightPaletteOpen(open) {
    if (!highlightControlElement || !highlightButtonElement)
        return;
    highlightControlElement.classList.toggle('is-open', open);
    highlightButtonElement.setAttribute('aria-expanded', open ? 'true' : 'false');
}
export function toggleHighlightPalette() {
    if (!highlightControlElement)
        return;
    setHighlightPaletteOpen(!highlightControlElement.classList.contains('is-open'));
}
function unwrapColorSpan(span) {
    if (!span)
        return;
    const parent = span.parentNode;
    if (!parent)
        return;
    while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
    }
    parent.removeChild(span);
}
function getAncestorHighlight(node) {
    let curr = node;
    const editor = window.currentEditor;
    while (curr && curr !== editor && curr !== document.body) {
        if (curr.nodeType === Node.ELEMENT_NODE) {
            const el = curr;
            if (el.classList.contains('inline-highlight') ||
                el.classList.contains('inline-color') ||
                el.style.backgroundColor ||
                el.style.color) {
                return el;
            }
        }
        curr = curr.parentNode;
    }
    return null;
}
/**
 * Helper to remove color/highlight spans from a fragment/node recursively
 * but keep their text content.
 */
function removeColorSpansInNode(root) {
    if (root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE && root.nodeType !== Node.ELEMENT_NODE)
        return;
    const parent = root;
    const spans = Array.from(parent.querySelectorAll('.inline-highlight, .inline-color, span[style*="background-color"], span[style*="color"]'));
    spans.forEach(span => {
        // 該当クラスまたはスタイルを持つ場合のみ Unwrap
        const el = span;
        if (el.classList.contains('inline-highlight') ||
            el.classList.contains('inline-color') ||
            el.style.backgroundColor ||
            el.style.color) {
            unwrapColorSpan(el);
        }
    });
}
export function removeHighlightsInRange(range) {
    if (!range)
        return false;
    // 1. 範囲がハイライト要素の内側にある場合、親を分割して「裸」にする必要がある
    const ancestor = getAncestorHighlight(range.commonAncestorContainer);
    if (ancestor) {
        // 親がいる場合は親を剥がす
        unwrapColorSpan(ancestor);
        // unwrapするとDOM構造が変わるので、rangeの再取得が必要になるケースがあるが、
        // ここでは単純に「解除した」としてtrueを返す
        // (完全に正確な範囲復元は複雑だが、今回の要件では「掃除」ができればよい)
        return true;
    }
    // 2. 範囲内のハイライト要素を除去
    const clone = range.cloneContents();
    const spans = clone.querySelectorAll('.inline-highlight, .inline-color, span[style*="background-color"], span[style*="color"]');
    if (spans.length > 0) {
        const fragment = range.extractContents();
        removeColorSpansInNode(fragment); // Use the new helper
        range.insertNode(fragment);
        return true;
    }
    return false;
}
export function resetHighlightsInSelection() {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    // 1. 範囲がハイライト要素の内側にある場合（＝完全に選択している場合など）
    //    親のハイライトを解除し、かつ選択範囲を維持する
    const ancestor = getAncestorHighlight(range.commonAncestorContainer);
    if (ancestor) {
        const first = ancestor.firstChild;
        const last = ancestor.lastChild;
        // 親を解除
        unwrapColorSpan(ancestor);
        // 選択範囲を復元（解除された中身を選択し直す）
        if (first && last) {
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.setStartBefore(first);
            newRange.setEndAfter(last);
            selection.addRange(newRange);
        }
        window.syncToSource();
        return;
    }
    // 2. 部分的な選択や、複数のハイライトを含む場合
    //    範囲内のDOMを抽出して掃除する
    const fragment = range.extractContents();
    // 抽出後のフラグメント内のハイライトを除去
    removeColorSpansInNode(fragment);
    // 挿入後の参照用に最初と最後のノードを確保
    const first = fragment.firstChild;
    const last = fragment.lastChild;
    // 元の位置に挿入
    range.insertNode(fragment);
    // 3. 選択範囲の復元
    //    挿入された範囲全体を再度選択する
    if (first && last) {
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartBefore(first);
        newRange.setEndAfter(last);
        selection.addRange(newRange);
    }
    window.syncToSource();
}
export function applyColorHighlight(color) {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    if (!currentEditor.contains(range.commonAncestorContainer))
        return;
    // 1. 範囲内のDOMを抽出（自動的に境界で分割される）
    //    extractContents() は、選択範囲がタグをまたぐ場合、タグを複製して
    //    「選択された部分」だけを含むFragmentを生成し、元のDOMからはその部分を除去する。
    //    また、元のDOMに残る部分（選択範囲外）はそのまま残る。
    //    これがまさに「分割して適用」の動作そのもの。
    const fragment = range.extractContents();
    // 2. 抽出した部分から、既存のハイライトタグを除去（掃除）
    //    これにより「二重タグ」を防ぐ。
    removeColorSpansInNode(fragment);
    // 3. 新しいタグで包む
    //    colorがnullなら包まずに戻すだけ（解除）
    let nodeToInsert = fragment;
    let newSpan = null;
    if (color) {
        newSpan = document.createElement('span');
        newSpan.className = 'inline-highlight';
        newSpan.style.backgroundColor = color;
        newSpan.appendChild(fragment);
        nodeToInsert = newSpan;
    }
    // 4. 元の位置に挿入
    range.insertNode(nodeToInsert);
    // 5. 選択範囲の復元
    //    挿入したノード（またはFragmentの中身）を再度選択する
    selection.removeAllRanges();
    const newRange = document.createRange();
    if (newSpan) {
        newRange.selectNode(newSpan);
    }
    else {
        // 解除の場合は nodeToInsert は Fragment なので、挿入後の実体ノードを選択する必要があるが、
        // Fragment挿入後はFragment自体は空になるため、挿入位置を特定するのが難しい。
        // そのため、insertNodeの前に位置をマーキングするか、あるいは単純にカーソルを置く。
        // 今回は「変更した部分を選択維持」したい要望があるので、
        // insertNodeした直後のRange状態（通常は挿入物の直後）ではなく、包含するようにしたい。
        // 簡易的に newRange.selectNode(nodeToInsert) はできない（Fragmentだから）。
        // 代案: 挿入前に空のSpan（マーカー）を前後に入れておき、その間を選択する等のハックが必要。
        // ここではcolorがある場合（通常フロー）を優先し、解除時は一旦カーソルのみ復帰とする（複雑化回避）
        newRange.setStartAfter(nodeToInsert); // 仮
        newRange.collapse(true);
    }
    selection.addRange(newRange);
    currentEditor.focus(); // フォーカスを戻す
    window.syncToSource();
}
export function applyFontColor(color) {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    if (!currentEditor.contains(range.commonAncestorContainer))
        return;
    // 1. Extract (Split implicitly)
    const fragment = range.extractContents();
    // 2. Clean existing fonts
    removeColorSpansInNode(fragment);
    // 3. Wrap new
    let nodeToInsert = fragment;
    let newSpan = null;
    if (color) {
        newSpan = document.createElement('span');
        newSpan.className = 'inline-color';
        newSpan.style.color = color;
        newSpan.appendChild(fragment);
        nodeToInsert = newSpan;
    }
    // 4. Insert
    range.insertNode(nodeToInsert);
    // 5. Reselect
    selection.removeAllRanges();
    const newRange = document.createRange();
    if (newSpan) {
        newRange.selectNode(newSpan);
    }
    else {
        newRange.setStartAfter(nodeToInsert);
        newRange.collapse(true);
    }
    selection.addRange(newRange);
    currentEditor.focus();
    window.syncToSource();
}
export function resetFontColorInSelection() {
    const currentEditor = window.currentEditor;
    if (!currentEditor)
        return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount)
        return;
    const range = selection.getRangeAt(0);
    if (range.collapsed)
        return;
    if (!currentEditor.contains(range.commonAncestorContainer))
        return;
    const spans = Array.from(currentEditor.querySelectorAll('.inline-color'));
    let removed = false;
    spans.forEach(span => {
        if (range.intersectsNode(span)) {
            unwrapColorSpan(span);
            removed = true;
        }
    });
    if (!removed)
        return;
    const normalized = range.cloneRange();
    selection.removeAllRanges();
    selection.addRange(normalized);
    syncToSource();
}
export function closeAllFontSubmenus() {
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
export function setFontMenuOpen(open) {
    if (!fontChooserElement)
        return;
    fontChooserElement.classList.toggle('is-open', open);
    if (fontChooserTriggerElement) {
        fontChooserTriggerElement.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    if (!open) {
        closeAllFontSubmenus();
    }
}
export function toggleFontMenu() {
    if (!fontChooserElement)
        return;
    setFontMenuOpen(!fontChooserElement.classList.contains('is-open'));
}
export function closeFontMenu() {
    setFontMenuOpen(false);
}
export function closeFontSubmenu(type) {
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
export function applyBlockElement(tag) {
    if (!tag)
        return;
    const current = getCurrentParagraph();
    if (current) {
        convertParagraphToTag(current, tag);
        renumberParagraphs();
        window.syncToSource();
    }
}
window.findParagraphWrapper = findParagraphWrapper;
window.applyBlockElement = applyBlockElement;
window.ensureParagraphWrapper = ensureParagraphWrapper;
window.ensureFigureWrapper = ensureFigureWrapper;
window.convertParagraphToTag = convertParagraphToTag;
window.generateBookmarkId = generateBookmarkId;
window.addLinkDestination = addLinkDestination;
window.createLink = createLink;
window.removeLink = removeLink;
window.updateMarginRule = updateMarginRule;
window.updateMarginButtonState = updateMarginButtonState;
window.applyPageMargin = applyPageMargin;
window.applyFontFamily = applyFontFamily;
window.alignDirections = alignDirections;
window.applyParagraphAlignment = applyParagraphAlignment;
window.getParagraphsInRange = getParagraphsInRange;
window.applyParagraphSpacing = applyParagraphSpacing;
window.closeAllFontSubmenus = closeAllFontSubmenus;
window.setFontMenuOpen = setFontMenuOpen;
window.toggleFontMenu = toggleFontMenu;
window.closeFontMenu = closeFontMenu;
window.closeFontSubmenu = closeFontSubmenu;
window.closeAllParagraphSubmenus = closeAllParagraphSubmenus;
window.setParagraphMenuOpen = setParagraphMenuOpen;
window.toggleParagraphMenu = toggleParagraphMenu;
window.closeParagraphMenu = closeParagraphMenu;
window.getCaretOffset = getCaretOffset;
window.insertInlineTabAt = insertInlineTabAt;
window.handleInlineTabKey = handleInlineTabKey;
window.handleInlineTabBackspace = handleInlineTabBackspace;
window.setHighlightPaletteOpen = setHighlightPaletteOpen;
window.toggleHighlightPalette = toggleHighlightPalette;
window.applyColorHighlight = applyColorHighlight;
window.applyFontColor = applyFontColor;
window.syncToSource = syncToSource;
window.applyLineHeight = applyLineHeight;
window.toggleFileDropdown = toggleFileDropdown;
window.closeNestedDropdown = closeNestedDropdown;
window.closeFileDropdown = closeFileDropdown;
window.toggleBold = toggleBold;
window.toggleItalic = toggleItalic;
window.toggleUnderline = toggleUnderline;
window.toggleStrikeThrough = toggleStrikeThrough;
window.applyInlineScript = applyInlineScript;
window.toggleSuperscript = toggleSuperscript;
window.toggleSubscript = toggleSubscript;
window.resetFontColorInSelection = resetFontColorInSelection;
window.isRangeInsideCurrentEditor = isRangeInsideCurrentEditor;
window.saveTextSelectionFromEditor = saveTextSelectionFromEditor;
window.getEffectiveTextRange = getEffectiveTextRange;
window.compareParagraphOrder = compareParagraphOrder;
window.calculateOffsetWithinNode = calculateOffsetWithinNode;
window.computeSelectionStateFromRange = computeSelectionStateFromRange;
window.findTextPositionInParagraph = findTextPositionInParagraph;
window.restoreRangeFromSelectionState = restoreRangeFromSelectionState;
window.findParagraph = findParagraph;
window.applyImageSize = applyImageSize;
window.ensureAiImageIndex = ensureAiImageIndex;
window.rebuildFigureMetaStore = rebuildFigureMetaStore;
window.getClosestBlockId = getClosestBlockId;
window.showImageContextMenu = showImageContextMenu;
window.closeImageContextMenu = closeImageContextMenu;
window.closeImageSubmenu = closeImageSubmenu;
window.openTitleDialog = openTitleDialog;
window.closeTitleDialog = closeTitleDialog;
window.applyImageTitle = applyImageTitle;
window.removeExistingImageTitle = removeExistingImageTitle;
window.updateImageMetaTitle = updateImageMetaTitle;
function createPage(pageNumber, contentHTML) {
    const section = document.createElement('section');
    section.className = 'page';
    section.dataset.page = String(pageNumber);
    const inner = document.createElement('div');
    inner.className = 'page-inner';
    inner.contentEditable = 'true';
    inner.innerHTML = contentHTML || '<p>ここに本文を書く</p>';
    section.appendChild(inner);
    return section;
}
function renumberPages() {
    if (!pagesContainerElement)
        return;
    const pages = pagesContainerElement.querySelectorAll('section.page');
    pages.forEach((page, idx) => {
        page.dataset.page = String(idx + 1);
    });
}
function addPage() {
    if (!pagesContainerElement)
        return;
    const pages = Array.from(pagesContainerElement.querySelectorAll('section.page'));
    const newPage = createPage(pages.length + 1, '<p>ここに本文を書く</p>');
    const currentEditor = window.currentEditor;
    if (currentEditor) {
        const currentPage = currentEditor.closest('section.page');
        const currentIndex = currentPage ? pages.indexOf(currentPage) : -1;
        if (currentPage && currentIndex >= 0 && currentIndex < pages.length - 1) {
            const referencePage = pages[currentIndex + 1];
            const insertBeforeNode = referencePage ? referencePage.nextSibling : null;
            pagesContainerElement.insertBefore(newPage, insertBeforeNode);
        }
        else {
            pagesContainerElement.appendChild(newPage);
        }
    }
    else {
        pagesContainerElement.appendChild(newPage);
    }
    const newInner = newPage.querySelector('.page-inner');
    renumberPages();
    window.renumberParagraphs?.();
    initPages();
    if (newInner) {
        window.setActiveEditor?.(newInner);
    }
    ensureAiImageIndex();
}
function removePage() {
    if (!pagesContainerElement)
        return;
    const pages = Array.from(pagesContainerElement.querySelectorAll('section.page'));
    if (pages.length === 0)
        return;
    let currentEditor = window.currentEditor;
    if (!currentEditor) {
        const fallback = pages[pages.length - 1].querySelector('.page-inner');
        currentEditor = fallback;
    }
    if (!currentEditor)
        return;
    const currentPage = currentEditor.closest('section.page');
    if (!currentPage)
        return;
    const currentIndex = pages.indexOf(currentPage);
    if (pages.length === 1) {
        const inner = pages[0].querySelector('.page-inner');
        if (inner) {
            inner.innerHTML = '<p>ここに本文を書く</p>';
            window.setActiveEditor?.(inner);
            window.renumberParagraphs?.();
        }
        return;
    }
    pagesContainerElement.removeChild(currentPage);
    const newInners = pagesContainerElement.querySelectorAll('.page-inner');
    const newIdx = Math.max(0, currentIndex - 1);
    const newInner = newInners[newIdx] || newInners[0] || null;
    if (newInner) {
        window.setActiveEditor?.(newInner);
    }
    renumberPages();
    window.renumberParagraphs?.();
    ensureAiImageIndex();
}
function initPages() {
    if (!pagesContainerElement)
        return;
    const inners = pagesContainerElement.querySelectorAll('.page-inner');
    inners.forEach(inner => {
        window.bindEditorEvents?.(inner);
    });
    if (!window.currentEditor && inners[0]) {
        window.setActiveEditor?.(inners[0]);
    }
}
window.createPage = createPage;
window.renumberPages = renumberPages;
window.addPage = addPage;
window.removePage = removePage;
window.initPages = initPages;
function bindParagraphMenuListeners() {
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
}
function bindDocumentLevelHandlers() {
    document.addEventListener('mousedown', (event) => {
        const target = event.target;
        const tab = target?.closest('.inline-tab');
        if (!tab)
            return;
        event.preventDefault();
        const rect = tab.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        if (event.clientX < midpoint) {
            window.placeCaretBefore?.(tab);
        }
        else {
            window.placeCaretAfter?.(tab);
        }
    });
    document.addEventListener('click', (event) => {
        const target = event.target;
        const clickedEditor = Boolean(target?.closest('.page-inner'));
        if (clickedEditor) {
            const fileMenu = document.querySelector('.file-menu');
            if (fileMenu && target && !fileMenu.contains(target)) {
                closeFileDropdown();
            }
            if (paragraphChooserElement && target && !paragraphChooserElement.contains(target)) {
                closeParagraphMenu();
            }
            if (fontChooserElement && target && !fontChooserElement.contains(target)) {
                closeFontMenu();
            }
        }
        closeImageContextMenu();
        if (highlightControlElement && target && !highlightControlElement.contains(target)) {
            setHighlightPaletteOpen(false);
        }
    });
}
function bindToolbarHandlers() {
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
            const action = inputTarget.dataset.action;
            if (action === 'hanging-indent') {
                window.toggleHangingIndent?.(inputTarget.checked);
            }
            return;
        }
        const btn = event.target?.closest('button');
        if (!btn)
            return;
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
                window.resetHighlightsInSelection?.();
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
                window.applyBlockElement?.(btn.dataset.tag ?? null);
                break;
            case 'indent':
                window.changeIndent?.(1);
                syncToSource();
                break;
            case 'outdent':
                window.changeIndent?.(-1);
                syncToSource();
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
                    applyPageMargin(btn.dataset.size);
                }
                break;
            case 'overwrite':
                await window.overwriteCurrentFile?.();
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
// index.html からインポートされるため、再度エクスポートする
export function initEditor() {
    initFileMenuControls();
    initImageContextMenuControls();
    initPageLinkHandler();
    initFontChooserControls();
    if (typeof window.bindParagraphMenuListeners === 'function') {
        window.bindParagraphMenuListeners();
    }
    else if (typeof bindParagraphMenuListeners === 'function') {
        bindParagraphMenuListeners();
    }
    // Ensure file input listener is bound
    const openFileInput = document.getElementById('open-file-input');
    if (openFileInput) {
        openFileInput.removeEventListener('change', handleOpenFile);
        openFileInput.addEventListener('change', handleOpenFile);
    }
    bindDocumentLevelHandlers();
    if (typeof window.bindToolbarHandlers === 'function') {
        window.bindToolbarHandlers();
    }
    else if (typeof bindToolbarHandlers === 'function') {
        bindToolbarHandlers();
    }
    ensureAiImageIndex();
    applyPageMargin(currentPageMarginSize);
    window.initPages?.();
    window.renumberParagraphs?.();
    console.log("initEditor() 呼ばれた！");
}
