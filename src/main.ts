
import {
  findParagraph,
  findTextPositionInParagraph,
  computeSelectionStateFromRange,
  restoreRangeFromSelectionState
} from './editor/selection.js';

import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrikeThrough,
  applyInlineScript,
  toggleSuperscript,
  toggleSubscript,
  normalizeInlineFormatting,
  applyColorHighlight,
  applyFontColor,
  resetFontColorInSelection,
  resetHighlightsInSelection,
  removeHighlightsInRange,
  applyBlockElement,
  renumberParagraphs
} from './editor/formatting.js';

import {
  AlignDirection,
  SelectionState,
  ParagraphPosition,
  TextPosition
} from './types.js';

import {
  saveFullHTML,
  openWithFilePicker,
  overwriteCurrentFile,
  handleOpenFile,
  setPagesHTML,
  importFullHTMLText,
  buildFullHTML
} from './editor/io.js';

import {
  createPage,
  renumberPages,
  addPage,
  removePage,
  initPages
} from './editor/page.js';

import { ensureAiImageIndex, rebuildFigureMetaStore } from './editor/image.js';

import {
  unwrapColorSpan,
  removeColorSpansInNode,
  convertParagraphToTag,
  calculateOffsetWithinNode,
  compareParagraphOrder,
  generateBookmarkId,
  getClosestBlockId,
  removeColorSpansInNode as removeColorSpansInNodeUtil // Alias if needed, or just use removeColorSpansInNode
} from './utils/dom.js';


// Note: Window interface extension is now in types.ts. 
// We don't need to redeclare it here if we include types.ts in compilation, 
// but TS needs to know about it. Since this is an entry point, imports might suffice.

// Phase 1: Core Utilities Implementation

export function setActiveEditor(inner: HTMLElement | null): void {
  window.currentEditor = inner;
  document.querySelectorAll('section.page').forEach(p => p.classList.remove('active'));
  if (inner) {
    const page = inner.closest('section.page');
    if (page) page.classList.add('active');
  }
}

