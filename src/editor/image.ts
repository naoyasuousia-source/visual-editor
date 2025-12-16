import { getPagesContainerElement, state } from '../globals.js';
import { getClosestBlockId, isParagraphEmpty, ensureFigureWrapper, convertParagraphToTag } from '../utils/dom.js';
import { renumberParagraphs } from './formatting.js';
import { findParagraph, placeCaretBefore, getCurrentParagraph } from './selection.js';

// Internal module state
let contextTargetImage: HTMLImageElement | null = null;
const imageSizeClasses = ['xs', 's', 'm', 'l', 'xl'] as const;
type ImageSizeClass = typeof imageSizeClasses[number];

const isImageSizeClass = (value: string | null | undefined): value is ImageSizeClass =>
    !!value && imageSizeClasses.includes(value as ImageSizeClass);

// 画像インデックスDOMを作成・取得する
export function ensureAiImageIndex(): void {
    const pagesContainerElement = getPagesContainerElement();
    if (!pagesContainerElement) return;
    let container = document.getElementById('ai-image-index');
    if (!container) {
        container = document.createElement('div');
        container.id = 'ai-image-index';
        container.style.display = 'none';
    } else if (container.parentNode) {
        container.parentNode.removeChild(container);
    }
    pagesContainerElement.appendChild(container);
    state.aiImageIndex = container;
}

