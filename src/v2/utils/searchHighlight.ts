/**
 * Search and Highlight Utilities
 * 
 * Based on v1's search.ts for text searching and highlighting functionality.
 * Used in jump navigation to highlight search matches.
 */

/**
 * Remove all search highlights from the document
 */
export function clearSearchHighlights(): void {
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
 * Count the number of matches for the query in the given containers
 * 
 * @param query - The search query string
 * @param containers - Array of container elements to search within
 * @returns Count of matches found
 */
export function countSearchMatches(query: string, containers: NodeListOf<Element> | Element[]): number {
    if (!query || query.length < 1) return 0;
    
    let count = 0;
    const lowerQuery = query.toLowerCase();
    
    containers.forEach(container => {
        // Tiptap/ProseMirrorのDOM構造に対応: より広範囲に検索
        const elements = [
            container, 
            ...Array.from(container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span:not(.search-match), div'))
        ];
        
        elements.forEach(el => {
            // Process all text nodes recursively
            const countInNode = (node: Node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.nodeValue || '';
                    let idx = text.toLowerCase().indexOf(lowerQuery);
                    while (idx !== -1) {
                        count++;
                        idx = text.toLowerCase().indexOf(lowerQuery, idx + 1);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    if (!element.classList.contains('search-match')) {
                        Array.from(node.childNodes).forEach(countInNode);
                    }
                }
            };
            
            Array.from(el.childNodes).forEach(countInNode);
        });
    });
    
    return count;
}

/**
 * Highlight all matches in a single text node
 * 
 * @param textNode - The text node to search and highlight
 * @param query - The search query
 * @returns The first created highlight span or null
 */
function highlightAllInTextNode(textNode: Text, query: string): HTMLElement | null {
    const lowerQuery = query.toLowerCase();
    let firstSpan: HTMLElement | null = null;
    let currentNode: Text | null = textNode;
    
    while (currentNode) {
        const text = currentNode.nodeValue || '';
        const idx = text.toLowerCase().indexOf(lowerQuery);
        if (idx === -1) break;
        
        try {
            const range = document.createRange();
            range.setStart(currentNode, idx);
            range.setEnd(currentNode, idx + query.length);
            
            const span = document.createElement('span');
            span.className = 'search-match';
            range.surroundContents(span);
            
            if (!firstSpan) firstSpan = span;
            
            // surroundContents splits the text node. The part after the span is nextSibling.
            const nextNode = span.nextSibling;
            if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
                currentNode = nextNode as Text;
            } else {
                currentNode = null;
            }
        } catch (e) {
            // Skip if it fails (e.g. range issues)
            break;
        }
    }
    
    return firstSpan;
}

/**
 * Highlight matches of the query in the given containers
 * Returns the first highlighted element
 * 
 * @param query - The search query string
 * @param containers - Array of container elements to search within
 * @returns The first highlighted element or null
 */
export function highlightSearchMatches(
    query: string, 
    containers: NodeListOf<Element> | Element[]
): HTMLElement | null {
    if (!query || query.length < 1) return null;
    
    let firstFound: HTMLElement | null = null;
    
    containers.forEach(container => {
        // Tiptap/ProseMirrorのDOM構造に対応: より広範囲に検索
        // .ProseMirror内のすべての段落要素とspan要素を取得
        const elements = [
            container, 
            ...Array.from(container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span:not(.search-match), div'))
        ];
        
        elements.forEach(el => {
            // Process all text nodes recursively (Tiptap uses nested structure)
            const processNode = (node: Node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const match = highlightAllInTextNode(node as Text, query);
                    if (match && !firstFound) {
                        firstFound = match;
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    // Skip already highlighted elements
                    const element = node as Element;
                    if (!element.classList.contains('search-match')) {
                        Array.from(node.childNodes).forEach(processNode);
                    }
                }
            };
            
            // Start processing from the element
            Array.from(el.childNodes).forEach(processNode);
        });
    });
    
    // Mark first match as current
    if (firstFound) {
        (firstFound as HTMLElement).classList.add('current');
    }
    
    return firstFound;
}

