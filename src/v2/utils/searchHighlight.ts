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
    const highlights = document.querySelectorAll('[data-search-match]');
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
    
    // 再帰的にテキストノードを検索（重複を避けるため、containerから直接処理）
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
            // 既にハイライト済みの要素はスキップ
            if (!element.hasAttribute('data-search-match')) {
                Array.from(node.childNodes).forEach(countInNode);
            }
        }
    };
    
    // 各containerから直接再帰的に処理（querySelectorAllは使わない）
    containers.forEach(container => {
        countInNode(container);
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
    
    while (currentNode && currentNode.parentNode) {
        const text = currentNode.nodeValue || '';
        const idx = text.toLowerCase().indexOf(lowerQuery);
        if (idx === -1) break;
        
        try {
            const parent = currentNode.parentNode;
            if (!parent) break;
            
            // テキストノードを分割
            const matchStartNode: Text = currentNode.splitText(idx);
            const afterNode: Text = matchStartNode.splitText(query.length);
            
            // span要素を作成してTailwindクラスを適用
            const span = document.createElement('span');
            // Tailwindクラスでオレンジ系ハイライトを適用
            span.className = 'bg-orange-400 text-black font-bold rounded px-0.5 shadow-md';
            span.setAttribute('data-search-match', 'true');
            span.textContent = matchStartNode.nodeValue;
            
            // マッチ部分のテキストノードをspanで置換
            parent.replaceChild(span, matchStartNode);
            
            if (!firstSpan) firstSpan = span;
            
            // 後のテキストノードで続行
            currentNode = afterNode;
        } catch (e) {
            // エラー発生時はスキップ
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
    
    // 先にすべてのテキストノードを収集してから処理
    // （ハイライト処理中にDOMが変更されるため、事前収集が必要）
    const textNodes: Text[] = [];
    
    const collectTextNodes = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue || '';
            const lowerText = text.toLowerCase();
            const lowerQuery = query.toLowerCase();
            if (lowerText.includes(lowerQuery)) {
                textNodes.push(node as Text);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // 既にハイライト済みの要素はスキップ
            if (!element.hasAttribute('data-search-match')) {
                Array.from(node.childNodes).forEach(collectTextNodes);
            }
        }
    };
    
    // 各containerからテキストノードを収集
    containers.forEach(container => {
        collectTextNodes(container);
    });
    
    // 収集したテキストノードを順次ハイライト
    for (const textNode of textNodes) {
        // テキストノードがまだDOMに存在するか確認
        if (textNode.parentNode) {
            const match = highlightAllInTextNode(textNode, query);
            if (match && !firstFound) {
                firstFound = match;
            }
        }
    }
    
    // Mark first match as current with brighter style
    if (firstFound) {
        // currentクラスをTailwindで適用（より明るいオレンジ）
        firstFound.classList.remove('bg-orange-400');
        firstFound.classList.add('bg-orange-500', 'text-white', 'scale-110', 'z-10');
    }
    
    return firstFound;
}

