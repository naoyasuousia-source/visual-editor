import { Extension } from '@tiptap/core';

export const StyleAttributes = Extension.create({
    name: 'styleAttributes',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading', 'page'],
                attributes: {
                    // 配置 (left, center, right) -> .inline-align-xxx
                    align: {
                        default: 'left',
                        parseHTML: element => {
                            const classes = Array.from(element.classList);
                            const align = classes.find(c => c.startsWith('inline-align-'))?.replace('inline-align-', '');
                            return align || 'left';
                        },
                        renderHTML: attributes => {
                            if (attributes.align === 'left') return {};
                            return { class: `inline-align-${attributes.align}` };
                        },
                    },
                    // 余白 (xs, s, m, l, xl) -> .inline-spacing-xxx
                    spacing: {
                        default: null,
                        parseHTML: element => {
                            const classes = Array.from(element.classList);
                            return classes.find(c => c.startsWith('inline-spacing-'))?.replace('inline-spacing-', '');
                        },
                        renderHTML: attributes => {
                            if (!attributes.spacing) return {};
                            return { class: `inline-spacing-${attributes.spacing}` };
                        },
                    },
                    // インデント (1-5) -> .indent-x
                    indent: {
                        default: null,
                        parseHTML: element => {
                            const m = element.className.match(/indent-(\d+)/);
                            return m ? m[1] : null;
                        },
                        renderHTML: attributes => {
                            if (!attributes.indent) return {};
                            return { class: `indent-${attributes.indent}` };
                        },
                    },
                    // ぶら下げ -> .hanging-indent
                    hanging: {
                        default: false,
                        parseHTML: element => element.classList.contains('hanging-indent'),
                        renderHTML: attributes => {
                            if (!attributes.hanging) return {};
                            return { class: 'hanging-indent' };
                        },
                    },
                },
            },
        ];
    },
});
