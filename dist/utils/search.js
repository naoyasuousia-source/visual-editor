/**
 * Removes all search highlights from the document.
 */
export function clearSearchHighlights() {
    const highlights = document.querySelectorAll('.search-match');
    highlights.forEach(h => {
        const parent = h.parentNode;
        if (parent) {
            const text = h.textContent || '';
            const textNode = document.createTextNode(text);
            parent.replaceChild(textNode, h);
            // Normalizing the parent will merge adjacent text nodes
            parent.normalize();
        }
    });
}
/**
 * Counts the number of matches for the query in the given containers.
 */
export function countSearchMatches(query, containers) {
    if (!query || query.length < 1)
        return 0;
    let count = 0;
    const lowerQuery = query.toLowerCase();
    containers.forEach(container => {
        // Find all elements that might contain text (excluding our own highlight spans)
        const elements = [container, ...Array.from(container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span:not(.search-match)'))];
        elements.forEach(el => {
            // Process text nodes of this element only
            const childNodes = Array.from(el.childNodes);
            for (const node of childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.nodeValue || '';
                    let idx = text.toLowerCase().indexOf(lowerQuery);
                    while (idx !== -1) {
                        count++;
                        idx = text.toLowerCase().indexOf(lowerQuery, idx + 1);
                    }
                }
            }
        });
    });
    return count;
}
/**
 * Highlights matches of the query in the given containers.
 * Returns the first highlighted element.
 */
export function highlightSearchMatches(query, containers) {
    if (!query || query.length < 1)
        return null;
    let firstFound = null;
    containers.forEach(container => {
        // Find all elements that might contain text (excluding our own highlight spans)
        const elements = [container, ...Array.from(container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span:not(.search-match)'))];
        elements.forEach(el => {
            // Process text nodes of this element only (non-recursive to avoid double processing)
            const childNodes = Array.from(el.childNodes);
            for (const node of childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const match = highlightAllInTextNode(node, query);
                    if (match && !firstFound) {
                        firstFound = match;
                    }
                }
            }
        });
    });
    if (firstFound) {
        firstFound.classList.add('current');
    }
    return firstFound;
}
function highlightAllInTextNode(textNode, query) {
    const lowerQuery = query.toLowerCase();
    let firstSpan = null;
    let currentNode = textNode;
    while (currentNode) {
        const text = currentNode.nodeValue || '';
        const idx = text.toLowerCase().indexOf(lowerQuery);
        if (idx === -1)
            break;
        try {
            const range = document.createRange();
            range.setStart(currentNode, idx);
            range.setEnd(currentNode, idx + query.length);
            const span = document.createElement('span');
            span.className = 'search-match';
            range.surroundContents(span);
            if (!firstSpan)
                firstSpan = span;
            // surroundContents splits the text node. The part after the span is nextSibling.
            const nextNode = span.nextSibling;
            if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
                currentNode = nextNode;
            }
            else {
                currentNode = null;
            }
        }
        catch (e) {
            // Skip if it fails (e.g. range issues)
            break;
        }
    }
    return firstSpan;
}
