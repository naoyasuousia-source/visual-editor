import { Image as TiptapImage } from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';

/**
 * カスタム画像拡張
 * 
 * 【重要な変更点】
 * - inline: true - 段落（p）内に画像を配置可能にする
 * - atom: true - 画像をアトムノードとして扱い、内部にキャレットを置かない
 * - selectable: true - 画像を選択可能にする（コンテキストメニュー操作のため必須）
 * - Backspaceで画像段落ごと削除
 * - 画像クリック時はNodeSelectionで画像を選択（右クリックメニューが動作するように）
 */
export const CustomImage = TiptapImage.extend({
    inline: true,
    group: 'inline',
    atom: true,
    selectable: true, // コンテキストメニューが動作するために必須
    draggable: true,

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
                
                // NodeSelectionで画像が選択されている場合
                if (selection instanceof NodeSelection && selection.node?.type.name === 'image') {
                    const parentPos = $from.before($from.depth);
                    const parentNode = $from.node($from.depth);
                    
                    if (parentNode.type.name === 'paragraph' && parentNode.content.size === 1) {
                        const tr = state.tr.delete(parentPos, parentPos + parentNode.nodeSize);
                        view.dispatch(tr);
                        return true;
                    }
                    
                    return this.editor.commands.deleteSelection();
                }
                
                // キャレットが空の位置にあり、直前に画像がある場合
                if (empty) {
                    const nodeBefore = $from.nodeBefore;
                    if (nodeBefore?.type.name === 'image') {
                        const parentPos = $from.before($from.depth);
                        const parentNode = $from.node($from.depth);
                        
                        if (parentNode.type.name === 'paragraph' && parentNode.content.size === 1) {
                            const tr = state.tr.delete(parentPos, parentPos + parentNode.nodeSize);
                            view.dispatch(tr);
                            return true;
                        }
                        
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

    // カスタムNodeView: 画像クリック時に画像を選択（右クリックメニュー対応）
    addNodeView() {
        return ({ node, getPos, editor }) => {
            const dom = document.createElement('img');
            
            // 属性を設定
            dom.src = node.attrs.src || '';
            dom.alt = node.attrs.alt || '';
            
            // クラスを設定
            if (node.attrs.size) {
                dom.classList.add(`img-${node.attrs.size}`);
            }
            if (node.attrs.hasBorder) {
                dom.classList.add('has-border');
            }
            
            // データ属性を設定
            if (node.attrs.title) dom.dataset.title = node.attrs.title;
            if (node.attrs.titleSize) dom.dataset.titleSize = node.attrs.titleSize;
            if (node.attrs.caption) dom.dataset.caption = node.attrs.caption;
            if (node.attrs.tag) dom.dataset.tag = node.attrs.tag;
            
            // 左クリック: 画像をNodeSelectionで選択（これにより右クリックメニューが動作する）
            dom.addEventListener('mousedown', (event) => {
                // 右クリックはスルー（コンテキストメニュー用）
                if (event.button === 2) return;
                
                event.preventDefault();
                
                const pos = getPos();
                if (typeof pos === 'number') {
                    // NodeSelectionで画像を選択
                    const tr = editor.state.tr.setSelection(
                        NodeSelection.create(editor.state.doc, pos)
                    );
                    editor.view.dispatch(tr);
                    editor.view.focus();
                }
            });
            
            return {
                dom,
                // 右クリックのみ通過させる
                stopEvent: (event) => {
                    // contextmenu（右クリック）は通過
                    if (event.type === 'contextmenu') return false;
                    // 右ボタン押下も通過
                    if (event.type === 'mousedown' && (event as MouseEvent).button === 2) return false;
                    // その他のmousedown/clickはブロック
                    if (event.type === 'mousedown' || event.type === 'click') return true;
                    return false;
                },
                // 属性更新
                update: (updatedNode) => {
                    if (updatedNode.type.name !== 'image') return false;
                    
                    dom.src = updatedNode.attrs.src || '';
                    dom.alt = updatedNode.attrs.alt || '';
                    
                    dom.className = '';
                    if (updatedNode.attrs.size) dom.classList.add(`img-${updatedNode.attrs.size}`);
                    if (updatedNode.attrs.hasBorder) dom.classList.add('has-border');
                    
                    if (updatedNode.attrs.title) dom.dataset.title = updatedNode.attrs.title;
                    else delete dom.dataset.title;
                    if (updatedNode.attrs.titleSize) dom.dataset.titleSize = updatedNode.attrs.titleSize;
                    else delete dom.dataset.titleSize;
                    if (updatedNode.attrs.caption) dom.dataset.caption = updatedNode.attrs.caption;
                    else delete dom.dataset.caption;
                    if (updatedNode.attrs.tag) dom.dataset.tag = updatedNode.attrs.tag;
                    else delete dom.dataset.tag;
                    
                    return true;
                },
            };
        };
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },
});
