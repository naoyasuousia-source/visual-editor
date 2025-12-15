
import {
  findParagraph,
  findTextPositionInParagraph,
  computeSelectionStateFromRange,
  restoreRangeFromSelectionState,
  placeCaretBefore,
  placeCaretAfter
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

import {
  ensureAiImageIndex,
  rebuildFigureMetaStore,
  applyImageSize,
  applyImageTitle,
  showImageContextMenu,
  closeImageContextMenu,
  closeImageSubmenu,
  promptDropboxImageUrl,
  promptWebImageUrl,
  insertImageAtCursor,
  initImageContextMenuControls,
  updateImageMetaTitle,
  openTitleDialog,
  closeTitleDialog,
  removeExistingImageTitle
} from './editor/image.js';

import {
  unwrapColorSpan,
  removeColorSpansInNode,
  convertParagraphToTag,
  calculateOffsetWithinNode,
  compareParagraphOrder,
  generateBookmarkId,
  getClosestBlockId,
  isParagraphEmpty,
  findParagraphWrapper,
  ensureParagraphWrapper,
  ensureFigureWrapper,
  removeColorSpansInNode as removeColorSpansInNodeUtil
} from './utils/dom.js';

import {
  bindEditorEvents,
  initPageLinkHandler,
  bindDocumentLevelHandlers
} from './ui/events.js';

import {
  bindToolbarHandlers,
  updateMarginButtonState
} from './ui/toolbar.js';

import {
  initFileMenuControls,
  initFontChooserControls,
  bindParagraphMenuListeners
} from './ui/menu.js';


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

let lastSelectionState: SelectionState | null = null;

const alignDirections: readonly AlignDirection[] = ['left', 'center', 'right'];
const paragraphSpacingSizes = ['xs', 's', 'm', 'l', 'xl'] as const;
type ParagraphSpacingSize = typeof paragraphSpacingSizes[number];
const isParagraphSpacingSize = (value: string | null | undefined): value is ParagraphSpacingSize =>
  !!value && paragraphSpacingSizes.includes(value as ParagraphSpacingSize);

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







// Phase 2 & 3 Migration: Paragraph Management & Image Insertion & Event Binding






// Global Assignments
window.renumberParagraphs = renumberParagraphs;
window.promptDropboxImageUrl = promptDropboxImageUrl;
window.promptWebImageUrl = promptWebImageUrl;
window.insertImageAtCursor = insertImageAtCursor;

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


export function syncToSource(): void {
  if (!pagesContainerElement || !sourceElement) return;
  sourceElement.value = pagesContainerElement.innerHTML;
}










// index.html からインポートされるため、再度エクスポートする


export function initEditor() {
  initFileMenuControls();
  initImageContextMenuControls();
  initPageLinkHandler();
  initFontChooserControls();
  bindParagraphMenuListeners();

  // Ensure file input listener is bound
  const openFileInput = document.getElementById('open-file-input');
  if (openFileInput) {
    openFileInput.removeEventListener('change', handleOpenFile);
    openFileInput.addEventListener('change', handleOpenFile);
  }

  bindDocumentLevelHandlers();
  bindToolbarHandlers();

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

  // Late import of registry to ensure exports are ready
  import('./registry.js')
    .then(() => console.log('Registry loaded'))
    .catch(err => console.error('Failed to load registry', err));

  console.log("initEditor() completed.");
}

console.log("main.ts module evaluated. window.bindEditorEvents:", window.bindEditorEvents);
