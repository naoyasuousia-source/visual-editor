import { Editor } from '@tiptap/react';
import mammoth from 'mammoth';
import { ParseResult } from '@/utils/io';

/**
 * HTML文字列を解析し、エディタにコンテンツを設定します。
 */
export function setEditorContentFromHtml(editor: Editor, html: string): ParseResult {
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
 * Wordファイルをインポートしてエディタにコンテンツを設定します。
 */
export async function importDocxToEditor(editor: Editor, file: File): Promise<void> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const options = {
            styleMap: ["u => u"],
            convertImage: (mammoth.images as unknown as { inline: (fn: () => Record<string, never>) => unknown }).inline(() => ({})) as never
        };

        const result = await mammoth.convertToHtml({ arrayBuffer }, options);
        let rawHtml = result.value;

        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${rawHtml}</div>`, 'text/html');
        const root = doc.querySelector('div');

        if (root) {
            root.querySelectorAll('img, table, picture, audio, video').forEach(el => el.remove());
            root.querySelectorAll('a').forEach(a => {
                while (a.firstChild) a.parentNode?.insertBefore(a.firstChild, a);
                a.remove();
            });

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
                } else {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === '') return;
                    if (!currentParagraph) {
                        currentParagraph = document.createElement('p');
                        root.insertBefore(currentParagraph, node);
                    }
                    currentParagraph.appendChild(node);
                }
            });

            const pageContent = `<section class="page" data-page="1"><div class="page-inner">${root.innerHTML}</div></section>`;
            editor.commands.setContent(pageContent);
        }

    } catch (err) {
        console.error('Docx import error:', err);
        throw new Error('Wordファイルのインポート中にエラーが発生しました。');
    }
}
