import { Image as TiptapImage } from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';

/**
 * カスタム画像拡張 (CustomImage)
 * 
 * ============================================================================
 * 【画像キャレットロジック - 概要】
 * ============================================================================
 * 
 * このファイルは画像に関するすべてのキャレット制御ロジックの中心です。
 * 
 * ■ キャレット配置ルール:
 *   1. 画像クリック → 画像の右辺（直後）にテキストキャレットを挿入
 *   2. 画像左辺にはキャレット挿入不可 → 自動で右辺に移動
 * 
 * ■ キーボード操作:
 *   - Enter (右辺キャレット) → 新段落を作成
 *   - Backspace (右辺キャレット) → 画像段落ごと削除
 * 
 * ■ 実装箇所:
 *   - addKeyboardShortcuts(): Enter/Backspace処理
 *   - addProseMirrorPlugins(): 左辺キャレット禁止プラグイン (imageCaretPlugin)
 *   - addNodeView(): 画像クリック → 右辺キャレット配置
 * 
 * ============================================================================
 * 【関連ファイル】
 * ============================================================================
 * 
 * - src/v2/hooks/useImageActions.ts
 *     画像操作（サイズ変更、枠線トグル、削除）のロジック
 *     キャレットの直前のノード ($from.nodeBefore) から画像を特定
 * 
 * - src/v2/styles/content.css
 *     .image-container: 画像+タイトルのコンテナスタイル
 *     .image-title: タイトル表示スタイル（編集不可）
 * 
 * ============================================================================
 * 【画像タイトル】
 * ============================================================================
 * 
 * - タイトルがある場合は画像下に中央揃えで表示
 * - タイトルは編集・選択・キャレット挿入不可 (contenteditable=false)
 * 
 * ============================================================================
 */
