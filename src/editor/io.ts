import { buildFullHTML as buildFullHTMLUtil, readTextFromFile } from '../utils/file.js';
import {
    getPagesContainerElement,
    getStyleTagElement,
    getOpenFileInputElement,
    state,
} from '../globals.js';
import { getMode } from '../core/router.js';

// We need to access initPages, renumberParagraphs etc.
// Since they are on window, we can use them.
// Or we can import them if we move them to a module.

export function setPagesHTML(html: string): void {
    const pagesContainer = getPagesContainerElement();
    if (pagesContainer) {
        pagesContainer.innerHTML = html;
        window.currentEditor = null; // Reset current editor as the DOM nodes are new
        window.initPages?.();
        window.renumberParagraphs?.();
        window.ensureAiImageIndex?.();
    }
}

export function importFullHTMLText(text: string): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    // Constraint: Word mode can only open Word mode files
    if (getMode() === 'word') {
        if (!doc.body.classList.contains('mode-word')) {
            alert('標準モードで作成されたファイルはWordモードでは開けません。');
            return false;
        }
    }

    // Extract margin setting from style
    const styleTags = doc.querySelectorAll('style');
    let marginToApply = '17mm'; // Default
    styleTags.forEach(style => {
        const match = style.innerHTML.match(/--page-margin:\s*([^;]+)/);
        if (match) {
            marginToApply = match[1].trim();
        }
    });

    const container = doc.getElementById('pages-container');
    const restoreStructure = (root: Element) => {
        // Restore contenteditable
        root.querySelectorAll('.page-inner').forEach(pi => {
            pi.setAttribute('contenteditable', 'true');
        });
        // Restore caret slots for images/figures
        root.querySelectorAll('.figure-inline, .inline-align-center, .inline-align-left, .inline-align-right').forEach(wrapper => {
            // Check if it has image but no caret slot
            const img = wrapper.querySelector('img');
            if (img && !wrapper.querySelector('.caret-slot')) {
                // Remove existing direct child BRs to avoid duplication/misplacement
                wrapper.querySelectorAll(':scope > br').forEach(br => br.remove());

                const slot = document.createElement('span');
                slot.className = 'caret-slot';
                slot.contentEditable = 'false';
                slot.innerHTML = '&#8203;';
                const br = document.createElement('br');

                const title = wrapper.querySelector('.figure-title');
                if (title) {
                    title.setAttribute('contenteditable', 'false');
                    wrapper.insertBefore(slot, title);
                    wrapper.insertBefore(br, title);
                } else {
                    wrapper.appendChild(slot);
                    wrapper.appendChild(br);
                }
            } else {
                // Ensure existing title is not editable if slot already exists
                const title = wrapper.querySelector('.figure-title');
                if (title) {
                    title.setAttribute('contenteditable', 'false');
                }
            }
        });
    };

    if (container) {
        restoreStructure(container);
        setPagesHTML(container.innerHTML);

        // Apply margin
        if ((window as any).applyPageMargin) {
            const map: Record<string, string> = { '12mm': 's', '17mm': 'm', '24mm': 'l' };
            const sizeKey = map[marginToApply] || 'm';
            (window as any).applyPageMargin(sizeKey);
        }
        return true;
    }
    // Fallback
    const pages = doc.querySelectorAll('.page');
    if (pages.length > 0) {
        let html = '';
        const tempContainer = document.createElement('div');
        pages.forEach(p => {
            tempContainer.appendChild(p.cloneNode(true));
        });
        restoreStructure(tempContainer);
        setPagesHTML(tempContainer.innerHTML);
        return true;
    }
    return false;
}

export async function handleOpenFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
        const file = input.files[0];
        try {
            const text = await readTextFromFile(file);
            const imported = importFullHTMLText(text);
            if (imported) {
                // Determine margin size from content if possible, or reset
                // For now, we keep current margin or set to default 'm'
                state.openedFileHandle = null; // Reset handle as we opened via input
            } else {
                alert('有効なページデータが見つかりませんでした。');
            }
        } catch (err) {
            console.error('File load error', err);
            alert('ファイルの読み込みに失敗しました。');
        }
    }
    input.value = '';
}

export async function openWithFilePicker(): Promise<boolean> {
    if (typeof (window as any).showOpenFilePicker !== 'function') {
        return false; // Fallback to input
    }
    try {
        const [handle] = await (window as any).showOpenFilePicker({
            types: [{
                description: 'HTML Files',
                accept: { 'text/html': ['.html', '.htm'] }
            }],
            multiple: false
        });
        const file = await handle.getFile();
        const text = await readTextFromFile(file);
        const imported = importFullHTMLText(text);
        if (imported) {
            state.openedFileHandle = handle;
            return true;
        } else {
            alert('有効なページデータが見つかりませんでした。');
            return false;
        }
    } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error('File picker error', err);
            alert('ファイルを開けませんでした: ' + err.message);
        }
        return true; // Handled (even if cancelled)
    }
}