export function placeCaretBefore(node: Element | null): void {
  if (!node) return;
  const range = document.createRange();
  range.setStartBefore(node);
  range.collapse(true);
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function placeCaretAfter(node: Element | null): void {
  if (!node) return;
  const range = document.createRange();
  range.setStartAfter(node);
  range.collapse(true);
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function getCurrentParagraph(): Element | null {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return null;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;

  let node = sel.anchorNode;
  if (!currentEditor.contains(node)) return null;

  while (node && !(node.nodeType === 1 && /^(p|h[1-6]|div)$/i.test(node.nodeName))) {
    node = node.parentNode;
  }
  return node as Element;
}

// Ensure global exposure for index.html compatibility
window.setActiveEditor = setActiveEditor;
window.placeCaretBefore = placeCaretBefore;
window.placeCaretAfter = placeCaretAfter;
window.getCurrentParagraph = getCurrentParagraph;

// 段階的移行のため、ローカル定義の helper を維持しつつ、必要に応じて utils からインポートしたものを使う
// ここではまず、重複している型定義と convertParagraphToTag を削除・インポートに置換

/**
 * 段落要素が空（テキストや<br>以外の要素がない）かどうかを判定します。
 * @param block - 判定対象の要素
 * @returns 空であれば true
 */
const isParagraphEmpty = (block: Element | null | undefined): boolean => {
  if (!block) return false;
  for (const child of block.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      if (child.textContent?.trim() !== '') {
        return false;
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      if ((child as Element).tagName !== 'BR') {
        return false;
      }
    }
  }
  return true;
};

window.isParagraphEmpty = isParagraphEmpty;

let lastSelectionState: SelectionState | null = null;

const alignDirections: readonly AlignDirection[] = ['left', 'center', 'right'];
const paragraphSpacingSizes = ['xs', 's', 'm', 'l', 'xl'] as const;
type ParagraphSpacingSize = typeof paragraphSpacingSizes[number];
const isParagraphSpacingSize = (value: string | null | undefined): value is ParagraphSpacingSize =>
  !!value && paragraphSpacingSizes.includes(value as ParagraphSpacingSize);

export function findParagraphWrapper(paragraph: Element | null): HTMLElement | null {
  if (!paragraph || !(paragraph instanceof HTMLElement)) return null;
  return (
    Array.from(paragraph.children).find(
      (child): child is HTMLElement => child instanceof HTMLElement && child.classList.contains('inline-align')
    ) ?? null
  );
}

export function ensureParagraphWrapper(paragraph: Element): HTMLElement {
  let wrapper = findParagraphWrapper(paragraph);
  if (wrapper) return wrapper;
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

export function ensureFigureWrapper(paragraph: Element | null): HTMLElement | null {
  if (!paragraph || !(paragraph instanceof HTMLElement)) return null;
  const wrapper = ensureParagraphWrapper(paragraph);
  alignDirections.forEach(dir => {
    wrapper.classList.remove(`inline-align-${dir}`);
  });
  wrapper.classList.add('inline-align-center', 'figure-inline');
  return wrapper;
}

export function addLinkDestination(): void {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
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
  } catch (err) {
    console.error('Failed to wrap selection: ', err);
    alert('複雑な選択範囲のため、リンク先を追加できませんでした。段落をまたがない単純なテキストを選択してください。');
    return;
  }

  selection.removeAllRanges();
  window.syncToSource();
}

export function createLink(): void {
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

  const destinations = Array.from(document.querySelectorAll<HTMLElement>('.page-inner [id^="bm-"]'));
  if (destinations.length === 0) {
    alert('リンク先が登録されていません。');
    return;
  }

  let promptMessage = 'どのリンク先にリンクしますか？番号を入力してください。\n\n';
  const destinationMap = new Map<string, string>();
  destinations.forEach((dest, index) => {
    const text = dest.textContent?.trim().substring(0, 50) || '(テキストなし)';
    promptMessage += `${index + 1}: ${text}\n`;
    destinationMap.set(String(index + 1), dest.id);
  });

  const choice = window.prompt(promptMessage);
  if (!choice) return;

  const destinationId = destinationMap.get(choice.trim());
  if (!destinationId) {
    alert('無効な番号です。');
    return;
  }

  document.execCommand('createLink', false, `#${destinationId}`);
  currentEditor.normalize();
  window.syncToSource();
}

export function removeLink(): void {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;

  const links = Array.from(currentEditor.querySelectorAll<HTMLAnchorElement>('a[href^="#bm-"]'));
  if (links.length === 0) {
    alert('削除できるリンクがありません。');
    return;
  }

  let promptMessage = 'どのリンクを削除しますか？番号を入力してください。\\n\\n';
  const linkMap = new Map<string, HTMLAnchorElement>();
  links.forEach((link, index) => {
    const text = link.textContent?.trim().substring(0, 50) || '(テキストなし)';
    promptMessage += `${index + 1}: ${text}\\n`;
    linkMap.set(String(index + 1), link);
  });

  const choice = window.prompt(promptMessage);
  if (!choice) return;

  const linkToRemove = linkMap.get(choice.trim());
  if (!linkToRemove) {
    alert('無効な番号です。');
    return;
  }

  const parent = linkToRemove.parentNode;
  if (!parent) return;
  while (linkToRemove.firstChild) {
    parent.insertBefore(linkToRemove.firstChild, linkToRemove);
  }
  parent.removeChild(linkToRemove);
  parent.normalize();

  window.syncToSource();
}

export function isRangeInsideCurrentEditor(range: Range | null | undefined): boolean {
  const currentEditor = window.currentEditor;
  return !!(currentEditor && range && currentEditor.contains(range.commonAncestorContainer));
}

export function saveTextSelectionFromEditor(): void {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (range.collapsed) return;
  if (!isRangeInsideCurrentEditor(range)) return;
  const state = computeSelectionStateFromRange(range);
  if (state) {
    lastSelectionState = state;
  }
}

export function getEffectiveTextRange(): Range | null {
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
    return restoreRangeFromSelectionState(lastSelectionState);
  }
  return null;
}

const paraNumberLeft = '6mm';
const pageMarginValues: Record<string, string> = { s: '12mm', m: '17mm', l: '24mm' };
const rootMarginRule = /:root\s*{[^}]*}/;
const toolbarElement = document.getElementById('toolbar');
const styleTagElement = document.querySelector('style');
const fontChooserElement = document.querySelector<HTMLElement>('.font-chooser');
const fontChooserTriggerElement = fontChooserElement
  ? (fontChooserElement.querySelector<HTMLElement>('.font-chooser-trigger') ?? null)
  : null;
const fontSubmenuTriggerElements = fontChooserElement
  ? Array.from(fontChooserElement.querySelectorAll<HTMLElement>('.font-submenu-trigger'))
  : [];
