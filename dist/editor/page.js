import { getPagesContainerElement } from '../globals.js';
import { ensureAiImageIndex } from './image.js';
import { bindEditorEvents } from '../ui/events.js';
import { renumberParagraphs } from './formatting.js';
import { updateNavigator } from '../ui/navigator.js';
export function createPage(pageNumber, contentHTML) {
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
export function renumberPages() {
    const pagesContainerElement = getPagesContainerElement();
    if (!pagesContainerElement)
        return;
    const pages = pagesContainerElement.querySelectorAll('section.page');
    pages.forEach((page, idx) => {
        page.dataset.page = String(idx + 1);
    });
    updateNavigator();
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
    const newPage = createPage(pages.length + 1, '<p><br></p>');
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
            inner.innerHTML = '<p><br></p>';
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
    renumberParagraphs();
    ensureAiImageIndex();
}
export function checkPageOverflow(pageInner) {
    if (!pageInner)
        return;
    // Buffer of 1px
    if (pageInner.scrollHeight > pageInner.clientHeight + 1) {
        moveOverflowingContent(pageInner);
    }
}
function moveOverflowingContent(pageInner) {
    const pageSection = pageInner.closest('section.page');
    if (!pageSection)
        return;
    const children = Array.from(pageInner.children);
    if (children.length === 0)
        return;
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
    if (nodesToMove.length === 0)
        return;
    let nextPage = pageSection.nextElementSibling;
    if (!nextPage || !nextPage.classList.contains('page')) {
        const pagesContainer = getPagesContainerElement();
        if (pagesContainer) {
            const newPage = createPage(Number(pageSection.dataset.page) + 1, '');
            const newInner = newPage.querySelector('.page-inner');
            if (newInner)
                newInner.innerHTML = '';
            if (nextPage) {
                pagesContainer.insertBefore(newPage, nextPage);
            }
            else {
                pagesContainer.appendChild(newPage);
            }
            nextPage = newPage;
            initPages();
        }
    }
    const nextInner = nextPage.querySelector('.page-inner');
    if (!nextInner)
        return;
    const selection = window.getSelection();
    let anchorNode = null;
    let anchorOffset = 0;
    if (selection && selection.rangeCount > 0) {
        anchorNode = selection.anchorNode;
        anchorOffset = selection.anchorOffset;
    }
    if (nextInner.firstChild) {
        nodesToMove.reverse().forEach(node => {
            nextInner.insertBefore(node, nextInner.firstChild);
        });
    }
    else {
        nodesToMove.forEach(node => {
            nextInner.appendChild(node);
        });
    }
    if (anchorNode && nodesToMove.some(n => n.contains(anchorNode))) {
        if (window.setActiveEditor)
            window.setActiveEditor(nextInner);
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
