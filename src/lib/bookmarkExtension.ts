import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * ブックマーク（リンク先）マーク拡張
 * 選択したテキストにブックマークIDを付与し、リンク先として使用可能にする
 */
export const Bookmark = Mark.create({
    name: 'bookmark',

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: element => element.getAttribute('id'),
                renderHTML: attributes => {
                    if (!attributes.id) return {};
                    return { id: attributes.id };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[id^="bm-"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes), 0];
    },

    addCommands() {
        return {
            setBookmark: (id: string) => ({ commands }) => {
                return commands.setMark(this.name, { id });
            },
            unsetBookmark: () => ({ commands }) => {
                return commands.unsetMark(this.name);
            },
        };
    },
});
