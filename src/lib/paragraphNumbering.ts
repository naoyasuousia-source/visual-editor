import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface ParagraphNumberingOptions {
    isWordMode: boolean;
}

export const ParagraphNumbering = Extension.create<ParagraphNumberingOptions>({
    name: 'paragraphNumbering',

    addOptions() {
        return {
            isWordMode: false,
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading'],
                attributes: {
                    'data-para': {
                        default: null,
                        keepOnSplit: false,
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
        const extension = this;
        return [
            new Plugin({
                key: new PluginKey('paragraphNumbering'),
                appendTransaction: (transactions, oldState, newState) => {
                    if (transactions.some(tr => tr.docChanged) === false) return;

                    const { tr } = newState;
                    const isWordMode = extension.options.isWordMode;

                    let globalCounter = 1;
                    let pageCounter = 1;

                    newState.doc.descendants((node, pos) => {
                        if (node.type.name === 'page') {
                            const pageNum = String(pageCounter++);
                            
                            // ページ番号を更新
                            if (node.attrs['data-page'] !== pageNum) {
                                tr.setNodeMarkup(pos, undefined, {
                                    ...node.attrs,
                                    'data-page': pageNum,
                                });
                            }

                            let innerCounter = 1;

                            node.descendants((child, childPos) => {
                                if (child.type.name === 'paragraph' || child.type.name === 'heading') {
                                    const absolutePos = pos + childPos + 1;
                                    const expectedIdx = isWordMode ? String(globalCounter++) : String(innerCounter++);
                                    const expectedId = isWordMode ? `p${expectedIdx}` : `p${pageNum}-${expectedIdx}`;

                                    if (child.attrs['data-para'] !== expectedIdx || child.attrs['id'] !== expectedId) {
                                        tr.setNodeMarkup(absolutePos, undefined, {
                                            ...child.attrs,
                                            'data-para': expectedIdx,
                                            id: expectedId,
                                        });
                                    }
                                    return false; // 段落内（テキスト等）は探索しない
                                }
                                return true;
                            });
                            return false; // ページ内は探索済みなので、doc.descendantsとしての再帰を停止
                        }
                        return true;
                    });

                    return tr.docChanged ? tr : null;
                },
            }),
        ];
    },
});
