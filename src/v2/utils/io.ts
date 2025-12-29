
import { Editor } from '@tiptap/react';
import mammoth from 'mammoth';
import { buildFullHTML } from './aiMetadata';
import contentCssText from '@/styles/content.css?raw'; // Import CSS as raw string

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
 * 解析結果の型定義
 */
export interface ParseResult {
    isWordModeDetected: boolean;
    pageMargin?: 's' | 'm' | 'l';
}

/**
 * HTML文字列を解析し、エディタにコンテンツを設定します。
 * 解析された設定値（モード、マージン）を返します。
 */
export function parseAndSetContent(editor: Editor, html: string): ParseResult {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Word Mode の検出
    const isWordModeDetected = doc.body.classList.contains('mode-word');

    // ページマージンの検出
    let pageMargin: 's' | 'm' | 'l' | undefined;
    const rootStyle = doc.documentElement.style.getPropertyValue('--page-margin');
    if (rootStyle) {
        const reverseMarginMap: Record<string, 's' | 'm' | 'l'> = {
            '12mm': 's',
            '17mm': 'm',
            '24mm': 'l'
        };
        pageMargin = reverseMarginMap[rootStyle.trim()];
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
        return { isWordModeDetected, pageMargin };
    } else {
        throw new Error('有効なページデータが見つかりませんでした。');
    }
}

/**
 * Generates the full HTML document string from the editor content.
 * 【重要】この関数は後方互換性のために残されています。
 * 新しいコードでは useFileIO フックを使用してください。
 */
export function generateFullHtml(editor: Editor, isWordMode: boolean = false): string {
    return buildFullHTML(editor, isWordMode, contentCssText, '17mm', '');
}

/**
 * Imports a Docx file and sets the editor content.
 */
export async function importDocxToEditor(editor: Editor, file: File): Promise<void> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const options = {
            styleMap: ["u => u"],
            // mammothの型定義が不完全なため、画像スキップのために必要な型アサーション
            convertImage: (mammoth.images as unknown as { inline: (fn: () => Record<string, never>) => unknown }).inline(() => ({})) as never
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
