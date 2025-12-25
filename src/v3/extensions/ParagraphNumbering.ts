import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const ParagraphNumbering = Extension.create({
    name: 'paragraphNumbering',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading'],
                attributes: {
                    'data-para': {
                        default: null,
                        keepOnSplit: false, // 改行時は新しい番号を振るため
                        parseHTML: element => element.getAttribute('data-para'),
                        renderHTML: attributes => {
                            if (!attributes['data-para']) return {};
                            return { 'data-para': attributes['data-para'] };
                        },
                    },
                    id: {
                        default: null,
                        parseHTML: element => element.getAttribute('id'),
                        renderHTML: attributes => {
                            if (!attributes.id) return {};
                            return { id: attributes.id };
                        },
                    },
                },
            },
        ];
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('paragraphNumbering'),
                appendTransaction: (transactions, oldState, newState) => {
                    // ドキュメントに変更がない場合は何もしない
                    if (transactions.some(tr => tr.docChanged) === false) return;

                    const { tr } = newState;
                    let pageCounter = 1;
                    let paraCounter = 1;

                    newState.doc.descendants((node, pos) => {
                        if (node.type.name === 'page') {
                            // ページごとのカウンターリセット（標準モードの場合）
                            paraCounter = 1;
                            const pageNum = node.attrs['data-page'] || String(pageCounter++);

                            // ページ内の段落をスキャン
                            node.descendants((child, childPos) => {
                                const absolutePos = pos + childPos + 1;
                                if (child.type.name === 'paragraph' || child.type.name === 'heading') {
                                    const expectedIdx = String(paraCounter++);
                                    const expectedId = `p${pageNum}-${expectedIdx}`;

                                    if (child.attrs['data-para'] !== expectedIdx || child.attrs['id'] !== expectedId) {
                                        tr.setNodeMarkup(absolutePos, undefined, {
                                            ...child.attrs,
                                            'data-para': expectedIdx,
                                            id: expectedId,
                                        });
                                    }
                                }
                                return false; // 段落の中身（テキスト）までは追わない
                            });
                        }
                    });

                    return tr.docChanged ? tr : null;
                },
            }),
        ];
    },
});
