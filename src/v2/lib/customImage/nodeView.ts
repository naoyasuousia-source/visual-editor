import { NodeViewRendererProps } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import { Node as ProsemirrorNode } from '@tiptap/pm/model';

/**
 * カスタムNodeView: 画像クリック時にキャレットを画像右辺に配置
 * 【重要】タイトルはDOM要素ではなくCSS擬似要素で表示する
 */
export const createImageNodeView = ({ node, getPos, editor }: NodeViewRendererProps) => {
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
        container.classList.add(`img-${node.attrs.size}`);
    }
    if (node.attrs.hasBorder) {
        img.classList.add('has-border');
    }
    
    // データ属性を設定（タイトルはCSS content: attr()で表示）
    if (node.attrs.title) {
        container.dataset.title = node.attrs.title;
        container.classList.add('has-title');
        if (node.attrs.titleSize === 'mini') {
            container.classList.add('title-mini');
        }
    }
    if (node.attrs.caption) img.dataset.caption = node.attrs.caption;
    if (node.attrs.tag) img.dataset.tag = node.attrs.tag;
    
    container.appendChild(img);
    
    /**
     * マウスダウンハンドラ: 画像クリック時にキャレットを画像右辺に配置
     */
    const handleMouseDown = (event: MouseEvent) => {
        if (event.button === 2) return;
        
        event.preventDefault();
        event.stopPropagation();
        
        const pos = getPos();
        if (typeof pos === 'number') {
            const imageEndPos = pos + node.nodeSize;
            const tr = editor.state.tr.setSelection(
                TextSelection.create(editor.state.doc, imageEndPos)
            );
            editor.view.dispatch(tr);
            editor.view.focus();
        }
    };
    
    img.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousedown', handleMouseDown);
    
    return {
        dom: container,
        stopEvent: (event: Event) => {
            if (event.type === 'contextmenu') return false;
            if (event.type === 'mousedown' && (event as MouseEvent).button === 2) return false;
            if (event.type === 'mousedown' || event.type === 'click') return true;
            return false;
        },
        update: (updatedNode: ProsemirrorNode) => {
            if (updatedNode.type.name !== 'image') return false;
            
            img.src = updatedNode.attrs.src || '';
            img.alt = updatedNode.attrs.alt || '';
            
            container.classList.remove('img-xs', 'img-s', 'img-m', 'img-l', 'img-xl');
            if (updatedNode.attrs.size) {
                container.classList.add(`img-${updatedNode.attrs.size}`);
            }
            
            img.classList.toggle('has-border', !!updatedNode.attrs.hasBorder);
            
            if (updatedNode.attrs.title) {
                container.dataset.title = updatedNode.attrs.title;
                container.classList.add('has-title');
                container.classList.toggle('title-mini', updatedNode.attrs.titleSize === 'mini');
            } else {
                delete container.dataset.title;
                container.classList.remove('has-title', 'title-mini');
            }
            
            if (updatedNode.attrs.caption) img.dataset.caption = updatedNode.attrs.caption;
            else delete img.dataset.caption;
            if (updatedNode.attrs.tag) img.dataset.tag = updatedNode.attrs.tag;
            else delete img.dataset.tag;
            
            return true;
        },
    };
};
