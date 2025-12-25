
import { Editor } from '@tiptap/react';
import mammoth from 'mammoth';
import contentCssText from '../styles/content.css?raw'; // Import CSS as raw string

/**
 * Reads text from a File object.
 */
export function readTextFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(e.target.result as string);
            } else {
                reject(new Error("Empty file"));
            }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

/**
 * Parses an HTML string and sets the editor content.
 * Also extracts page margins if present.
 */
export function parseAndSetContent(editor: Editor, html: string, isWordMode: boolean = false): boolean {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check for Word Mode class in body
    const isWordModeDetected = doc.body.classList.contains('mode-word');

    // Check for root margin variable
    const rootStyle = doc.documentElement.style.getPropertyValue('--page-margin');
    if (rootStyle) {
        document.documentElement.style.setProperty('--page-margin', rootStyle);
    }

    const container = doc.getElementById('pages-container');
    let content = '';

    if (container) {
        content = container.innerHTML;
    } else {
        const pages = doc.querySelectorAll('.page');
        if (pages.length > 0) {
            const temp = document.createElement('div');
            pages.forEach(p => temp.appendChild(p.cloneNode(true)));
            content = temp.innerHTML;
        } else {
            content = doc.body.innerHTML;
        }
    }

    if (content) {
        editor.commands.setContent(content);
        return isWordModeDetected;
    } else {
        throw new Error('有効なページデータが見つかりませんでした。');
    }
}

/**
 * Generates the full HTML document string from the editor content.
 * Mimics buildFullHTML from legacy.
 */
export function generateFullHtml(editor: Editor, isWordMode: boolean = false): string {
    const htmlContent = editor.getHTML(); // This returns inner HTML of the document
    // We need to check if editor.getHTML() returns the valid structure (section.page > .page-inner)
    // Tiptap's schema should ensure this.

    // Helper to get current margin - in V3 this might be in CSS var properly set on body/root
    const rootStyle = getComputedStyle(document.documentElement);
    const currentMargin = rootStyle.getPropertyValue('--page-margin').trim() || '17mm';

    const bodyClass = isWordMode ? ' class="mode-word"' : '';

    const aiIndex = document.getElementById('ai-image-index')?.outerHTML || '';

    return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
:root { --page-margin: ${currentMargin}; }
${contentCssText}
</style>
</head>
<body${bodyClass}>
<div id="pages-container">
${htmlContent}
</div>
${aiIndex}
</body>
</html>`;
}

/**
 * Imports a Docx file and sets the editor content.
 */
export async function importDocxToEditor(editor: Editor, file: File): Promise<void> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const options = {
            styleMap: ["u => u"],
            convertImage: mammoth.images.inline(() => ({})) // Skip images
        };

        const result = await mammoth.convertToHtml({ arrayBuffer }, options);
        let rawHtml = result.value;

        // Normalize using DOMParser
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');
        const root = doc.querySelector('div');

        if (root) {
            // 1. Clean (Images, Tables, Links)
            root.querySelectorAll('img, table, picture, audio, video').forEach(el => el.remove());
            root.querySelectorAll('a').forEach(a => {
                while (a.firstChild) a.parentNode?.insertBefore(a.firstChild, a);
                a.remove();
            });

            // 2. Normalize Blocks
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
                    // skip
                } else {
                    if (!currentParagraph) {
                        currentParagraph = document.createElement('p');
                        root.insertBefore(currentParagraph, node);
                    }
                    currentParagraph.appendChild(node);
                }
            });

            // 3. Wrap in Page Structure
            // Simple fallback: one giant page for now, or rely on editor pagination?
            // Legacy logic wraps everything in one page.
            const pageContent = `<section class="page" data-page="1"><div class="page-inner">${root.innerHTML}</div></section>`;
            editor.commands.setContent(pageContent);
        }

    } catch (err) {
        console.error('Docx import error:', err);
        throw new Error('Wordファイルのインポート中にエラーが発生しました。');
    }
}
