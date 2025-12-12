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
    addLinkDestination: () => void;
    createLink: () => void;
    removeLink: () => void;
    updateMarginRule: (value: string) => void;
    updateMarginButtonState: (activeSize: string) => void;
    applyPageMargin: (size: string) => void;
    applyParagraphAlignment: (direction: string) => void;
    closeAllFontSubmenus: () => void;
    setFontMenuOpen: (open: boolean) => void;
    toggleFontMenu: () => void;
    closeFontMenu: () => void;
    closeFontSubmenu: (type?: string | null) => void;
    setHighlightPaletteOpen: (open: boolean) => void;
    toggleHighlightPalette: () => void;
    applyColorHighlight: (color?: string | null) => void;
    applyFontColor: (color?: string | null) => void;
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

const alignDirections = ['left', 'center', 'right'] as const;

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
let currentPageMarginSize = 'm';

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
window.applyParagraphAlignment = applyParagraphAlignment;
window.closeAllFontSubmenus = closeAllFontSubmenus;
window.setFontMenuOpen = setFontMenuOpen;
window.toggleFontMenu = toggleFontMenu;
window.closeFontMenu = closeFontMenu;
window.closeFontSubmenu = closeFontSubmenu;
window.setHighlightPaletteOpen = setHighlightPaletteOpen;
window.toggleHighlightPalette = toggleHighlightPalette;
window.applyColorHighlight = applyColorHighlight;
window.applyFontColor = applyFontColor;

// index.html からインポートされるため、再度エクスポートする
export function initEditor() {
  applyPageMargin(currentPageMarginSize);
  console.log("initEditor() 呼ばれた！");
}
