import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { 
    computeSelectionStateFromRange, 
    restoreRangeFromSelectionState 
} from '@/utils/selectionState';

/**
 * Pagination Extension (Enhanced)
 * 
 * Based on v1's precise overflow detection and multi-paragraph movement logic.
 * Key improvements over basic v2 implementation:
 * - Precise overflow detection using offsetTop/offsetHeight
 * - Multiple paragraph movement in one go
 * - Selection state preservation across pages
 * - Recursive overflow checking
 */
export const Pagination = Extension.create({
    name: 'pagination',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('pagination'),
                view(editorView) {
                    let isProcessing = false; // Prevent re\-entry

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

                                // Buffer of 1px to avoid rounding jitter (v1 approach)
                                if (inner.scrollHeight > inner.clientHeight + 1) {
                                    // Save current selection state
                                    const selection = window.getSelection();
                                    let savedSelectionState = null;
                                    if (selection && selection.rangeCount > 0) {
                                        const range = selection.getRangeAt(0);
                                        savedSelectionState = computeSelectionStateFromRange(
                                            range, 
                                            editorView.dom as HTMLElement
                                        );
                                    }

                                    // Find which paragraphs are overflowing (v1 logic)
                                    const children = Array.from(inner.children) as HTMLElement[];
                                    if (children.length === 0) continue;

                                    const limit = inner.clientHeight;
                                    let splitIndex = -1;

                                    // Find first overflowing child using offsetTop + offsetHeight
                                    for (let j = 0; j < children.length; j++) {
                                        const child = children[j];
                                        if (child.offsetTop + child.offsetHeight > limit) {
                                            splitIndex = j;
                                            break;
                                        }
                                    }

                                    if (splitIndex === -1) {
                                        // All children fit, but scrollHeight is larger
                                        // Move last child (safety fallback)
                                        splitIndex = children.length - 1;
                                    }

                                    const nodesToMove = children.slice(splitIndex);
                                    if (nodesToMove.length === 0) continue;

                                    // Get or create next page
                                    let nextPage = page.nextElementSibling as HTMLElement;
                                    if (!nextPage || !nextPage.classList.contains('page')) {
                                        // Create new page via Tiptap transaction
                                        const domPos = editorView.posAtDOM(page, 0);
                                        if (domPos === null) continue;

                                        const $pos = state.doc.resolve(domPos);
                                        const pageNodePos = $pos.before($pos.depth);
                                        const pageNode = state.doc.nodeAt(pageNodePos);

                                        if (!pageNode || pageNode.type.name !== 'page') continue;

                                        const nextPagePos = pageNodePos + pageNode.nodeSize;
                                        const newPage = state.schema.nodes.page.create({ 
                                            'data-page': String(i + 2) 
                                        });

                                        const tr = state.tr.insert(nextPagePos, newPage);
                                        dispatch(tr);

                                        // Re-query after DOM update
                                        setTimeout(() => checkOverflow(), 10);
                                        return;
                                    }

                                    // Move overflowing nodes to next page
                                    const nextInner = nextPage.querySelector('.page-inner') as HTMLElement;
                                    if (!nextInner) continue;

                                    // Check if any moved node contains the current selection
                                    let selectionMoved = false;
                                    if (selection && selection.anchorNode) {
                                        selectionMoved = nodesToMove.some(n => n.contains(selection.anchorNode));
                                    }

                                    // Move nodes (DOM manipulation, then sync to Tiptap)
                                    if (nextInner.firstChild) {
                                        nodesToMove.reverse().forEach(node => {
                                            nextInner.insertBefore(node, nextInner.firstChild);
                                        });
                                    } else {
                                        nodesToMove.forEach(node => {
                                            nextInner.appendChild(node);
                                        });
                                    }

                                    // Restore selection if it was in moved content
                                    if (selectionMoved && savedSelectionState) {
                                        const restored = restoreRangeFromSelectionState(savedSelectionState);
                                        if (restored && selection) {
                                            selection.removeAllRanges();
                                            selection.addRange(restored);
                                        }
                                    }

                                    // Recursive check on next page (v1 approach)
                                    setTimeout(() => checkOverflow(), 50);
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
                        timeoutId = setTimeout(() => checkOverflow(), 100);
                    };

                    return {
                        update: (view) => {
                            debouncedCheck();
                        },
                    };
                },
            }),
        ];
    },
});
