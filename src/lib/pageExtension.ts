import { Node, mergeAttributes } from '@tiptap/core';

export const PageExtension = Node.create({
    name: 'page',
    content: 'block+', // ページ内に複数のブロック要素を持つ
    defining: true,
    isolating: true,

    addAttributes() {
        return {
            'data-page': {
                default: '1',
            },
            class: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'section.page',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'section',
            mergeAttributes(HTMLAttributes, { class: 'page' }),
            ['div', { class: 'page-inner', contenteditable: 'true' }, 0],
        ];
    },
});
