import { Image as TiptapImage } from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';

/**
 * カスタム画像拡張
 * 
 * 【重要な変更点】
 * - inline: true - 段落（p）内に画像を配置可能にする
 * - atom: true - 画像をアトムノードとして扱い、内部にキャレットを置かない
 * - selectable: true - 画像を選択可能にする
 * - Backspaceで画像段落ごと削除
 * - 画像クリック時はキャレットを画像右辺に配置
 */
export const CustomImage = TiptapImage.extend({
    // 画像を段落内に配置可能にする（インライン要素として扱う）
    inline: true,
    group: 'inline',
    
    // 画像をアトムノードとして扱う（内部にキャレットを置かない）
    atom: true,
    
    // 画像を選択可能にする
    selectable: true,
    
    // ドラッグ可能
    draggable: true,

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

    addKeyboardShortcuts() {
        return {
            // Backspaceで画像が選択されている場合、または画像の直後にいる場合は段落ごと削除
            Backspace: () => {
                const { state, view } = this.editor;
                const { selection } = state;
                const { $from, empty } = selection;
                
                // NodeSelectionで画像が選択されている場合
                if (selection.node?.type.name === 'image') {
                    // 画像を含む段落全体を削除
                    const parentPos = $from.before($from.depth);
                    const parentNode = $from.node($from.depth);
                    
                    // 親が段落で、画像のみを含む場合は段落ごと削除
                    if (parentNode.type.name === 'paragraph' && parentNode.content.size === 1) {
                        const tr = state.tr.delete(parentPos, parentPos + parentNode.nodeSize);
                        view.dispatch(tr);
                        return true;
                    }
                    
                    // それ以外は画像のみ削除
                    return this.editor.commands.deleteSelection();
                }
                
                // キャレットが空の位置にあり、直前に画像がある場合
                if (empty) {
                    const nodeBefore = $from.nodeBefore;
                    if (nodeBefore?.type.name === 'image') {
                        // 親段落を取得
                        const parentPos = $from.before($from.depth);
                        const parentNode = $from.node($from.depth);
                        
                        // 親が段落で、画像のみを含む場合は段落ごと削除
                        if (parentNode.type.name === 'paragraph' && parentNode.content.size === 1) {
                            const tr = state.tr.delete(parentPos, parentPos + parentNode.nodeSize);
                            view.dispatch(tr);
                            return true;
                        }
                        
                        // 画像のみ削除
                        const pos = $from.pos - nodeBefore.nodeSize;
                        const tr = state.tr.delete(pos, $from.pos);
                        view.dispatch(tr);
                        return true;
                    }
                }
                
                return false;
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('customImageClick'),
                props: {
                    // 画像クリック時にキャレットを画像の右辺に配置
                    handleClick: (view, pos, event) => {
                        const target = event.target as HTMLElement;
                        
                        // クリック対象が画像かチェック
                        if (target.tagName === 'IMG') {
                            const { state } = view;
                            
                            // クリック位置から画像ノードを特定
                            const imageNode = state.doc.nodeAt(pos);
                            
                            if (imageNode?.type.name === 'image') {
                                // 画像の直後にキャレットを配置
                                const afterImagePos = pos + imageNode.nodeSize;
                                const tr = state.tr.setSelection(
                                    TextSelection.create(state.doc, afterImagePos)
                                );
                                view.dispatch(tr);
                                return true;
                            }
                        }
                        
                        return false;
                    },
                },
            }),
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },
});
