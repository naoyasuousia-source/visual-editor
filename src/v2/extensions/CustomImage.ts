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
            title: {
                default: '',
                parseHTML: element => element.getAttribute('data-title'),
                renderHTML: attributes => {
                    if (!attributes.title) return {};
                    return { 'data-title': attributes.title };
                },
            },
            titleSize: {
                default: 'default',
                parseHTML: element => element.getAttribute('data-title-size'),
                renderHTML: attributes => {
                    if (!attributes.titleSize) return {};
                    return { 'data-title-size': attributes.titleSize };
                },
            },
            caption: {
                default: '',
                parseHTML: element => element.getAttribute('data-caption'),
                renderHTML: attributes => {
                    if (!attributes.caption) return {};
                    return { 'data-caption': attributes.caption };
                },
            },
            tag: {
                default: '',
                parseHTML: element => element.getAttribute('data-tag'),
                renderHTML: attributes => {
                    if (!attributes.tag) return {};
                    return { 'data-tag': attributes.tag };
                },
            },
        };
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },
});
