import { buildFullHTML as buildFullHTMLUtil, readTextFromFile } from '../utils/file.js';
import {
    getPagesContainerElement,
    getStyleTagElement,
    getOpenFileInputElement,
    state,
} from '../globals.js'; // We might need to make sure globals.js exports these or we use window properties

// We need to access initPages, renumberParagraphs etc.
// Since they are on window, we can use them.
// Or we can import them if we move them to a module.

export function setPagesHTML(html: string): void {
    const pagesContainer = getPagesContainerElement();
    if (pagesContainer) {
        pagesContainer.innerHTML = html;
        window.initPages?.();
        window.renumberParagraphs?.();
        window.ensureAiImageIndex?.();
    }
}

export function importFullHTMLText(text: string): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const container = doc.getElementById('pages-container');
    if (container) {
        setPagesHTML(container.innerHTML);
        return true;
    }
    // Fallback: try to find .page elements or just body content if simple
    const pages = doc.querySelectorAll('.page');
    if (pages.length > 0) {
        let html = '';
        pages.forEach(p => html += p.outerHTML);
        setPagesHTML(html);
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
                console.log('File opened successfully via input');
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

export async function saveFullHTML(): Promise<void> {
    const pagesContainer = getPagesContainerElement();
    const styleTag = getStyleTagElement();
    if (!pagesContainer) return;

    if (state.openedFileHandle) {
        // We have a handle, try to overwrite? 
        // Typically 'Save' implies overwrite if handle exists, 
        // but often web apps split "Save" (overwrite) definitions.
        // Here we can ask or just download as new if "Save As" behavior is desired.
        // "Overwrite" feature is separate in the menu? 
        // The user requirement said `saveFullHTML` triggers download, and `overwriteCurrentFile` uses handle.
    }

    const html = buildFullHTML();
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
        await writable.write(buildFullHTML());
        await writable.close();
        alert('上書き保存しました。');
    } catch (err) {
        console.error('Overwrite error', err);
        alert('保存に失敗しました。');
    }
}

export function buildFullHTML(): string {
    const pagesContainer = getPagesContainerElement();
    const styleTag = getStyleTagElement();
    if (!pagesContainer) return '';
    if (window.renumberParagraphs) window.renumberParagraphs();
    return buildFullHTMLUtil(pagesContainer, styleTag);
}