const paragraphChooserElement = document.querySelector<HTMLElement>('.paragraph-chooser');
const paragraphTriggerElement = paragraphChooserElement
  ? (paragraphChooserElement.querySelector<HTMLElement>('.paragraph-trigger') ?? null)
  : null;
const paragraphSubmenuTriggerElements = paragraphChooserElement
  ? Array.from(paragraphChooserElement.querySelectorAll<HTMLElement>('.paragraph-submenu-trigger'))
  : [];
const highlightControlElement = document.querySelector<HTMLElement>('.highlight-control');
const highlightButtonElement = highlightControlElement
  ? (highlightControlElement.querySelector<HTMLElement>('[data-action="highlight"]') ?? null)
  : null;
const getFileDropdownElement = (): HTMLElement | null => document.querySelector<HTMLElement>('.file-dropdown');
const getNestedDropdownElements = (): NodeListOf<HTMLElement> => document.querySelectorAll<HTMLElement>('.nested-dropdown');
const INDENT_STEP_PX = 36 * (96 / 72);
let currentPageMarginSize = 'm';
let currentEditorFontFamily = 'inherit';

const pagesContainerElement = document.getElementById('pages-container');
const sourceElement = document.getElementById('source') as HTMLTextAreaElement | null;
const openFileInputElement = document.getElementById('open-file-input') as HTMLInputElement | null;
const imageContextMenuElement = document.getElementById('image-context-menu');
const imageContextDropdownElement = document.querySelector<HTMLElement>('.image-context-dropdown');

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

const imageContextTriggerElement = document.querySelector<HTMLElement>('.image-context-trigger');
const imageTitleDialogElement = document.getElementById('image-title-dialog') as HTMLDialogElement | null;
const imageTitleInputElement = document.getElementById('image-title-input') as HTMLInputElement | null;
const imageTitleFontRadios = imageTitleDialogElement
  ? Array.from(imageTitleDialogElement.querySelectorAll<HTMLInputElement>('input[name="image-title-font-size"]'))
  : [];
const imageTitleApplyButtonElement = document.querySelector<HTMLElement>('[data-action="apply-image-title"]');
const imageTitleCancelButtonElement = document.querySelector<HTMLElement>('[data-action="cancel-image-title"]');
const imageSizeClasses = ['xs', 's', 'm', 'l', 'xl'] as const;
type ImageSizeClass = typeof imageSizeClasses[number];
const isImageSizeClass = (value: string | null | undefined): value is ImageSizeClass =>
  !!value && imageSizeClasses.includes(value as ImageSizeClass);


let contextTargetImage: HTMLImageElement | null = null;
let aiImageIndex: HTMLElement | null = null;

export function toggleHangingIndent(shouldHang: boolean): void {
  const p = getCurrentParagraph();
  if (!p) return;
  if (shouldHang) {
    p.classList.add('hanging-indent');
  } else {
    p.classList.remove('hanging-indent');
  }
  window.syncToSource();
  updateToolbarState();
}


export function changeIndent(delta: number): void {
  const p = getCurrentParagraph();
  if (!p) return;

  const m = p.className.match(/indent-(\d+)/);
  let level = m ? parseInt(m[1], 10) : 0;

  level = Math.max(0, Math.min(5, level + delta));

  p.className = p.className.replace(/indent-\d+/, '').trim();
  if (level > 0) p.classList.add(`indent-${level}`);

  window.syncToSource();
  updateToolbarState();
}


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

