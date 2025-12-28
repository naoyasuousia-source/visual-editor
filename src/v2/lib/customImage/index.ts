import { Image as TiptapImage } from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { createImageNodeView } from './nodeView';

/**
 * カスタム画像拡張 (CustomImage)
 * 画像キャレット制御とメタデータ（タイトル等）の表示を管理します。
 * 
 * 詳細な仕様については src/v2/lib/customImage/nodeView.ts を参照。
 */
export const CustomImage = TiptapImage.extend({
    inline: true,
    group: 'inline',
    atom: true,
    selectable: false,
    draggable: false,

    addAttributes() {
        return {
            ...this.parent?.(),
            size: {
                default: 'm',
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

    addKeyboardShortcuts() {
        return {
            Backspace: () => {
                const { state, view } = this.editor;
                const { selection } = state;
                const { $from, empty } = selection;
                
                if (empty && $from.nodeBefore?.type.name === 'image') {
                    const parentNode = $from.node($from.depth);
                    if (parentNode.type.name === 'paragraph' && parentNode.content.size === 1) {
                        const parentPos = $from.before($from.depth);
                        const tr = state.tr.delete(parentPos, parentPos + parentNode.nodeSize);
                        view.dispatch(tr);
                        return true;
                    }
                    const imagePos = $from.pos - $from.nodeBefore.nodeSize;
                    const tr = state.tr.delete(imagePos, $from.pos);
                    view.dispatch(tr);
                    return true;
                }
                return false;
            },
            Enter: () => {
                const { state, view } = this.editor;
                const { selection } = state;
                const { $from, empty } = selection;
                
                if (empty && $from.nodeBefore?.type.name === 'image') {
                    const tr = state.tr.split($from.pos);
                    view.dispatch(tr);
                    return true;
                }
                return false;
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('imageCaretPlugin'),
                appendTransaction: (transactions, oldState, newState) => {
                    const selectionChanged = transactions.some(tr => tr.selectionSet);
                    if (!selectionChanged) return null;
                    
                    const { selection } = newState;
                    if (!(selection instanceof TextSelection)) return null;
                    const { $from, empty } = selection;
                    if (!empty) return null;
                    
                    const nodeAfter = $from.nodeAfter;
                    if (nodeAfter?.type.name === 'image') {
                        const newPos = $from.pos + nodeAfter.nodeSize;
                        const tr = newState.tr.setSelection(
                            TextSelection.create(newState.doc, newPos)
                        );
                        return tr;
                    }
                    return null;
                },
            }),
        ];
    },

    addNodeView() {
        return createImageNodeView;
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },
});
