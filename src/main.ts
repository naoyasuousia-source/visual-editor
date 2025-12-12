type AlignDirection = 'left' | 'center' | 'right';

// グローバルスコープの型定義
declare global {
  interface Window {
    isParagraphEmpty: (block: Element | null | undefined) => boolean;
    findParagraphWrapper: (paragraph: Element | null) => HTMLElement | null;
    ensureParagraphWrapper: (paragraph: Element) => HTMLElement;
    ensureFigureWrapper: (paragraph: Element | null) => HTMLElement | null;
    convertParagraphToTag: (paragraph: Element | null, tag: string) => HTMLElement | null;
    currentEditor: HTMLElement | null;
    syncToSource: () => void;
    generateBookmarkId: () => string;
    getCaretOffset: (range: Range) => number;
    insertInlineTabAt: (range: Range, width: number) => boolean;
    handleInlineTabKey: () => boolean;
    handleInlineTabBackspace: () => boolean;
    addLinkDestination: () => void;
    createLink: () => void;
    removeLink: () => void;
    updateMarginRule: (value: string) => void;
    updateMarginButtonState: (activeSize: string) => void;
    applyPageMargin: (size: string) => void;
    applyParagraphAlignment: (direction: string) => void;
    alignDirections: readonly AlignDirection[];
    getParagraphsInRange: (range: Range | null) => HTMLElement[];
    applyParagraphSpacing: (size?: string | null) => void;
    applyLineHeight: (size?: string | null) => void;
    toggleBold: () => void;
    toggleItalic: () => void;
    toggleUnderline: () => void;
    toggleStrikeThrough: () => void;
    applyInlineScript: (command: string) => void;
    toggleSuperscript: () => void;
    toggleSubscript: () => void;
    closeAllFontSubmenus: () => void;
    setFontMenuOpen: (open: boolean) => void;
    toggleFontMenu: () => void;
    closeFontMenu: () => void;
    closeFontSubmenu: (type?: string | null) => void;
    closeAllParagraphSubmenus: () => void;
    setParagraphMenuOpen: (open: boolean) => void;
    toggleParagraphMenu: () => void;
    closeParagraphMenu: () => void;
    toggleFileDropdown: () => void;
    closeNestedDropdown: () => void;
    closeFileDropdown: () => void;
    setHighlightPaletteOpen: (open: boolean) => void;
    toggleHighlightPalette: () => void;
    applyColorHighlight: (color?: string | null) => void;
    applyFontColor: (color?: string | null) => void;
    resetFontColorInSelection: () => void;
    removeHighlightsInRange: (range: Range) => boolean;
    saveTextSelectionFromEditor: () => void;
    getEffectiveTextRange: () => Range | null;
    calculateOffsetWithinNode: (root: Node | null, container: Node | null, offset: number) => number | null;
    isRangeInsideCurrentEditor: (range: Range | null | undefined) => boolean;
    compareParagraphOrder: (a: Node, b: Node) => number;
    computeSelectionStateFromRange: (range: Range | null) => SelectionState | null;
    findTextPositionInParagraph: (block: Element | null, targetOffset: number) => TextPosition | null;
    restoreRangeFromSelectionState: (state: SelectionState | null) => Range | null;
    findParagraph: (node: Node | null) => Element | null;
    applyImageSize: (img: HTMLElement | null, size?: string | null) => void;
    ensureAiImageIndex: () => void;
    rebuildFigureMetaStore: () => void;
    getClosestBlockId: (element: Element | null) => string;
    showImageContextMenu: (event: MouseEvent, img: HTMLImageElement) => void;
    closeImageContextMenu: () => void;
    closeImageSubmenu: () => void;
    openTitleDialog: () => void;
    closeTitleDialog: () => void;
    applyImageTitle: () => void;
    removeExistingImageTitle: (img: HTMLImageElement | null) => void;
    updateImageMetaTitle: (img: HTMLImageElement | null, title: string) => void;
  }
}

type SelectionState = {
  startBlockId: string;
  endBlockId: string;
  startOffset: number;
  endOffset: number;
};

type ParagraphPosition = {
  block: Element;
  id: string;
  offset: number;
};

type TextPosition = {
  node: Node;
  offset: number;
};

/**
 * 段落要素が空（テキストや<br>以外の要素がない）かどうかを判定します。
 * @param block - 判定対象の要素
 * @returns 空であれば true
 */