export async function saveAsWithFilePicker(): Promise<void> {
    if (typeof (window as any).showSaveFilePicker !== 'function') {
        // Fallback to download if API not supported
        await saveFullHTML();
        return;
    }

    try {
        const handle = await (window as any).showSaveFilePicker({
            types: [{
                description: 'HTML Files',
                accept: { 'text/html': ['.html', '.htm'] }
            }],
        });

        const writable = await handle.createWritable();
        const html = await buildFullHTML();
        await writable.write(html);
        await writable.close();

        state.openedFileHandle = handle;
        alert('保存しました。');
    } catch (err: any) {
        if (err.name !== 'AbortError') {
            console.error('Save As error', err);
            alert('保存に失敗しました: ' + err.message);
        }
    }
}

export async function saveFullHTML(): Promise<void> {
    const pagesContainer = getPagesContainerElement();
    if (!pagesContainer) return;

    if (state.openedFileHandle) {
        // Existing handle logic if needed
    }

    const html = await buildFullHTML(); // Now async
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function overwriteCurrentFile(): Promise<void> {
    if (!state.openedFileHandle) {
        saveFullHTML();
        return;
    }
    try {
        const writable = await state.openedFileHandle.createWritable();
        const html = await buildFullHTML();
        await writable.write(html);
        await writable.close();
        alert('上書き保存しました。');
    } catch (err) {
        console.error('Overwrite error', err);
        alert('保存に失敗しました。');
    }
}

export async function buildFullHTML(): Promise<string> {
    const pagesContainer = getPagesContainerElement();
    if (!pagesContainer) return '';
    if (window.renumberParagraphs) window.renumberParagraphs();

    // Fetch style.css content
    let styleContent = '';
    try {
        const response = await fetch('content.css');
        if (response.ok) {
            styleContent = await response.text();
        } else {
            console.warn('Failed to fetch style.css for saving');
        }
    } catch (e) {
        console.warn('Error fetching style.css', e);
    }

    // We can't pass styleTag anymore, pass styleContent string directly
    // note: buildFullHTMLUtil needs update to accept string or we fake a style element

    // Get current margin from root style
    const rootStyle = getComputedStyle(document.documentElement);
    const currentMargin = rootStyle.getPropertyValue('--page-margin').trim();

    // Create a fake style element with preserved variables
    const fakeStyle = document.createElement('style');
    fakeStyle.innerHTML = `:root { --page-margin: ${currentMargin}; } \n` + styleContent;

    const isWordMode = getMode() === 'word';

    return buildFullHTMLUtil(pagesContainer, fakeStyle, isWordMode);
}

export async function importDocx(file: File): Promise<boolean> {
    if (!(window as any).mammoth) {
        alert('Mammoth.jsが読み込まれていません。');
        return false;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const options = {
            styleMap: [
                "u => u"
            ],
            // Mammoth convertImages handles images. We want to skip them.
            convertImage: (window as any).mammoth.images.inline(() => {
                return {}; // Return empty to effectively skip? 
                // Better yet: we strip tags later.
            })
        };

        const result = await (window as any).mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, options);
        let html = result.value;

        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
        const root = doc.querySelector('div');
        if (root) {
            // 1. Remove unwanted tags (Links, Images, Tables, etc.)
            root.querySelectorAll('a, img, table, picture, audio, video').forEach(el => el.remove());

            // 2. Normalize block structure (Wrap stray nodes, Convert DIVs)
            const children = Array.from(root.childNodes);
            let currentParagraph: HTMLElement | null = null;

            children.forEach(node => {
                const isBlock = node.nodeType === Node.ELEMENT_NODE &&
                    ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV', 'SECTION'].includes((node as Element).tagName);

                if (isBlock) {
                    currentParagraph = null;
                    if (['DIV', 'SECTION'].includes((node as Element).tagName)) {
                        const p = document.createElement('p');
                        while (node.firstChild) p.appendChild(node.firstChild);
                        root.replaceChild(p, node);
                    }
                } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '') {
                    // Skip empty text nodes
                } else {
                    // Stray inline node or non-empty text
                    if (!currentParagraph) {
                        currentParagraph = document.createElement('p');
                        root.insertBefore(currentParagraph, node);
                    }
                    currentParagraph.appendChild(node);
                }
            });

            // 3. Inject and trigger automatic renumbering/normalization
            const pagesContainerHTML = `<section class="page" data-page="1"><div class="page-inner" contenteditable="true">${root.innerHTML}</div></section>`;
            setPagesHTML(pagesContainerHTML);
            return true;
        }
        return false;
    } catch (err) {
        console.error('Word import error:', err);
        alert('Wordファイルのインポート中にエラーが発生しました。');
        return false;
    }
}
