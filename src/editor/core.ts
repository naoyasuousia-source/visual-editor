
// Core editor state management and synchronization logic

// Note: Window interface extension is in types.ts.

export function setActiveEditor(inner: HTMLElement | null): void {
    window.currentEditor = inner;
    document.querySelectorAll('section.page').forEach(p => p.classList.remove('active'));
    if (inner) {
        const page = inner.closest('section.page');
        if (page) page.classList.add('active');
    }
}

export function getCurrentParagraph(): Element | null {
    const currentEditor = window.currentEditor;
    if (!currentEditor) return null;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return null;

    let node = sel.anchorNode;
    if (!currentEditor.contains(node)) return null;

    while (node && !(node.nodeType === 1 && /^(p|h[1-6]|div)$/i.test(node.nodeName))) {
        node = node.parentNode;
    }
    return node as Element;
}

const pagesContainerElement = document.getElementById('pages-container');
const sourceElement = document.getElementById('source') as HTMLTextAreaElement | null;

export function syncToSource(): void {
    if (!pagesContainerElement || !sourceElement) return;
    sourceElement.value = pagesContainerElement.innerHTML;
}