const isParagraphEmpty = (block: Element | null | undefined): boolean => {
  if (!block) return false;
  for (const child of block.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      // textContent が null の可能性を考慮し、オプショナルチェイニング(?.)を使用
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

// 段階的な移行のため、グローバルスコープで利用できるようにする
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

export function convertParagraphToTag(paragraph: Element | null, tag: string): HTMLElement | null {
  if (!paragraph || !(paragraph instanceof HTMLElement)) return null;
  const desiredTag = tag === 'mini-p' ? 'p' : tag;
  const currentTag = paragraph.tagName.toLowerCase();

  let replacement: HTMLElement = paragraph;

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
    let miniTextSpan = replacement.querySelector(':scope > .mini-text') as HTMLElement | null;
    if (miniTextSpan) {
      miniTextSpan.style.fontSize = '8pt';
      if (!miniTextSpan.classList.contains('mini-text')) {
        miniTextSpan.classList.add('mini-text');
      }
    } else {
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
  } else {
    const miniTextSpan = replacement.querySelector(':scope > .mini-text') as HTMLElement | null;
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

export function generateBookmarkId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'bm-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
  }
  return null;
}

export function compareParagraphOrder(a: Node, b: Node): number {
  if (a === b) return 0;
  const pos = a.compareDocumentPosition(b);
  if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
    return -1;
  }
  if (pos & Node.DOCUMENT_POSITION_PRECEDING) {
    return 1;
  }
  return 0;
}

export function calculateOffsetWithinNode(root: Node | null, container: Node | null, offset: number): number | null {
  if (!root || !container) return null;
  try {
    const temp = document.createRange();
    temp.setStart(root, 0);
    temp.setEnd(container, offset);
    return temp.toString().length;
  } catch (err) {
    return null;
  }
}

export function computeSelectionStateFromRange(range: Range | null): SelectionState | null {
  if (!range) return null;
  const startParagraph = findParagraph(range.startContainer);
  const endParagraph = findParagraph(range.endContainer);
  if (!startParagraph || !endParagraph) return null;
  const startId = startParagraph.id;
  const endId = endParagraph.id;
  if (!startId || !endId) return null;
  const startOffset = calculateOffsetWithinNode(startParagraph, range.startContainer, range.startOffset);
  const endOffset = calculateOffsetWithinNode(endParagraph, range.endContainer, range.endOffset);
  if (startOffset == null || endOffset == null) return null;

  let startState: ParagraphPosition = {
    block: startParagraph,
    id: startId,
    offset: startOffset
  };
  let endState: ParagraphPosition = {
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

export function findTextPositionInParagraph(block: Element | null, targetOffset: number): TextPosition | null {
  if (!block) return null;
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

export function restoreRangeFromSelectionState(state: SelectionState | null): Range | null {
  if (!state) return null;
  const startBlock = document.getElementById(state.startBlockId);
  const endBlock = document.getElementById(state.endBlockId);
  if (!startBlock || !endBlock) return null;
  const startPosition = findTextPositionInParagraph(startBlock, state.startOffset);
  const endPosition = findTextPositionInParagraph(endBlock, state.endOffset);
  if (!startPosition || !endPosition) return null;
  const range = document.createRange();
  range.setStart(startPosition.node, startPosition.offset);
  range.setEnd(endPosition.node, endPosition.offset);
  return range;
}

export function findParagraph(node: Node | null): Element | null {
  let current = node;
  const currentEditor = window.currentEditor;
  while (current && current !== currentEditor) {
    if (
      current.nodeType === Node.ELEMENT_NODE &&
      /^(p|h[1-6])$/i.test((current as Element).tagName)
    ) {
      return current as Element;
    }
    current = current.parentNode;
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
const highlightControlElement = document.querySelector<HTMLElement>('.highlight-control');
const highlightButtonElement = highlightControlElement
  ? (highlightControlElement.querySelector<HTMLElement>('[data-action="highlight"]') ?? null)
  : null;
const getFileDropdownElement = (): HTMLElement | null => document.querySelector<HTMLElement>('.file-dropdown');
const getNestedDropdownElements = (): NodeListOf<HTMLElement> => document.querySelectorAll<HTMLElement>('.nested-dropdown');
const INDENT_STEP_PX = 36 * (96 / 72);
let currentPageMarginSize = 'm';

const pagesContainerElement = document.getElementById('pages-container');
const sourceElement = document.getElementById('source') as HTMLTextAreaElement | null;
const imageContextMenuElement = document.getElementById('image-context-menu');
const imageContextDropdownElement = document.querySelector<HTMLElement>('.image-context-dropdown');
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

export function toggleFileDropdown(): void {
  const element = getFileDropdownElement();
  if (!element) return;
  element.classList.toggle('open');
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

export function ensureAiImageIndex(): void {
  if (!pagesContainerElement) return;
  let container = document.getElementById('ai-image-index');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ai-image-index';
    container.style.display = 'none';
  } else if (container.parentNode) {
    container.parentNode.removeChild(container);
  }
  pagesContainerElement.appendChild(container);
  aiImageIndex = container;
}

export function getClosestBlockId(element: Element | null): string {
  if (!element) return '';
  const block = element.closest('p, h1, h2, h3, h4, h5, h6') as HTMLElement | null;
  return block ? block.id : '';
}

export function rebuildFigureMetaStore(): void {
  if (!pagesContainerElement) return;
  ensureAiImageIndex();
  if (!aiImageIndex) return;

  const preservedMetas = new Map<string, HTMLElement[]>();
  aiImageIndex.querySelectorAll<HTMLElement>('.figure-meta').forEach(meta => {
    const key = meta.dataset.src || '';
    if (!preservedMetas.has(key)) {
      preservedMetas.set(key, []);
    }
    preservedMetas.get(key)!.push(meta);
  });
  aiImageIndex.innerHTML = '';

  const images = pagesContainerElement.querySelectorAll<HTMLImageElement>('.page-inner img');
  images.forEach(img => {
    const key = img.src || '';
    const candidates = preservedMetas.get(key);
    let meta: HTMLElement | null = null;
    if (candidates && candidates.length) {
      meta = candidates.shift()!;
    } else {
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
    aiImageIndex!.appendChild(meta);
  });
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

export function updateMarginRule(value: string): void {
  if (!styleTagElement) return;
  if (rootMarginRule.test(styleTagElement.innerHTML)) {
    const formatted = `:root {\n      --page-margin: ${value};\n      --para-number-left: ${paraNumberLeft};\n    }`;
    styleTagElement.innerHTML = styleTagElement.innerHTML.replace(rootMarginRule, formatted);
  }
}

export function updateMarginButtonState(activeSize: string): void {
  if (!toolbarElement) return;
  const buttons = toolbarElement.querySelectorAll<HTMLButtonElement>('button[data-action="page-margin"]');
  buttons.forEach(btn => {
    btn.setAttribute('aria-pressed', btn.dataset.size === activeSize ? 'true' : 'false');
  });
}

export function applyPageMargin(size: string): void {
  if (!pageMarginValues[size]) return;
  currentPageMarginSize = size;
  const value = pageMarginValues[size];
  document.documentElement.style.setProperty('--page-margin', value);
  document.documentElement.style.setProperty('--para-number-left', paraNumberLeft);
  updateMarginRule(value);
  updateMarginButtonState(size);
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

export function toggleBold(): void {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  currentEditor.focus();
  document.execCommand('bold', false, undefined);
  normalizeInlineFormatting();
  syncToSource();
}

export function toggleItalic(): void {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  currentEditor.focus();
  document.execCommand('italic', false, undefined);
  normalizeInlineFormatting();
  syncToSource();
}

export function toggleUnderline(): void {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  currentEditor.focus();
  document.execCommand('underline', false, undefined);
  normalizeInlineFormatting();
  syncToSource();
}

export function toggleStrikeThrough(): void {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  currentEditor.focus();
  document.execCommand('strikeThrough', false, undefined);
  normalizeInlineFormatting();
  syncToSource();
}

export function applyInlineScript(command: string): void {
  if (!command) return;
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  currentEditor.focus();
  document.execCommand(command, false, undefined);
  syncToSource();
}

export function toggleSuperscript(): void {
  applyInlineScript('superscript');
}

export function toggleSubscript(): void {
  applyInlineScript('subscript');
}

export function normalizeInlineFormatting(): void {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  replaceInlineTag(currentEditor, 'strong', 'b');
  replaceInlineTag(currentEditor, 'em', 'i');
  replaceInlineTag(currentEditor, 'strike', 's');
  replaceInlineTag(currentEditor, 'del', 's');
}

function replaceInlineTag(currentEditor: HTMLElement, from: string, to: string): void {
  const nodes = currentEditor.querySelectorAll<HTMLElement>(from);
  nodes.forEach(node => {
    const replacement = document.createElement(to);
    Array.from(node.attributes).forEach(attr => {
      replacement.setAttribute(attr.name, attr.value);
    });
    while (node.firstChild) {
      replacement.appendChild(node.firstChild);
    }
    const parent = node.parentNode;
    if (!parent) return;
    parent.replaceChild(replacement, node);
  });
}

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
  setHighlightPaletteOpen(!highlightControlElement.classList.contains('is-open'));
}

export function applyColorHighlight(color?: string | null): void {
  if (!color) return;
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (range.collapsed) return;
  if (!currentEditor.contains(range.commonAncestorContainer)) return;

  const cleanupRange = range.cloneRange();
  if (window.removeHighlightsInRange(cleanupRange)) {
    selection.removeAllRanges();
    selection.addRange(cleanupRange);
  }

  const workingRange = cleanupRange.cloneRange();
  const fragment = workingRange.extractContents();
  removeColorSpansInNode(fragment);

  const span = document.createElement('span');
  span.className = 'inline-highlight';
  span.style.backgroundColor = color;
  span.appendChild(fragment);
  workingRange.insertNode(span);

  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  selection.addRange(newRange);

  window.syncToSource();
  setHighlightPaletteOpen(false);
}

function unwrapColorSpan(span: Element | null): void {
  if (!span) return;
  const parent = span.parentNode;
  if (!parent) return;
  while (span.firstChild) {
    parent.insertBefore(span.firstChild, span);
  }
  parent.removeChild(span);
}

function removeColorSpansInNode(root: ParentNode | null): boolean {
  if (!root) return false;
  const spans = Array.from(root.querySelectorAll('.inline-color'));
  let removed = false;
  spans.forEach(span => {
    unwrapColorSpan(span);
    removed = true;
  });
  return removed;
}

function cloneColorSpanWithText(template: Element | null, text: string): HTMLElement | null {
  if (!template || !text) return null;
  const clone = template.cloneNode(false) as HTMLElement;
  while (clone.firstChild) {
    clone.removeChild(clone.firstChild);
  }
  clone.appendChild(document.createTextNode(text));
  return clone;
}

function splitColorSpanForRange(span: Element | null, range: Range | null): boolean {
  if (!span || !range || !range.intersectsNode(span)) return false;
  const spanRange = document.createRange();
  spanRange.selectNodeContents(span);
  const intersection = range.cloneRange();
  if (intersection.compareBoundaryPoints(Range.START_TO_START, spanRange) < 0) {
    intersection.setStart(spanRange.startContainer, spanRange.startOffset);
  }
  if (intersection.compareBoundaryPoints(Range.END_TO_END, spanRange) > 0) {
    intersection.setEnd(spanRange.endContainer, spanRange.endOffset);
  }

  const totalLength = span.textContent?.length ?? 0;
  const startOffset = window.calculateOffsetWithinNode(span, intersection.startContainer, intersection.startOffset);
  const endOffset = window.calculateOffsetWithinNode(span, intersection.endContainer, intersection.endOffset);
  if (startOffset == null || endOffset == null) return false;
  if (startOffset <= 0 && endOffset >= totalLength) {
    unwrapColorSpan(span);
    return true;
  }

  const text = span.textContent || '';
  const beforeText = text.slice(0, startOffset);
  const middleText = text.slice(startOffset, endOffset);
  const afterText = text.slice(endOffset);

  if (!middleText) return false;

  const parent = span.parentNode;
  if (!parent) return false;

  const fragments: Node[] = [];
  if (beforeText) {
    const beforeSpan = cloneColorSpanWithText(span, beforeText);
    if (beforeSpan) fragments.push(beforeSpan);
  }
  fragments.push(document.createTextNode(middleText));
  if (afterText) {
    const afterSpan = cloneColorSpanWithText(span, afterText);
    if (afterSpan) fragments.push(afterSpan);
  }

  fragments.forEach(node => parent.insertBefore(node, span));
  parent.removeChild(span);
  return true;
}

export function applyFontColor(color?: string | null): void {
  if (!color) return;
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  const range = window.getEffectiveTextRange();
  if (!range) return;

  const workingRange = range.cloneRange();
  const fragment = workingRange.extractContents();
  removeColorSpansInNode(fragment);

  const span = document.createElement('span');
  span.className = 'inline-color';
  span.style.color = color;
  span.appendChild(fragment);
  workingRange.insertNode(span);

  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
  }

  window.syncToSource();
  setHighlightPaletteOpen(false);
  window.saveTextSelectionFromEditor();
}

export function resetFontColorInSelection(): void {
  const currentEditor = window.currentEditor;
  if (!currentEditor) return;
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (range.collapsed) return;
  if (!currentEditor.contains(range.commonAncestorContainer)) return;

  const spans = Array.from(currentEditor.querySelectorAll<HTMLElement>('.inline-color'));
  let removed = false;
  spans.forEach(span => {
    if (range.intersectsNode(span)) {
      unwrapColorSpan(span);
      removed = true;
    }
  });
  if (!removed) return;

  const normalized = range.cloneRange();
  selection.removeAllRanges();
  selection.addRange(normalized);
  syncToSource();
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

export function toggleFontMenu(): void {
  if (!fontChooserElement) return;
  setFontMenuOpen(!fontChooserElement.classList.contains('is-open'));
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

// index.html からインポートされるため、再度エクスポートする
export function initEditor() {
  initFileMenuControls();
  initImageContextMenuControls();
  initPageLinkHandler();
  initFontChooserControls();
  ensureAiImageIndex();
  applyPageMargin(currentPageMarginSize);
  console.log("initEditor() 呼ばれた！");
}
