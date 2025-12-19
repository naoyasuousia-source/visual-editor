import { getPagesContainerElement } from '../globals.js';
import { ensureAiImageIndex } from './image.js';
import { bindEditorEvents } from '../ui/events.js';
import { renumberParagraphs } from './formatting.js';
import { updateNavigator } from '../ui/navigator.js';
import { getMode } from '../core/router.js';

export function createPage(pageNumber: number, contentHTML?: string): HTMLElement {
    const section = document.createElement('section');
    section.className = 'page';
    section.dataset.page = String(pageNumber);

    const inner = document.createElement('div');
    inner.className = 'page-inner';
    inner.contentEditable = 'true';
    inner.innerHTML = contentHTML || '<p><br></p>';

    section.appendChild(inner);
    return section;
}

export function renumberPages(): void {
    const pagesContainerElement = getPagesContainerElement();
    if (!pagesContainerElement) return;
    const pages = pagesContainerElement.querySelectorAll<HTMLElement>('section.page');
    pages.forEach((page, idx) => {
        page.dataset.page = String(idx + 1);
    });
    updateNavigator();
}

export function initPages(): void {
    const pagesContainerElement = getPagesContainerElement();
    if (!pagesContainerElement) return;
    const inners = pagesContainerElement.querySelectorAll<HTMLElement>('.page-inner');
    inners.forEach(inner => {
        bindEditorEvents(inner);
    });
    if (!window.currentEditor && inners[0]) {
        window.setActiveEditor?.(inners[0]);
    }
}

export function addPage(): void {
    const pagesContainerElement = getPagesContainerElement();
    if (!pagesContainerElement) return;
    const pages = Array.from(pagesContainerElement.querySelectorAll<HTMLElement>('section.page'));
    const newPage = createPage(pages.length + 1, '<p><br></p>');
    const currentEditor = window.currentEditor;
    if (currentEditor) {
        const currentPage = currentEditor.closest<HTMLElement>('section.page');
        const currentIndex = currentPage ? pages.indexOf(currentPage) : -1;
        if (currentPage && currentIndex >= 0 && currentIndex < pages.length - 1) {
            const referencePage = pages[currentIndex + 1];
            const insertBeforeNode = referencePage ? referencePage.nextSibling : null;
            pagesContainerElement.insertBefore(newPage, insertBeforeNode);
        } else {
            pagesContainerElement.appendChild(newPage);
        }
    } else {
        pagesContainerElement.appendChild(newPage);
    }

    const newInner = newPage.querySelector<HTMLElement>('.page-inner');
    renumberPages();
    renumberParagraphs();
    initPages();
    if (newInner) {
        window.setActiveEditor?.(newInner);
    }
    ensureAiImageIndex();
}

export function removePage(): void {
    const pagesContainerElement = getPagesContainerElement();
    if (!pagesContainerElement) return;
    const pages = Array.from(pagesContainerElement.querySelectorAll<HTMLElement>('section.page'));
    if (pages.length === 0) return;

    if (!window.confirm('現在のページを削除してもよろしいですか？この操作は取り消せません。')) {
        return;
    }

    let currentEditor = window.currentEditor;
    if (!currentEditor) {
        const fallback = pages[pages.length - 1].querySelector<HTMLElement>('.page-inner');
        currentEditor = fallback;
    }
    if (!currentEditor) return;

    const currentPage = currentEditor.closest<HTMLElement>('section.page');
    if (!currentPage) return;
    const currentIndex = pages.indexOf(currentPage);

    if (pages.length === 1) {
        const inner = pages[0].querySelector<HTMLElement>('.page-inner');
        if (inner) {
            inner.innerHTML = '<p><br></p>';
            window.setActiveEditor?.(inner);
            renumberParagraphs();
        }
        return;
    }

    pagesContainerElement.removeChild(currentPage);

    const newInners = pagesContainerElement.querySelectorAll<HTMLElement>('.page-inner');
    const newIdx = Math.max(0, currentIndex - 1);
    const newInner = newInners[newIdx] || newInners[0] || null;
    if (newInner) {
        window.setActiveEditor?.(newInner);
    }

    renumberPages();
    renumberParagraphs();
    renumberParagraphs();
    ensureAiImageIndex();
}

export function checkPageOverflow(pageInner: HTMLElement): void {
    if (!pageInner) return;
    if (getMode() === 'word') return; // Word mode: no page concept, no overflow logic
    // Buffer of 1px
    if (pageInner.scrollHeight > pageInner.clientHeight + 1) {
        moveOverflowingContent(pageInner);
    }
}

function moveOverflowingContent(pageInner: HTMLElement): void {
    const pageSection = pageInner.closest('section.page');
    if (!pageSection) return;

    const children = Array.from(pageInner.children) as HTMLElement[];
    if (children.length === 0) return;

    const limit = pageInner.clientHeight;
    let splitIndex = -1;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.offsetTop + child.offsetHeight > limit) {
            splitIndex = i;
            break;
        }
    }

    if (splitIndex === -1) {
        splitIndex = children.length - 1;
    }

    const nodesToMove = children.slice(splitIndex);
    if (nodesToMove.length === 0) return;

    let nextPage = pageSection.nextElementSibling as HTMLElement;
    if (!nextPage || !nextPage.classList.contains('page')) {
        const pagesContainer = getPagesContainerElement();
        if (pagesContainer) {
            const newPage = createPage(Number((pageSection as HTMLElement).dataset.page) + 1, '');
            const newInner = newPage.querySelector('.page-inner');
            if (newInner) newInner.innerHTML = '';
            if (nextPage) {
                pagesContainer.insertBefore(newPage, nextPage);
            } else {
                pagesContainer.appendChild(newPage);
            }
            nextPage = newPage;
            initPages();
        }
    }

    const nextInner = nextPage.querySelector('.page-inner') as HTMLElement;
    if (!nextInner) return;

    const selection = window.getSelection();
    let anchorNode: Node | null = null;
    let anchorOffset = 0;
    if (selection && selection.rangeCount > 0) {
        anchorNode = selection.anchorNode;
        anchorOffset = selection.anchorOffset;
    }

    if (nextInner.firstChild) {
        nodesToMove.reverse().forEach(node => {
            nextInner.insertBefore(node, nextInner.firstChild);
        });
    } else {
        nodesToMove.forEach(node => {
            nextInner.appendChild(node);
        });
    }

    if (anchorNode && nodesToMove.some(n => n.contains(anchorNode))) {
        if (window.setActiveEditor) window.setActiveEditor(nextInner);

        if (selection) {
            const newRange = document.createRange();
            newRange.setStart(anchorNode, anchorOffset);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        }
        nextInner.focus();
    }

    renumberParagraphs();
    checkPageOverflow(nextInner);
}
