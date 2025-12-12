// グローバルスコープの型定義
declare global {
  interface Window {
    isParagraphEmpty: (block: Element | null | undefined) => boolean;
    findParagraphWrapper: (paragraph: Element | null) => HTMLElement | null;
    ensureParagraphWrapper: (paragraph: Element) => HTMLElement;
    ensureFigureWrapper: (paragraph: Element | null) => HTMLElement | null;
    convertParagraphToTag: (paragraph: Element | null, tag: string) => HTMLElement | null;
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

window.findParagraphWrapper = findParagraphWrapper;
window.ensureParagraphWrapper = ensureParagraphWrapper;
window.ensureFigureWrapper = ensureFigureWrapper;
window.convertParagraphToTag = convertParagraphToTag;

// index.html からインポートされるため、再度エクスポートする
export function initEditor() {
  console.log("initEditor() 呼ばれた！");
}