export function rebuildFigureMetaStore(): void {
    const pagesContainerElement = getPagesContainerElement();
    if (!pagesContainerElement) return;
    ensureAiImageIndex();
    const aiImageIndex = state.aiImageIndex;
    if (!aiImageIndex) return;

    const preservedMetas = new Map<string, HTMLElement[]>();
    aiImageIndex.querySelectorAll<HTMLElement>('.figure-meta').forEach(meta => {
        const key = meta.dataset.src || '';
        if (!preservedMetas.has(key)) {
            preservedMetas.set(key, []);
        }
        preservedMetas.get(key)!.push(meta);
    });
    aiImageIndex.innerHTML = '';

    const images = pagesContainerElement.querySelectorAll<HTMLImageElement>('.page-inner img');
    images.forEach(img => {
        const key = img.src || '';
        const candidates = preservedMetas.get(key);
        let meta: HTMLElement | null = null;
        if (candidates && candidates.length) {
            meta = candidates.shift()!;
        } else {
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
        aiImageIndex!.appendChild(meta);
    });
}

export function updateImageMetaTitle(img: HTMLImageElement | null, rawTitle: string): void {
    ensureAiImageIndex();
    const aiImageIndex = state.aiImageIndex;
    if (!img || !aiImageIndex) return;

    let meta = Array.from(aiImageIndex.querySelectorAll<HTMLElement>('.figure-meta')).find(m => m.dataset.src === img.src);
    if (!meta) {
        rebuildFigureMetaStore();
        meta = Array.from(aiImageIndex.querySelectorAll<HTMLElement>('.figure-meta')).find(m => m.dataset.src === img.src);
    }
    if (meta) {
        meta.dataset.title = rawTitle || '';
    }
}

export function promptDropboxImageUrl(): void {
    const inputUrl = window.prompt('Dropbox画像の共有URLを貼り付けてください。');
    if (!inputUrl) return;
    let parsed: URL;
    try {
        parsed = new URL(inputUrl);
    } catch (err) {
        alert('正しいURL形式を入力してください。');
        return;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname.includes('dropbox.com')) {
        alert('Dropboxドメインではありません。dropbox.com のURLを選択してください。');
        return;
    }

    parsed.searchParams.delete('dl');
    parsed.searchParams.set('raw', '1');

    const normalizedUrl = parsed.toString();
    insertImageAtCursor({
        src: normalizedUrl,
        alt: parsed.pathname.split('/').pop() || ''
    });
}

export function promptWebImageUrl(): void {
    const inputUrl = window.prompt('画像URLを貼り付けてください。');
    if (!inputUrl) return;
    let parsed: URL;
    try {
        parsed = new URL(inputUrl);
    } catch (err) {
        alert('正しいURL形式を入力してください。');
        return;
    }

    insertImageAtCursor({
        src: parsed.toString(),
        alt: parsed.pathname.split('/').pop() || ''
    });
}

export function insertImageAtCursor({ src, alt }: { src: string; alt: string }): void {
    const currentEditor = window.currentEditor;
    if (!currentEditor) return;

    const selection = window.getSelection();
    let range = selection && selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
    if (!range) {
        range = document.createRange();
        range.selectNodeContents(currentEditor);
        range.collapse(false);
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    if (!range) return;

    const block = findParagraph(range.startContainer);
    const isEmptyLine = block && isParagraphEmpty(block);

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || src;
    img.classList.add('img-m');

    const insertSlotAndPositionCaret = (container: HTMLElement) => {
        const caretSlot = document.createElement('span');
        caretSlot.className = 'caret-slot';
        caretSlot.contentEditable = 'false';
        caretSlot.innerHTML = '&#8203;';
        const br = document.createElement('br');
        container.appendChild(caretSlot);
        container.appendChild(br);
        placeCaretBefore(caretSlot);
    };

    if (isEmptyLine && block) {
        block.innerHTML = '';
        const wrapper = ensureFigureWrapper(block);
        const container = wrapper || (block as HTMLElement);
        container.appendChild(img);
        insertSlotAndPositionCaret(container);
    } else {
        const newPara = document.createElement('p');
        if (block && block.parentNode) {
            block.parentNode.insertBefore(newPara, block.nextSibling);
        } else {
            currentEditor.appendChild(newPara);
        }
        const wrapper = ensureFigureWrapper(newPara);
        const container = wrapper || newPara;
        container.appendChild(img);
        insertSlotAndPositionCaret(container);
    }

    (window as any).setActiveEditor?.(currentEditor);
    renumberParagraphs();
}

export function applyImageSize(img: HTMLElement | null, size?: string | null): void {
    if (!img || !isImageSizeClass(size)) return;
    imageSizeClasses.forEach(s => {
        img.classList.remove(`img-${s}`);
    });
    img.classList.add(`img-${size}`);
}

export function showImageContextMenu(event: MouseEvent, img: HTMLImageElement): void {
    const imageContextMenuElement = document.getElementById('image-context-menu');
    if (!imageContextMenuElement) return;
    contextTargetImage = img;
    closeImageSubmenu();
    const { clientX, clientY } = event;
    const { width, height } = imageContextMenuElement.getBoundingClientRect();
    const maxX = window.innerWidth - width - 8;
    const maxY = window.innerHeight - height - 8;
    const x = Math.max(8, Math.min(clientX, maxX));
    const y = Math.max(8, Math.min(clientY, maxY));
    imageContextMenuElement.style.left = `${x}px`;
    imageContextMenuElement.style.top = `${y}px`;
    imageContextMenuElement.classList.add('open');
}

export function closeImageSubmenu(): void {
    const imageContextDropdownElement = document.querySelector<HTMLElement>('.image-context-dropdown');
    const imageContextTriggerElement = document.querySelector<HTMLElement>('.image-context-trigger');
    if (!imageContextDropdownElement) return;
    imageContextDropdownElement.classList.remove('open');
    if (imageContextTriggerElement) {
        imageContextTriggerElement.setAttribute('aria-expanded', 'false');
    }
}

export function closeImageContextMenu(): void {
    const imageContextMenuElement = document.getElementById('image-context-menu');
    if (!imageContextMenuElement) return;
    imageContextMenuElement.classList.remove('open');
    closeImageSubmenu();
}

export function openTitleDialog(): void {
    const imageTitleDialogElement = document.getElementById('image-title-dialog') as HTMLDialogElement | null;
    const imageTitleInputElement = document.getElementById('image-title-input') as HTMLInputElement | null;
    const imageTitleFontRadios = imageTitleDialogElement
        ? Array.from(imageTitleDialogElement.querySelectorAll<HTMLInputElement>('input[name="image-title-font-size"]'))
        : [];

    if (!imageTitleDialogElement || !contextTargetImage) return;
    const block = contextTargetImage.closest<HTMLElement>('p, h1, h2, h3, h4, h5, h6');
    if (!block) return;
    let existingTitle = '';

    const existingTitleSpan = block.querySelector<HTMLElement>('.figure-title');
    if (existingTitleSpan) {
        existingTitle = (existingTitleSpan.textContent || '').trim();
    } else {
        let sibling = contextTargetImage.nextSibling;
        while (sibling && sibling.nodeType === Node.TEXT_NODE && (sibling.textContent || '').trim() === '') {
            sibling = sibling.nextSibling;
        }
        if (sibling && sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === 'BR') {
            const textNode = sibling.nextSibling;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                existingTitle = textNode.textContent || '';
            }
        }
    }

    if (imageTitleInputElement) {
        imageTitleInputElement.value = existingTitle;
        imageTitleInputElement.focus();
        imageTitleInputElement.select();
    }
    const figureTitleSpan = block.querySelector<HTMLElement>('.figure-title');
    const hasMiniTextInTitle = !!figureTitleSpan?.querySelector('.mini-text');
    const isBlockStyleMini = block.dataset.blockStyle === 'mini-p';
    const fontValue = (isBlockStyleMini || hasMiniTextInTitle) ? 'mini' : 'default';
    imageTitleFontRadios.forEach(radio => {
        radio.checked = radio.value === fontValue;
    });
    if (typeof imageTitleDialogElement.showModal === 'function') {
        imageTitleDialogElement.showModal();
    } else {
        imageTitleDialogElement.setAttribute('open', '');
    }
}

export function closeTitleDialog(): void {
    const imageTitleDialogElement = document.getElementById('image-title-dialog') as HTMLDialogElement | null;
    const imageTitleInputElement = document.getElementById('image-title-input') as HTMLInputElement | null;
    if (!imageTitleDialogElement) return;
    if (typeof imageTitleDialogElement.close === 'function') {
        imageTitleDialogElement.close();
    } else {
        imageTitleDialogElement.removeAttribute('open');
    }
    if (imageTitleInputElement) {
        imageTitleInputElement.value = '';
    }
    contextTargetImage = null;
}

export function removeExistingImageTitle(img: HTMLImageElement | null): void {
    if (!img) return;
    let next: ChildNode | null = img.nextSibling;
    while (next) {
        const toRemove = next;
        next = next.nextSibling;
        if (toRemove.nodeType === Node.TEXT_NODE && (toRemove.textContent || '').trim() === '') {
            toRemove.remove();
        } else if (toRemove.nodeType === Node.ELEMENT_NODE) {
            const element = toRemove as HTMLElement;
            if (
                element.tagName === 'BR' ||
                element.classList.contains('caret-slot') ||
                element.classList.contains('figure-title')
            ) {
                element.remove();
            } else {
                break;
            }
        } else {
            break;
        }
    }
}

export function applyImageTitle(): void {
    const imageTitleInputElement = document.getElementById('image-title-input') as HTMLInputElement | null;
    const imageTitleDialogElement = document.getElementById('image-title-dialog') as HTMLDialogElement | null;
    const imageTitleFontRadios = imageTitleDialogElement
        ? Array.from(imageTitleDialogElement.querySelectorAll<HTMLInputElement>('input[name="image-title-font-size"]'))
        : [];

    if (!contextTargetImage) return;
    const rawTitle = imageTitleInputElement ? imageTitleInputElement.value : '';
    const fontRadio = imageTitleFontRadios.find(radio => radio.checked);
    const fontSize = fontRadio ? fontRadio.value : 'default';
    const block = contextTargetImage.closest<HTMLElement>('p, h1, h2, h3, h4, h5, h6');
    if (!block) return;

    const paragraph = block.tagName.toLowerCase() === 'p'
        ? block
        : convertParagraphToTag(block, 'p');
    if (!paragraph) return;

    const isMini = fontSize === 'mini';
    paragraph.dataset.blockStyle = isMini ? 'mini-p' : 'p';
    const wrapper = ensureFigureWrapper(paragraph);
    removeExistingImageTitle(contextTargetImage);

    if (rawTitle) {
        const br = document.createElement('br');
        const caretSlot = document.createElement('span');
        caretSlot.className = 'caret-slot';
        caretSlot.contentEditable = 'false';
        caretSlot.innerHTML = '&#8203;';

        let titleContent: Node;
        if (isMini) {
            const miniSpan = document.createElement('span');
            miniSpan.className = 'mini-text';
            miniSpan.style.fontSize = '8pt';
            miniSpan.textContent = rawTitle;
            titleContent = miniSpan;
        } else {
            titleContent = document.createTextNode(rawTitle);
        }

        const titleSpan = document.createElement('span');
        titleSpan.className = 'figure-title';
        titleSpan.contentEditable = 'false';
        titleSpan.appendChild(titleContent);

        const container = wrapper || paragraph;
        container.appendChild(caretSlot);
        container.appendChild(br);
        container.appendChild(titleSpan);
    }

    updateImageMetaTitle(contextTargetImage, rawTitle);
}

export function initImageContextMenuControls(): void {
    const pagesContainerElement = getPagesContainerElement();
    const imageContextMenuElement = document.getElementById('image-context-menu');
    const imageContextTriggerElement = document.querySelector<HTMLElement>('.image-context-trigger');
    const imageContextDropdownElement = document.querySelector<HTMLElement>('.image-context-dropdown');
    const imageTitleApplyButtonElement = document.querySelector<HTMLElement>('[data-action="apply-image-title"]');
    const imageTitleCancelButtonElement = document.querySelector<HTMLElement>('[data-action="cancel-image-title"]');
    const imageTitleDialogElement = document.getElementById('image-title-dialog') as HTMLDialogElement | null;

    document.addEventListener('contextmenu', (event) => {
        const target = event.target as HTMLElement | null;
        const img = target?.closest<HTMLImageElement>('img');
        if (img && pagesContainerElement && pagesContainerElement.contains(img)) {
            event.preventDefault();
            event.stopPropagation();
            showImageContextMenu(event, img);
            return;
        }
        closeImageContextMenu();
    });

    // Hover handling is done via CSS
    if (imageContextTriggerElement) {
        // Optional: Keep click for mobile/touch if needed, but for now we follow strict hover instruction
        imageContextTriggerElement.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    }

    if (imageContextMenuElement) {
        imageContextMenuElement.addEventListener('click', (event) => {
            const btn = (event.target as HTMLElement).closest<HTMLElement>('button[data-action]');
            if (!btn) return;
            event.stopPropagation();
            const action = btn.dataset.action;
            if (action === 'image-size') {
                const size = btn.dataset.size;
                applyImageSize(contextTargetImage, size);
                closeImageContextMenu();
                contextTargetImage = null;
                return;
            }
            if (action === 'image-title') {
                closeImageContextMenu();
                openTitleDialog();
                return;
            }
            closeImageContextMenu();
            contextTargetImage = null;
        });
    }

    if (imageTitleApplyButtonElement) {
        imageTitleApplyButtonElement.addEventListener('click', (event) => {
            event.preventDefault();
            applyImageTitle();
            closeTitleDialog();
        });
    }

    if (imageTitleCancelButtonElement) {
        imageTitleCancelButtonElement.addEventListener('click', (event) => {
            event.preventDefault();
            closeTitleDialog();
        });
    }

    if (imageTitleDialogElement) {
        imageTitleDialogElement.addEventListener('cancel', (event) => {
            event.preventDefault();
            closeTitleDialog();
        });
    }

    window.addEventListener('resize', closeImageContextMenu);
    window.addEventListener('blur', closeImageContextMenu);
}
