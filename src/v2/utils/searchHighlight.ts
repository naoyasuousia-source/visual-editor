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
            if (!element.classList.contains('search-match')) {
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
            // 方法1: テキストノード分割 + span挿入（より堅牢）
            // テキストノードを3つに分割: [前のテキスト][マッチ部分][後のテキスト]
            const parent = currentNode.parentNode;
            if (!parent) break;
            
            // マッチ部分の前で分割（splitTextは新しいテキストノードを返す）
            const matchStartNode: Text = currentNode.splitText(idx);
            
            // マッチ部分の後で分割
            const afterNode: Text = matchStartNode.splitText(query.length);
            
            // span要素を作成してマッチ部分をラップ
            const span = document.createElement('span');
            span.className = 'search-match';
            span.textContent = matchStartNode.nodeValue;
            
            // マッチ部分のテキストノードをspanで置き換え
            parent.replaceChild(span, matchStartNode);
            
            if (!firstSpan) firstSpan = span;
            
            // 後のテキストノードで続行
            currentNode = afterNode;
        } catch (e) {
            // フォールバック: 従来のrange.surroundContentsを試行
            try {
                const range = document.createRange();
                range.setStart(currentNode, idx);
                range.setEnd(currentNode, idx + query.length);
                
                const span = document.createElement('span');
                span.className = 'search-match';
                range.surroundContents(span);
                
                if (!firstSpan) firstSpan = span;
                
                const nextNode = span.nextSibling;
                if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
                    currentNode = nextNode as Text;
                } else {
                    currentNode = null;
                }
            } catch (e2) {
                // 両方失敗した場合はスキップ
                break;
            }
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
            if (!element.classList.contains('search-match')) {
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
    
    // Mark first match as current
    if (firstFound) {
        (firstFound as HTMLElement).classList.add('current');
    }
    
    return firstFound;
}

