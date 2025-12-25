import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const Pagination = Extension.create({
    name: 'pagination',

    addProseMirrorPlugins() {
        const extension = this;
        return [
            new Plugin({
                key: new PluginKey('pagination'),
                view(editorView) {
                    return {
                        update: (view) => {
                            const { state, dispatch } = view;
                            const pages = view.dom.querySelectorAll('section.page');

                            // A4 height in pixels (approx 1122px at 96dpi, but CSS uses mm)
                            // We rely on scrollHeight > clientHeight check which is safer for varying DPI
                            
                            let schemaChanged = false;
                            
                            // Iterate pages to check overflow
                            for (let i = 0; i < pages.length; i++) {
                                const page = pages[i];
                                const inner = page.querySelector('.page-inner') as HTMLElement;
                                
                                // Buffer of 1px to avoid rounding jitter
                                if (inner && inner.scrollHeight > inner.clientHeight + 1) {
                                    // Identify page position in document
                                    // This requires mapping DOM node back to ProseMirror pos
                                    const domPos = view.posAtDOM(inner, 0); 
                                    if (domPos === null) continue; // Should not happen

                                    const $pos = state.doc.resolve(domPos);
                                    // Start of the page node (inner's parent)
                                    const pageNodePos = $pos.before($pos.depth); 
                                    const pageNode = state.doc.nodeAt(pageNodePos);

                                    if (!pageNode || pageNode.type.name !== 'page') continue;

                                    const lastChild = pageNode.lastChild;
                                    if (lastChild) {
                                        // Position of the last child
                                        const lastChildPos = pageNodePos + pageNode.nodeSize - lastChild.nodeSize - 1;
                                        
                                        // Determine next page position
                                        const nextPagePos = pageNodePos + pageNode.nodeSize;
                                        const nextNode = state.doc.nodeAt(nextPagePos);

                                        let tr = state.tr;
                                        
                                        // Check if next node is a page
                                        if (!nextNode || nextNode.type.name !== 'page') {
                                            // Create new page
                                            const newPage = state.schema.nodes.page.create({ 'data-page': String(i + 2) });
                                            tr = tr.insert(nextPagePos, newPage);
                                            // Insert the overflowed content into the new page (start of its inner content)
                                            // New page structure: page > page-inner(start+1)
                                            tr = tr.insert(nextPagePos + 2, lastChild); 
                                        } else {
                                            // Move to existing next page
                                            // Insert at start of next page's inner div
                                            tr = tr.insert(nextPagePos + 2, lastChild);
                                        }
                                        
                                        // Delete from old page
                                        tr = tr.delete(lastChildPos, lastChildPos + lastChild.nodeSize); 
                                        
                                        dispatch(tr);
                                        schemaChanged = true;
                                        break; // Handle one overflow per pass to allow re-render
                                    }
                                }
                            }
                        },
                    };
                },
            }),
        ];
    },
});
