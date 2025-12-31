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
