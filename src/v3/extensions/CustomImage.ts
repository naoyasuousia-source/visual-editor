import { Image as TiptapImage } from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

export const CustomImage = TiptapImage.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            size: {
                default: 'm', // Default to medium (.img-m)
                parseHTML: element => {
                    const classes = Array.from(element.classList);
                    return classes.find(c => c.startsWith('img-'))?.replace('img-', '') || 'm';
                },
                renderHTML: attributes => {
                    return { class: `img-${attributes.size}` };
                },
            },
            hasBorder: {
                default: false,
                parseHTML: element => element.classList.contains('has-border'),
                renderHTML: attributes => {
                    if (!attributes.hasBorder) return {};
                    return { class: 'has-border' };
                },
            },
        };
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },
});
