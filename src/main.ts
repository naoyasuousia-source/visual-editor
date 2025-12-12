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
  }
}

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

const paraNumberLeft = '6mm';
const pageMarginValues: Record<string, string> = { s: '12mm', m: '17mm', l: '24mm' };
const rootMarginRule = /:root\s*{[^}]*}/;
const toolbarElement = document.getElementById('toolbar');
const styleTagElement = document.querySelector('style');
const fontChooserElement = document.querySelector<HTMLElement>('.font-chooser');
const fontChooserTriggerElement = fontChooserElement
  ? (fontChooserElement.querySelector<HTMLElement>('.font-chooser-trigger') ?? null)
  : null;
const highlightControlElement = document.querySelector<HTMLElement>('.highlight-control');
const highlightButtonElement = highlightControlElement
  ? (highlightControlElement.querySelector<HTMLElement>('[data-action="highlight"]') ?? null)
  : null;
const fileDropdownElement = document.querySelector<HTMLElement>('.file-dropdown');
const nestedDropdownElements = document.querySelectorAll<HTMLElement>('.nested-dropdown');
const INDENT_STEP_PX = 36 * (96 / 72);
let currentPageMarginSize = 'm';

const pagesContainerElement = document.getElementById('pages-container');
const sourceElement = document.getElementById('source') as HTMLTextAreaElement | null;

export function toggleFileDropdown(): void {
  if (!fileDropdownElement) return;
  fileDropdownElement.classList.toggle('open');
}

export function closeNestedDropdown(): void {
  nestedDropdownElements.forEach(dropdown => {
    dropdown.classList.remove('open');
    const trigger = dropdown.querySelector<HTMLElement>('.nested-trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

export function closeFileDropdown(): void {
  if (!fileDropdownElement) return;
  fileDropdownElement.classList.remove('open');
  closeNestedDropdown();
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

// index.html からインポートされるため、再度エクスポートする
export function initEditor() {
  applyPageMargin(currentPageMarginSize);
  console.log("initEditor() 呼ばれた！");
}
