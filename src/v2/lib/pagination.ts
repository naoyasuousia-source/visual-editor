import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/**
 * Pagination Extension
 * 
 * Automatically creates new pages when content overflows.
 * Based on v1's overflow detection logic.
 */
export const Pagination = Extension.create({
    name: 'pagination',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('pagination'),
                view(editorView) {
                    let isProcessing = false;

                    const checkOverflow = () => {
                        if (isProcessing) return;
                        isProcessing = true;

                        try {
                            const { state, dispatch } = editorView;
                            const pages = editorView.dom.querySelectorAll('section.page');

                            for (let i = 0; i < pages.length; i++) {
                                const page = pages[i];
                                const inner = page.querySelector('.page-inner') as HTMLElement;
                                
                                if (!inner) continue;

                                // Check if content overflows (1px buffer for rounding)
                                if (inner.scrollHeight > inner.clientHeight + 1) {
                                    console.log(`Page ${i + 1} overflow detected`);

                                    // Find the page node in Tiptap document
                                    const domPos = editorView.posAtDOM(page, 0);
                                    if (domPos === null) continue;

                                    const $pos = state.doc.resolve(domPos);
                                    const pageNodePos = $pos.before($pos.depth);
                                    const pageNode = state.doc.nodeAt(pageNodePos);

                                    if (!pageNode || pageNode.type.name !== 'page') continue;

                                    // Get the last child of the page
                                    const lastChild = pageNode.lastChild;
                                    if (!lastChild) continue;

                                    // Position of the last child
                                    const lastChildPos = pageNodePos + pageNode.nodeSize - lastChild.nodeSize - 1;
                                    
                                    // Position where next page should be inserted
                                    const nextPagePos = pageNodePos + pageNode.nodeSize;
                                    const nextNode = state.doc.nodeAt(nextPagePos);

                                    let tr = state.tr;
                                    
                                    // Check if next node is a page
                                    if (!nextNode || nextNode.type.name !== 'page') {
                                        // Create new page with initial paragraph
                                        console.log(`Creating new page ${i + 2}`);
                                        
                                        // Create empty paragraph for the new page
                                        const emptyParagraph = state.schema.nodes.paragraph.create();
                                        
                                        // Create new page with the empty paragraph
                                        const newPage = state.schema.nodes.page.create(
                                            { 'data-page': String(i + 2) },
                                            emptyParagraph
                                        );
                                        
                                        tr = tr.insert(nextPagePos, newPage);
                                        
                                        // Move the overflowed content to the new page (after the empty paragraph)
                                        tr = tr.insert(nextPagePos + 3, lastChild);
                                    } else {
                                        // Move to existing next page
                                        tr = tr.insert(nextPagePos + 2, lastChild);
                                    }
                                    
                                    // Delete from old page
                                    tr = tr.delete(lastChildPos, lastChildPos + lastChild.nodeSize);
                                    
                                    dispatch(tr);
                                    
                                    // Re-check after state update
                                    setTimeout(() => {
                                        isProcessing = false;
                                        checkOverflow();
                                    }, 50);
                                    return;
                                }
                            }
                        } finally {
                            isProcessing = false;
                        }
                    };

                    // Debounced overflow check
                    let timeoutId: NodeJS.Timeout | null = null;
                    const debouncedCheck = () => {
                        if (timeoutId) clearTimeout(timeoutId);
                        timeoutId = setTimeout(() => checkOverflow(), 200);
                    };

                    return {
                        update: (view, prevState) => {
                            // Only check if document changed
                            if (!view.state.doc.eq(prevState.doc)) {
                                debouncedCheck();
                            }
                        },
                    };
                },
            }),
        ];
    },
});
