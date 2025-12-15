import { getPagesContainerElement } from '../globals.js';
import { ensureAiImageIndex } from './image.js';
import { bindEditorEvents } from '../ui/events.js';
import { renumberParagraphs } from './formatting.js';
export function createPage(pageNumber, contentHTML) {
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
export function renumberPages() {
    const pagesContainerElement = getPagesContainerElement();
    if (!pagesContainerElement)
        return;
    const pages = pagesContainerElement.querySelectorAll('section.page');
    pages.forEach((page, idx) => {
        page.dataset.page = String(idx + 1);
    });
}
export function initPages() {
    const pagesContainerElement = getPagesContainerElement();
    if (!pagesContainerElement)
        return;
    const inners = pagesContainerElement.querySelectorAll('.page-inner');
    inners.forEach(inner => {
        bindEditorEvents(inner);
    });
    if (!window.currentEditor && inners[0]) {
        window.setActiveEditor?.(inners[0]);
    }
}
export function addPage() {
    const pagesContainerElement = getPagesContainerElement();
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
    renumberParagraphs();
    initPages();
    if (newInner) {
        window.setActiveEditor?.(newInner);
    }
    ensureAiImageIndex();
}
export function removePage() {
    const pagesContainerElement = getPagesContainerElement();
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
            renumberParagraphs();
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
    renumberParagraphs();
    ensureAiImageIndex();
}
