
/**
 * Helper to remove color/highlight spans from a fragment/node recursively
 * but keep their text content.
 */
export function removeColorSpansInNode(root: Node): void {
    // Check if root is Element or Fragment
    if (root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE && root.nodeType !== Node.ELEMENT_NODE) return;

    const parent = root as ParentNode;
    const spans = Array.from(parent.querySelectorAll('.inline-highlight, .inline-color, span[style*="background-color"], span[style*="color"]'));

    spans.forEach(span => {
        // 該当クラスまたはスタイルを持つ場合のみ Unwrap
        const el = span as HTMLElement;
        if (
            el.classList.contains('inline-highlight') ||
            el.classList.contains('inline-color') ||
            el.style.backgroundColor ||
            el.style.color
        ) {
            unwrapColorSpan(el);
        }
    });
}

export function unwrapColorSpan(span: Element | null): void {
    if (!span) return;
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
    }
    parent.removeChild(span);
}

export function calculateOffsetWithinNode(root: Node | null, container: Node | null, offset: number): number | null {
    if (!root || !container) return null;
    try {
        const temp = document.createRange();
        temp.setStart(root, 0);
        temp.setEnd(container, offset);
        return temp.toString().length;
    } catch (err) {
        // container が root の子孫でない場合など
        return null;
    }
}

export function generateBookmarkId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'bm-';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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

export function getClosestBlockId(element: Element | null): string {
    if (!element) return '';
    const block = element.closest('p, h1, h2, h3, h4, h5, h6') as HTMLElement | null;
    return block ? block.id : '';
}
