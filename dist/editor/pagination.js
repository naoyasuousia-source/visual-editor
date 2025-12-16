import { createPage, initPages } from './page.js';
import { getPagesContainerElement } from '../globals.js';
import { renumberParagraphs } from './formatting.js';
export function checkPageOverflow(pageInner) {
    if (!pageInner)
        return;
    // Check if content exceeds the page height
    // pageInner is 100% height of .page (297mm). 
    // If scrollHeight > clientHeight, it means content is overflowing.
    // However, sometimes a single element might be too tall (like a huge image), 
    // but usually text flows.
    // We add a small buffer (1px) to avoid jitter
    if (pageInner.scrollHeight > pageInner.clientHeight + 1) {
        moveOverflowingContent(pageInner);
    }
}
function moveOverflowingContent(pageInner) {
    const pageSection = pageInner.closest('section.page');
    if (!pageSection)
        return;
    // Find the split point
    // We look for children whose bottom edge is beyond the explicit content area
    // effectively, clientHeight includes padding. 
    // The visual content area end is clientHeight - paddingBottom?
    // easier: computed style height.
    // Actually, simply checking if an element's offsetBottom > clientHeight is robust?
    // Let's rely on the fact that if scrollHeight > clientHeight, access nodes from the end
    // until we find one that is fully or partially invisible?
    // Simple strategy: Move the *last* block element to the next page, 
    // then check again. If still overflowing, move another.
    // This is inefficient for large overflows but safe for single-line additions.
    // For large pastes, we might need bulk moving.
    // Better strategy: Binary search or forward scan?
    // Forward scan: Find the first element where (offsetTop + offsetHeight) > clientHeight.
    // Note: padding-top affects offsetTop relative to offsetParent (pageInner).
    const children = Array.from(pageInner.children);
    if (children.length === 0)
        return;
    const limit = pageInner.clientHeight;
    // We might need to consider padding-bottom if we want to respect the margin visually.
    // But clientHeight includes padding. 
    // If we write into padding, it's technically inside clientHeight but visually in margin?
    // The CSS defines padding: var(--page-margin).
    // So distinct content box is clientHeight - paddingBottom - paddingTop.
    // But children are positioned inside content box?
    // No, standard box model: padding surrounds content. 
    // overflow: auto causes scrollbars when content exceeds padding box?
    // Let's assume we want to keep children fully inside the 'content box' (inside margins).
    // Actually pageInner has padding, so children are laid out *inside* that padding.
    // So if child.offsetTop + child.offsetHeight > pageInner.clientHeight - paddingBottom?
    // No, if pageInner has padding, the children are offset by paddingTop.
    // The available height for children is clientHeight - paddingTop - paddingBottom?
    // scrollHeight will grow as children are added.
    // Let's use a simpler heuristic for now: 
    // Any child whose bottom edge > pageInner.clientHeight (which includes padding) is definitely overflowing 
    // if we consider 'overflow' meaning 'triggering scroll'.
    let splitIndex = -1;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // We use offsetTop + offsetHeight. 
        // Note: offsetTop is relative to offsetParent. if pageInner is active (relative), it works.
        const bottom = child.offsetTop + child.offsetHeight;
        if (bottom > limit) {
            splitIndex = i;
            break;
        }
    }
    if (splitIndex === -1) {
        // No single child crosses the line, but maybe total height does?
        // Or maybe only partially? 
        // If scrollHeight > clientHeight but no child explicitly crosses 'limit', 
        // it might be margins collapsing or something.
        // Fallback: move the last element.
        splitIndex = children.length - 1;
    }
    // Move children from splitIndex to end
    const nodesToMove = children.slice(splitIndex);
    if (nodesToMove.length === 0)
        return;
    // Get or create next page
    let nextPage = pageSection.nextElementSibling;
    if (!nextPage || !nextPage.classList.contains('page')) {
        const pagesContainer = getPagesContainerElement();
        if (pagesContainer) {
            // Create new page
            const newPage = createPage(Number(pageSection.dataset.page) + 1, '');
            // Insert after current page
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
    // Prepend to next page
    // We need to place them at the beginning.
    // If next page has content, we prepend.
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
    // Fix focus if the focused element was moved
    // (Browser might handle this if we just move nodes, but selection might be lost if we clonse/replace)
    // appendChild moves the node, so focus *should* be preserved if it's the active element?
    // Actually, moving a node usually blurs it. We might need to restore selection.
    renumberParagraphs();
    // Recursively check next page
    checkPageOverflow(nextInner);
}
