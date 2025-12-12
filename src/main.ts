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

window.findParagraphWrapper = findParagraphWrapper;
window.ensureParagraphWrapper = ensureParagraphWrapper;
window.ensureFigureWrapper = ensureFigureWrapper;
window.convertParagraphToTag = convertParagraphToTag;
window.generateBookmarkId = generateBookmarkId;
window.addLinkDestination = addLinkDestination;
window.createLink = createLink;
window.removeLink = removeLink;

// index.html からインポートされるため、再度エクスポートする
export function initEditor() {
  console.log("initEditor() 呼ばれた！");
}