function initFileMenuControls(): void {
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

export function applyImageSize(img: HTMLElement | null, size?: string | null): void {
  if (!img || !isImageSizeClass(size)) return;
  imageSizeClasses.forEach(s => {
    img.classList.remove(`img-${s}`);
  });
  img.classList.add(`img-${size}`);
}



export function showImageContextMenu(event: MouseEvent, img: HTMLImageElement): void {
  if (!imageContextMenuElement) return;
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

export function closeImageSubmenu(): void {
  if (!imageContextDropdownElement) return;
  imageContextDropdownElement.classList.remove('open');
  if (imageContextTriggerElement) {
    imageContextTriggerElement.setAttribute('aria-expanded', 'false');
  }
}

export function closeImageContextMenu(): void {
  if (!imageContextMenuElement) return;
  imageContextMenuElement.classList.remove('open');
  closeImageSubmenu();
}

function openTitleDialog(): void {
  if (!imageTitleDialogElement || !contextTargetImage) return;
  const block = contextTargetImage.closest<HTMLElement>('p, h1, h2, h3, h4, h5, h6');
  if (!block) return;
  let existingTitle = '';

  // 修正: まず明示的な .figure-title 要素を探す
  const existingTitleSpan = block.querySelector<HTMLElement>('.figure-title');
  if (existingTitleSpan) {
    existingTitle = (existingTitleSpan.textContent || '').trim();
  } else {
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
  const figureTitleSpan = block.querySelector<HTMLElement>('.figure-title');
  const hasMiniTextInTitle = !!figureTitleSpan?.querySelector('.mini-text');
  const isBlockStyleMini = block.dataset.blockStyle === 'mini-p';
  const fontValue = (isBlockStyleMini || hasMiniTextInTitle) ? 'mini' : 'default';
  imageTitleFontRadios.forEach(radio => {
    radio.checked = radio.value === fontValue;
  });
  if (typeof imageTitleDialogElement.showModal === 'function') {
    imageTitleDialogElement.showModal();
  } else {
    imageTitleDialogElement.setAttribute('open', '');
  }
}

function closeTitleDialog(): void {
  if (!imageTitleDialogElement) return;
  if (typeof imageTitleDialogElement.close === 'function') {
    imageTitleDialogElement.close();
  } else {
    imageTitleDialogElement.removeAttribute('open');
  }
  if (imageTitleInputElement) {
    imageTitleInputElement.value = '';
  }
  contextTargetImage = null;
}

function removeExistingImageTitle(img: HTMLImageElement | null): void {
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

// Phase 2 & 3 Migration: Paragraph Management & Image Insertion & Event Binding


export function promptDropboxImageUrl(): void {
  const inputUrl = window.prompt('Dropbox画像の共有URLを貼り付けてください。');
  if (!inputUrl) return;
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch (err) {
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

export function promptWebImageUrl(): void {
  const inputUrl = window.prompt('画像URLを貼り付けてください。');
  if (!inputUrl) return;
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch (err) {
    alert('正しいURL形式を入力してください。');
    return;
  }

  insertImageAtCursor({
    src: parsed.toString(),
    alt: parsed.pathname.split('/').pop() || ''
  });
}

export function insertImageAtCursor({ src, alt }: { src: string; alt: string }): void {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;

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
  if (!range) return;

  const block = findParagraph(range.startContainer);
  const isEmptyLine = block && isParagraphEmpty(block);

  const img = document.createElement('img');
  img.src = src;
  img.alt = alt || src;
  img.classList.add('img-m');

  const insertSlotAndPositionCaret = (container: HTMLElement) => {
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
    const container = wrapper || (block as HTMLElement);
    container.appendChild(img);
    insertSlotAndPositionCaret(container);
  } else {
    const newPara = document.createElement('p');
    if (block && block.parentNode) {
      block.parentNode.insertBefore(newPara, block.nextSibling);
    } else {
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

export function bindEditorEvents(inner: HTMLElement): void {
  if (inner.dataset.bound === '1') return;
  inner.dataset.bound = '1';
  if (!inner.dataset.preferredBlockTag) {
    inner.dataset.preferredBlockTag = 'p';
  }

  inner.addEventListener('input', (e: Event) => {
    const inputEvent = e as InputEvent;
    if (inputEvent && inputEvent.inputType === 'insertParagraph') {
      applyPendingBlockTag(inner);
      renumberParagraphs();
    } else {
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
  inner.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const figureWrapper = target.closest('.figure-inline');
    if (figureWrapper && target.tagName !== 'IMG') {
      event.preventDefault();
      const caretSlot = figureWrapper.querySelector('.caret-slot');
      if (caretSlot) {
        placeCaretBefore(caretSlot);
      }
    }
  }, true); // Use capture phase

  inner.addEventListener('keydown', (e: KeyboardEvent) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const isCollapsed = range.collapsed;

    // isCaretBeforeCaretSlotの判定ロジック
    const nodeAfterCaret = isCollapsed ? range.startContainer.childNodes[range.startOffset] : null;
    const isBeforeSlot = nodeAfterCaret && nodeAfterCaret.nodeType === Node.ELEMENT_NODE && (nodeAfterCaret as Element).classList.contains('caret-slot');

    if (isBeforeSlot) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const currentParagraph = (nodeAfterCaret as Element).closest('p, h1, h2, h3, h4, h5, h6');
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
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        const currentParagraph = (nodeAfterCaret as Element).closest('p, h1, h2, h3, h4, h5, h6');
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
        ? ((current as HTMLElement).dataset.blockStyle || current.tagName.toLowerCase())
        : (inner.dataset.preferredBlockTag || 'p');
      inner.dataset.pendingBlockTag = candidate;
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleInlineTabKey();
    } else if (e.key === 'Backspace') {
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
export function updateToolbarState(): void {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;

  const paragraph = getCurrentParagraph();
  const toolbar = document.getElementById('toolbar');
  if (!toolbar) return;

  const hangingIndentCheckbox = toolbar.querySelector('[data-action="hanging-indent"]') as HTMLInputElement | null;

  if (paragraph && hangingIndentCheckbox) {
    const hasIndent = Array.from(paragraph.classList).some(cls => cls.startsWith('indent-'));
    const isHanging = paragraph.classList.contains('hanging-indent');

    if (hasIndent) {
      hangingIndentCheckbox.disabled = false;
      hangingIndentCheckbox.checked = isHanging;
    } else {
      hangingIndentCheckbox.disabled = true;
      hangingIndentCheckbox.checked = false;
    }
  } else if (hangingIndentCheckbox) {
    hangingIndentCheckbox.disabled = true;
    hangingIndentCheckbox.checked = false;
  }
}

// Helper: applyPendingBlockTag (Migrated since used in bindEditorEvents)
export function applyPendingBlockTag(inner: HTMLElement): void {
  const pendingTag = inner.dataset.pendingBlockTag || inner.dataset.preferredBlockTag || 'p';
  if (!pendingTag) return;
  const current = getCurrentParagraph();
  if (!current) return;
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

// Page functions (Restored)
window.createPage = createPage;
window.renumberPages = renumberPages;
window.addPage = addPage;
window.removePage = removePage;
window.initPages = initPages;
window.importFullHTMLText = importFullHTMLText;
window.handleOpenFile = handleOpenFile;
window.openWithFilePicker = openWithFilePicker;
window.overwriteCurrentFile = overwriteCurrentFile;
window.buildFullHTML = buildFullHTML;
window.saveFullHTML = saveFullHTML;


function updateImageMetaTitle(img: HTMLImageElement | null, rawTitle: string): void {
  if (!img) return;
  ensureAiImageIndex();
  if (!aiImageIndex) return;
  let meta = Array.from(aiImageIndex.querySelectorAll<HTMLElement>('.figure-meta')).find(m => m.dataset.src === img.src);
  if (!meta) {
    rebuildFigureMetaStore();
    meta = Array.from(aiImageIndex.querySelectorAll<HTMLElement>('.figure-meta')).find(m => m.dataset.src === img.src);
  }
  if (meta) {
    meta.dataset.title = rawTitle || '';
  }
}

export function applyImageTitle(): void {
  if (!contextTargetImage) return;
  const rawTitle = imageTitleInputElement ? imageTitleInputElement.value : '';
  const fontRadio = imageTitleFontRadios.find(radio => radio.checked);
  const fontSize = fontRadio ? fontRadio.value : 'default';
  const block = contextTargetImage.closest<HTMLElement>('p, h1, h2, h3, h4, h5, h6');
  if (!block) return;

  const paragraph = block.tagName.toLowerCase() === 'p'
    ? block
    : convertParagraphToTag(block, 'p');
  if (!paragraph) return;

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

    let titleContent: Node;
    if (isMini) {
      const miniSpan = document.createElement('span');
      miniSpan.className = 'mini-text';
      miniSpan.style.fontSize = '8pt';
      miniSpan.textContent = rawTitle;
      titleContent = miniSpan;
    } else {
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

function initImageContextMenuControls(): void {
  document.addEventListener('contextmenu', (event) => {
    const target = event.target as HTMLElement | null;
    const img = target?.closest<HTMLImageElement>('img');
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
      if (!imageContextDropdownElement) return;
      const willOpen = !imageContextDropdownElement.classList.contains('open');
      imageContextDropdownElement.classList.toggle('open', willOpen);
      imageContextTriggerElement.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  }

  if (imageContextMenuElement) {
    imageContextMenuElement.addEventListener('click', (event) => {
      const btn = (event.target as HTMLElement).closest<HTMLElement>('button[data-action]');
      if (!btn) return;
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

function initPageLinkHandler(): void {
  if (!pagesContainerElement) return;
  pagesContainerElement.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const link = target?.closest<HTMLAnchorElement>('a');
    if (!link || !link.href) return;
    if (!target?.closest('[contenteditable="true"]')) return;
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


function initFontChooserControls(): void {
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

  // Font Family Options
  const fontButtons = document.querySelectorAll<HTMLElement>('.font-family-option');
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

export function updateMarginButtonState(activeSize: string): void {
  if (!toolbarElement) return;
  const buttons = toolbarElement.querySelectorAll<HTMLButtonElement>('button[data-action="page-margin"]');
  buttons.forEach(btn => {
    btn.setAttribute('aria-pressed', btn.dataset.size === activeSize ? 'true' : 'false');
  });
}


export function closeAllParagraphSubmenus(): void {
  if (!paragraphChooserElement) return;
  paragraphChooserElement.querySelectorAll<HTMLElement>('.paragraph-submenu').forEach(submenu => {
    submenu.classList.remove('is-open');
    const trigger = submenu.querySelector<HTMLElement>('.paragraph-submenu-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

export function setParagraphMenuOpen(open: boolean): void {
  if (!paragraphChooserElement) return;
  paragraphChooserElement.classList.toggle('is-open', open);
  if (paragraphTriggerElement) {
    paragraphTriggerElement.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (!open) {
    closeAllParagraphSubmenus();
  }
}

export function toggleParagraphMenu(): void {
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

const lineHeightSizes = ['s', 'm', 'l'] as const;
type LineHeightSize = typeof lineHeightSizes[number];
const isLineHeightSize = (value: string | null | undefined): value is LineHeightSize =>
  !!value && lineHeightSizes.includes(value as LineHeightSize);

export function syncToSource(): void {
  if (!pagesContainerElement || !sourceElement) return;
  sourceElement.value = pagesContainerElement.innerHTML;
}

export function applyLineHeight(size?: string | null): void {
  if (!isLineHeightSize(size) || !pagesContainerElement) return;
  const inners = pagesContainerElement.querySelectorAll<HTMLElement>('.page-inner');
  inners.forEach(inner => {
    lineHeightSizes.forEach(sz => inner.classList.remove(`line-height-${sz}`));
    if (size !== 'm') {
      inner.classList.add(`line-height-${size}`);
    }
  });
  syncToSource();
}



export function applyParagraphAlignment(direction: string): void {
  if (!direction) return;
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (range.collapsed) return;
  if (!currentEditor.contains(range.commonAncestorContainer)) return;

  const selectors = 'p, h1, h2, h3, h4, h5, h6';
  const paragraphs = Array.from(currentEditor.querySelectorAll<HTMLElement>(selectors)).filter(paragraph => {
    return range.intersectsNode(paragraph);
  });
  if (!paragraphs.length) return;

  paragraphs.forEach(paragraph => {
    const wrapper = ensureParagraphWrapper(paragraph);
    if (!wrapper) return;
    alignDirections.forEach(dir => {
      wrapper.classList.remove(`inline-align-${dir}`);
    });
    if (wrapper.classList.contains('figure-inline')) {
      wrapper.classList.add('inline-align-center');
    } else {
      wrapper.classList.add(`inline-align-${direction}`);
    }
  });

  // 選択範囲の復元（DOM構造変化により失われるため）
  if (selection && paragraphs.length > 0) {
    const first = paragraphs[0];
    const last = paragraphs[paragraphs.length - 1];

    // ラッパーまたはパラグラフ自体を取得
    const firstTarget = findParagraphWrapper(first) || first;
    const lastTarget = findParagraphWrapper(last) || last;

    const newRange = document.createRange();
    // ざっくりと最初の要素の先頭から最後の要素の末尾までを選択
    newRange.setStart(firstTarget, 0);
    // lastTargetの中身を含めるため、childNodesのlengthを使うか、afterを使う
    // ここでは要素全体を選択するイメージで
    if (lastTarget.lastChild) {
      newRange.setEndAfter(lastTarget.lastChild);
    } else {
      newRange.setEnd(lastTarget, lastTarget.childNodes.length);
    }

    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  window.syncToSource();
}

export function getParagraphsInRange(range: Range | null): HTMLElement[] {
  const currentEditor = window.currentEditor;
  if (!currentEditor || !range) return [];
  const selectors = 'p, h1, h2, h3, h4, h5, h6';
  return Array.from(currentEditor.querySelectorAll<HTMLElement>(selectors)).filter(paragraph => {
    return range.intersectsNode(paragraph);
  });
}

function clearParagraphSpacingClasses(target: HTMLElement | null): void {
  if (!target) return;
  paragraphSpacingSizes.forEach(sz => {
    target.classList.remove(`inline-spacing-${sz}`);
  });
}

export function applyParagraphSpacing(size?: string | null): void {
  if (!isParagraphSpacingSize(size)) return;
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (range.collapsed) return;
  if (!currentEditor.contains(range.commonAncestorContainer)) return;

  const paragraphs = getParagraphsInRange(range);
  if (!paragraphs.length) return;

  paragraphs.forEach(paragraph => {
    const wrapper = ensureParagraphWrapper(paragraph);
    clearParagraphSpacingClasses(paragraph);
    clearParagraphSpacingClasses(wrapper);
    if (size !== 's') {
      paragraph.classList.add(`inline-spacing-${size}`);
      if (wrapper) wrapper.classList.add(`inline-spacing-${size}`);
    }
  });

  window.syncToSource();
}


// Phase 3: Formatting & Selection Implementation
// Imported from editor/formatting.ts

// Legacy exports for HTML usage via window
window.toggleBold = toggleBold;
window.toggleItalic = toggleItalic;
window.toggleUnderline = toggleUnderline;
window.toggleStrikeThrough = toggleStrikeThrough;
window.applyInlineScript = applyInlineScript;
window.toggleSuperscript = toggleSuperscript;
window.toggleSubscript = toggleSubscript;
window.resetHighlightsInSelection = resetHighlightsInSelection;
window.applyColorHighlight = applyColorHighlight;
window.applyFontColor = applyFontColor;
window.resetFontColorInSelection = resetFontColorInSelection;
window.removeHighlightsInRange = removeHighlightsInRange;

export function getCaretOffset(range: Range): number {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return 0;
  const rects = range.getClientRects();
  const editorRect = currentEditor.getBoundingClientRect();
  const rect = rects.length ? rects[0] : range.getBoundingClientRect();
  if (!rect || (rect.left === 0 && rect.width === 0 && rect.height === 0)) {
    return 0;
  }
  const offset = rect.left - editorRect.left + currentEditor.scrollLeft;
  if (!Number.isFinite(offset)) return 0;
  return Math.max(0, offset);
}

export function insertInlineTabAt(range: Range, width: number): boolean {
  if (!width || width <= 0) return false;
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

export function handleInlineTabKey(): boolean {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return false;
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return false;
  const range = selection.getRangeAt(0);
  if (!currentEditor.contains(range.commonAncestorContainer)) return false;
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
  if (delta <= 0) return false;
  const inserted = insertInlineTabAt(range, delta);
  if (inserted) {
    window.syncToSource();
  }
  return inserted;
}

function getInlineTabNodeBefore(range: Range): Element | null {
  let container: Node | null = range.startContainer;
  let offset = range.startOffset;
  if (container && container.nodeType === Node.TEXT_NODE) {
    if (offset > 0) return null;
    container = container.previousSibling;
  } else if (container) {
    if (offset > 0) {
      container = container.childNodes[offset - 1];
    } else {
      container = container.previousSibling;
    }
  }
  if (
    container &&
    container.nodeType === 1 &&
    (container as Element).classList &&
    (container as Element).classList.contains('inline-tab')
  ) {
    return container as Element;
  }
  return null;
}

export function handleInlineTabBackspace(): boolean {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return false;
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return false;
  const range = selection.getRangeAt(0);
  if (!currentEditor.contains(range.commonAncestorContainer)) return false;
  if (!range.collapsed) return false;
  const inlineTab = getInlineTabNodeBefore(range);
  if (!inlineTab) return false;
  const newRange = document.createRange();
  newRange.setStartBefore(inlineTab);
  newRange.collapse(true);
  inlineTab.parentNode?.removeChild(inlineTab);
  selection.removeAllRanges();
  selection.addRange(newRange);
  window.syncToSource();
  return true;
}


export function setHighlightPaletteOpen(open: boolean): void {
  if (!highlightControlElement || !highlightButtonElement) return;
  highlightControlElement.classList.toggle('is-open', open);
  highlightButtonElement.setAttribute('aria-expanded', open ? 'true' : 'false');
}

export function toggleHighlightPalette(): void {
  if (!highlightControlElement) return;
  const willOpen = !highlightControlElement.classList.contains('is-open');
  if (willOpen) {
    closeAllMenus('highlight');
  }
  setHighlightPaletteOpen(willOpen);
}

export function closeAllFontSubmenus(): void {
  if (!fontChooserElement) return;
  fontChooserElement.querySelectorAll<HTMLElement>('.font-submenu').forEach(submenu => {
    submenu.classList.remove('is-open');
    const trigger = submenu.querySelector<HTMLElement>('.font-submenu-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

export function setFontMenuOpen(open: boolean): void {
  if (!fontChooserElement) return;
  fontChooserElement.classList.toggle('is-open', open);
  if (fontChooserTriggerElement) {
    fontChooserTriggerElement.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (!open) {
    closeAllFontSubmenus();
  }
}

// Helper to close all valid menus
function closeAllMenus(exclude?: 'font' | 'paragraph' | 'highlight' | 'file'): void {
  // Note: These functions must be hoisted or defined
  if (exclude !== 'file' && typeof closeFileDropdown === 'function') closeFileDropdown();
  if (exclude !== 'font' && typeof closeFontMenu === 'function') {
    closeFontMenu();
    if (typeof closeAllFontSubmenus === 'function') closeAllFontSubmenus();
  }
  if (exclude !== 'paragraph' && typeof closeParagraphMenu === 'function') closeParagraphMenu();
  if (exclude !== 'highlight') {
    if (highlightControlElement) setHighlightPaletteOpen(false);
  }
  closeImageContextMenu(); // Context menu should usually close on other interactions
}

export function toggleFontMenu(): void {
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
  if (!fontChooserElement || !type) return;
  const submenu = fontChooserElement.querySelector<HTMLElement>(`.font-submenu[data-submenu="${type}"]`);
  if (!submenu) return;
  submenu.classList.remove('is-open');
  const trigger = submenu.querySelector<HTMLElement>('.font-submenu-trigger');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
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




function bindParagraphMenuListeners(): void {
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
}

function bindDocumentLevelHandlers(): void {
  document.addEventListener('mousedown', (event) => {
    const target = event.target as HTMLElement | null;
    const tab = target?.closest<HTMLElement>('.inline-tab');
    if (!tab) return;
    event.preventDefault();
    const rect = tab.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    if (event.clientX < midpoint) {
      window.placeCaretBefore?.(tab);
    } else {
      window.placeCaretAfter?.(tab);
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const clickedEditor = Boolean(target?.closest('.page-inner'));
    if (clickedEditor) {
      const fileMenu = document.querySelector<HTMLElement>('.file-menu');
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

function bindToolbarHandlers(): void {
  if (!toolbarElement) return;

  toolbarElement.addEventListener('mousedown', (event) => {
    const btn = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('button');
    if (btn) {
      event.preventDefault();
    }
  });



  toolbarElement.addEventListener('click', async (event) => {
    // Handle input (checkbox) clicks first
    const inputTarget = (event.target as HTMLElement | null)?.closest<HTMLInputElement>('input');
    if (inputTarget) {
      // メニュー内の操作であればイベント伝播を止める（メニューを閉じさせないため）
      if (inputTarget.closest('.font-chooser, .paragraph-chooser, .highlight-control')) {
        event.stopPropagation();
      }
      const action = inputTarget.dataset.action;
      if (action === 'hanging-indent') {
        window.toggleHangingIndent?.(inputTarget.checked);
      }
      return;
    }

    const btn = (event.target as HTMLElement | null)?.closest<HTMLElement>('button');
    if (!btn) return;

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
  if (typeof (window as any).bindParagraphMenuListeners === 'function') {
    (window as any).bindParagraphMenuListeners();
  } else if (typeof bindParagraphMenuListeners === 'function') {
    bindParagraphMenuListeners();
  }

  // Ensure file input listener is bound
  const openFileInput = document.getElementById('open-file-input');
  if (openFileInput) {
    openFileInput.removeEventListener('change', handleOpenFile);
    openFileInput.addEventListener('change', handleOpenFile);
  }

  bindDocumentLevelHandlers();
  if (typeof (window as any).bindToolbarHandlers === 'function') {
    (window as any).bindToolbarHandlers();
  } else if (typeof bindToolbarHandlers === 'function') {
    bindToolbarHandlers();
  }

  ensureAiImageIndex();
  applyPageMargin(currentPageMarginSize);
  ensureAiImageIndex();
  applyPageMargin(currentPageMarginSize);
  console.log("Checking window.initPages:", window.initPages);
  if (window.initPages) {
    window.initPages();
  } else {
    console.error("window.initPages is MISSING!");
  }

  if (window.renumberParagraphs) {
    window.renumberParagraphs();
  } else {
    console.error("window.renumberParagraphs is MISSING!");
  }

  console.log("initEditor() completed.");
}

console.log("main.ts module evaluated. window.bindEditorEvents:", window.bindEditorEvents);
