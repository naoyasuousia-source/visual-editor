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
                            // ページ溢れの検知と修正
                            // 注意: 頻繁に実行すると重くなるため、debounce 等の検討も必要
                            const { state, dispatch } = view;
                            const pages = view.dom.querySelectorAll('section.page');

                            pages.forEach((page, index) => {
                                const inner = page.querySelector('.page-inner') as HTMLElement;
                                if (inner && inner.scrollHeight > inner.clientHeight + 1) {
                                    // 溢れが発生
                                    // 最後の子要素を特定して、次のページへ移動させる
                                    // 実際にはProseMirrorの座標系で計算する必要がある
                                    const { doc, tr } = state;
                                    
                                    // ページノードの範囲を特定
                                    let pageNodePos = -1;
                                    doc.descendants((node, pos) => {
                                        if (node.type.name === 'page') {
                                            const pIdx = node.attrs['data-page'];
                                            if (String(pIdx) === String(index + 1)) {
                                                pageNodePos = pos;
                                            }
                                        }
                                        return false;
                                    });

                                    if (pageNodePos !== -1) {
                                        const pageNode = doc.nodeAt(pageNodePos);
                                        if (pageNode && pageNode.childCount > 1) {
                                            // 最後の段落を次のページへ
                                            const lastChild = pageNode.lastChild;
                                            if (lastChild) {
                                                const lastChildPos = pageNodePos + pageNode.nodeSize - lastChild.nodeSize - 1;
                                                
                                                // 次のページが存在するか確認、なければ作成
                                                let nextPagePos = pageNodePos + pageNode.nodeSize;
                                                const nextNode = doc.nodeAt(nextPagePos);
                                                
                                                if (!nextNode || nextNode.type.name !== 'page') {
                                                    // 新しいページを作成
                                                    const newPage = view.state.schema.nodes.page.create({ 'data-page': String(index + 2) });
                                                    dispatch(tr.insert(nextPagePos, newPage));
                                                    return;
                                                }

                                                // ノードを移動
                                                tr.delete(lastChildPos, lastChildPos + lastChild.nodeSize);
                                                tr.insert(nextPagePos + 1, lastChild);
                                                dispatch(tr);
                                            }
                                        }
                                    }
                                }
                            });
                        },
                    };
                },
            }),
        ];
    },
});
