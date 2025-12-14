import { getPagesContainerElement, state } from '../globals.js';
import { getClosestBlockId } from '../utils/dom.js';
// 画像インデックスDOMを作成・取得する
export function ensureAiImageIndex() {
    const pagesContainerElement = getPagesContainerElement();
    if (!pagesContainerElement)
        return;
    let container = document.getElementById('ai-image-index');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ai-image-index';
        container.style.display = 'none';
    }
    else if (container.parentNode) {
        container.parentNode.removeChild(container);
    }
    pagesContainerElement.appendChild(container);
    state.aiImageIndex = container;
}
export function rebuildFigureMetaStore() {
    const pagesContainerElement = getPagesContainerElement();
    if (!pagesContainerElement)
        return;
    ensureAiImageIndex();
    const aiImageIndex = state.aiImageIndex;
    if (!aiImageIndex)
        return;
    const preservedMetas = new Map();
    aiImageIndex.querySelectorAll('.figure-meta').forEach(meta => {
        const key = meta.dataset.src || '';
        if (!preservedMetas.has(key)) {
            preservedMetas.set(key, []);
        }
        preservedMetas.get(key).push(meta);
    });
    aiImageIndex.innerHTML = '';
    const images = pagesContainerElement.querySelectorAll('.page-inner img');
    images.forEach(img => {
        const key = img.src || '';
        const candidates = preservedMetas.get(key);
        let meta = null;
        if (candidates && candidates.length) {
            meta = candidates.shift();
        }
        else {
            meta = document.createElement('div');
            meta.className = 'figure-meta';
            meta.dataset.src = img.src;
            meta.dataset.title = '';
            meta.dataset.caption = '';
            meta.dataset.tag = '';
        }
        meta.dataset.anchor = getClosestBlockId(img);
        if (!meta.dataset.src) {
            meta.dataset.src = img.src;
        }
        meta.dataset.title = meta.dataset.title || '';
        meta.dataset.caption = meta.dataset.caption || '';
        meta.dataset.tag = meta.dataset.tag || '';
        aiImageIndex.appendChild(meta);
    });
}