export const CustomImage = TiptapImage.extend({
    inline: true,
    group: 'inline',
    atom: true,
    selectable: false, // NodeSelectionを無効化し、テキストキャレットのみ使用
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
            // Backspace: 画像の直後にキャレットがある場合、画像段落ごと削除
            Backspace: () => {
                const { state, view } = this.editor;
                const { selection } = state;
                const { $from, empty } = selection;
                
                // キャレットが空の位置にあり、直前に画像がある場合
                if (empty && $from.nodeBefore?.type.name === 'image') {
                    const parentNode = $from.node($from.depth);
                    
                    // 段落が画像のみを含む場合、段落ごと削除
                    if (parentNode.type.name === 'paragraph' && parentNode.content.size === 1) {
                        const parentPos = $from.before($from.depth);
                        const tr = state.tr.delete(parentPos, parentPos + parentNode.nodeSize);
                        view.dispatch(tr);
                        return true;
                    }
                    
                    // 画像のみ削除
                    const imagePos = $from.pos - $from.nodeBefore.nodeSize;
                    const tr = state.tr.delete(imagePos, $from.pos);
                    view.dispatch(tr);
                    return true;
                }
                
                return false;
            },
            
            // Enter: 画像の直後にキャレットがある場合、新段落を作成
            Enter: () => {
                const { state, view } = this.editor;
                const { selection } = state;
                const { $from, empty } = selection;
                
                // キャレットが空の位置にあり、直前に画像がある場合
                if (empty && $from.nodeBefore?.type.name === 'image') {
                    // 段落を分割して新段落を作成
                    const tr = state.tr.split($from.pos);
                    view.dispatch(tr);
                    return true;
                }
                
                return false;
            },
        };
    },

    // ProseMirrorプラグイン: キャレット位置を監視し、画像左辺にキャレットがあれば右辺に移動
    addProseMirrorPlugins() {
        const editor = this.editor;
        
        return [
            new Plugin({
                key: new PluginKey('imageCaretPlugin'),
                
                appendTransaction: (transactions, oldState, newState) => {
                    // 選択が変更されていない場合はスキップ
                    const selectionChanged = transactions.some(tr => tr.selectionSet);
                    if (!selectionChanged) return null;
                    
                    const { selection } = newState;
                    if (!(selection instanceof TextSelection)) return null;
                    
                    const { $from, empty } = selection;
                    if (!empty) return null;
                    
                    // 画像の直前（左辺）にキャレットがある場合
                    const nodeAfter = $from.nodeAfter;
                    if (nodeAfter?.type.name === 'image') {
                        // 画像の直後（右辺）に移動
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

    // カスタムNodeView: 画像クリック時にキャレットを画像右辺に配置
    addNodeView() {
        return ({ node, getPos, editor }) => {
            // コンテナ（inlineを維持するためspan）
            const container = document.createElement('span');
            container.classList.add('image-container');
            container.setAttribute('contenteditable', 'false');
            
            // 画像要素
            const img = document.createElement('img');
            img.src = node.attrs.src || '';
            img.alt = node.attrs.alt || '';
            
            // クラスを設定
            if (node.attrs.size) {
                img.classList.add(`img-${node.attrs.size}`);
            }
            if (node.attrs.hasBorder) {
                img.classList.add('has-border');
            }
            
            // データ属性を設定（画像要素に）
            if (node.attrs.title) img.dataset.title = node.attrs.title;
            if (node.attrs.titleSize) img.dataset.titleSize = node.attrs.titleSize;
            if (node.attrs.caption) img.dataset.caption = node.attrs.caption;
            if (node.attrs.tag) img.dataset.tag = node.attrs.tag;
            
            container.appendChild(img);
            
            // タイトル要素（タイトルがある場合のみ表示）
            let titleEl: HTMLSpanElement | null = null;
            if (node.attrs.title) {
                titleEl = document.createElement('span');
                titleEl.classList.add('image-title');
                if (node.attrs.titleSize === 'mini') {
                    titleEl.classList.add('image-title-mini');
                }
                titleEl.textContent = node.attrs.title;
                titleEl.setAttribute('contenteditable', 'false');
                container.appendChild(titleEl);
            }
            
            /**
             * マウスダウンハンドラ: 画像クリック時にキャレットを画像右辺に配置
             * - 左クリック: 画像の直後にテキストキャレットを配置
             * - 右クリック: コンテキストメニュー用にスルー
             */
            const handleMouseDown = (event: MouseEvent) => {
                // 右クリックはスルー（コンテキストメニュー用）
                if (event.button === 2) return;
                
                event.preventDefault();
                event.stopPropagation();
                
                const pos = getPos();
                if (typeof pos === 'number') {
                    // 画像の直後（右辺）にテキストキャレットを配置
                    const imageEndPos = pos + node.nodeSize;
                    const tr = editor.state.tr.setSelection(
                        TextSelection.create(editor.state.doc, imageEndPos)
                    );
                    editor.view.dispatch(tr);
                    editor.view.focus();
                }
            };
            
            img.addEventListener('mousedown', handleMouseDown);
            // タイトルクリックでも画像右辺にキャレット
            if (titleEl) {
                titleEl.addEventListener('mousedown', handleMouseDown);
            }
            
            return {
                dom: container,
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
                    
                    img.src = updatedNode.attrs.src || '';
                    img.alt = updatedNode.attrs.alt || '';
                    
                    img.className = '';
                    if (updatedNode.attrs.size) img.classList.add(`img-${updatedNode.attrs.size}`);
                    if (updatedNode.attrs.hasBorder) img.classList.add('has-border');
                    
                    if (updatedNode.attrs.title) img.dataset.title = updatedNode.attrs.title;
                    else delete img.dataset.title;
                    if (updatedNode.attrs.titleSize) img.dataset.titleSize = updatedNode.attrs.titleSize;
                    else delete img.dataset.titleSize;
                    if (updatedNode.attrs.caption) img.dataset.caption = updatedNode.attrs.caption;
                    else delete img.dataset.caption;
                    if (updatedNode.attrs.tag) img.dataset.tag = updatedNode.attrs.tag;
                    else delete img.dataset.tag;
                    
                    // タイトル更新
                    const existingTitle = container.querySelector('.image-title');
                    if (updatedNode.attrs.title) {
                        if (existingTitle) {
                            existingTitle.textContent = updatedNode.attrs.title;
                            existingTitle.classList.toggle('image-title-mini', updatedNode.attrs.titleSize === 'mini');
                        } else {
                            const newTitleEl = document.createElement('span');
                            newTitleEl.classList.add('image-title');
                            if (updatedNode.attrs.titleSize === 'mini') {
                                newTitleEl.classList.add('image-title-mini');
                            }
                            newTitleEl.textContent = updatedNode.attrs.title;
                            newTitleEl.setAttribute('contenteditable', 'false');
                            newTitleEl.addEventListener('mousedown', handleMouseDown);
                            container.appendChild(newTitleEl);
                        }
                    } else if (existingTitle) {
                        existingTitle.remove();
                    }
                    
                    return true;
                },
            };
        };
    },

    renderHTML({ HTMLAttributes }) {
        return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
    },
});

