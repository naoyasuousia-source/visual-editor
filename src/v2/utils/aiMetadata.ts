import { Editor } from '@tiptap/react';

/**
 * AIエージェント向けガイド（head内に配置するコメント）
 */
export function generateAiGuide(isWordMode: boolean): string {
    const modeDesc = isWordMode 
        ? "Word Mode: A continuous document flow." 
        : "Paginated Mode: Split into A4 sections (<section class=\"page\">).";

    return `
<!--
===============================================================================
AI ASSISTANT GUIDE & COMMAND API SPECIFICATIONS
===============================================================================

## OVERVIEW
This document is being edited by a human using a visual editor.
As an AI Assistant, you can perform automated edits by writing commands in the
COMMAND AREA located at the beginning of <body>.

## DOCUMENT STRUCTURE
- ${modeDesc}
- Editable content is inside elements with class "page-inner".
- Every paragraph/heading has a [data-para] attribute (e.g., [1], [2]).
- Images are wrapped in "image-container" and may have "data-title".

## COMMAND AREA LOCATION
The COMMAND AREA is located immediately after the <body> tag opening.
Look for the markers: [AI_COMMAND_START] and [AI_COMMAND_END]

## SUPPORTED COMMANDS

1. INSERT_TEXT[paragraph:offset][text]
   - Inserts text at the specified offset in a paragraph.
   - paragraph: The [data-para] number (1-indexed).
   - offset: Character position (0-indexed).
   - Example: <!-- INSERT_TEXT[1:0][Hello ] -->

2. REPLACE_TEXT[search][replace][options]
   - Searches and replaces text within the document.
   - options: "all", "regex", "caseSensitive" (comma-separated)
   - Example: <!-- REPLACE_TEXT[apple][orange][all] -->

## IMPORTANT RULES
- Commands must be wrapped in HTML comments: <!-- COMMAND[...] -->
- Only one command per line inside the COMMAND AREA.
- Do NOT edit any content outside the COMMAND AREA.
- The editor ignores/overwrites external changes to content during auto-edit.

===============================================================================
-->
`;
}

/**
 * コマンドエリアを生成（body直後に配置）
 */
export function generateCommandArea(): string {
    return `
<!-- AI_COMMAND_START -->
<!-- ここにコマンドを記述してください / Write your commands here -->
<!-- AI_COMMAND_END -->
`;
}

/**
 * 完全なHTML文書を生成する
 * 
 * @param editor Tiptapエディタインスタンス
 * @param isWordMode Wordモードかどうか
 * @param contentCss コンテンツCSS文字列
 * @param pageMarginText ページマージンのCSS値 (例: "17mm")
 * @param aiImageIndexHtml AI画像インデックスのHTML文字列
 * @returns 完全なHTML文書文字列
 */
export function buildFullHTML(
    editor: Editor,
    isWordMode: boolean,
    contentCss: string,
    pageMarginText: string,
    aiImageIndexHtml: string
): string {
    // 1. エディタコンテンツを取得
    const htmlContent = editor.getHTML();

    // 2. AIガイド（head内）とコマンドエリア（body直後）を生成
    const aiGuide = generateAiGuide(isWordMode);
    const commandArea = generateCommandArea();

    // 3. bodyクラスを設定
    const bodyClass = isWordMode ? 'mode-word' : '';
    const finalClass = `standalone-html ${bodyClass}`.trim();

    // 4. 出力用HTMLのクリーンアップ
    let cleanedHtml = htmlContent;

    // CSSからコメントを削除（ライブラリ用のスタイル維持）
    const cleanedCss = contentCss.replace(/\/\*[\s\S]*?\*\//g, '');

    // 不要な属性の削除
    cleanedHtml = cleanedHtml.replace(/\scontenteditable="true"/g, '');
    cleanedHtml = cleanedHtml.replace(/(<(?:p|h1|h2|h3|h4|h5|h6)[^>]*)(\sdata-page="[^"]*")([^>]*>)/g, '$1$3');
    cleanedHtml = cleanedHtml.replace(/(<img[^>]*)(\sdata-caption="[^"]*")([^>]*>)/g, '$1$3');
    cleanedHtml = cleanedHtml.replace(/(<img[^>]*)(\sdata-tag="[^"]*")([^>]*>)/g, '$1$3');
    
    // ハイライトマークを削除（承認後のクリーンな状態で保存）
    cleanedHtml = cleanedHtml.replace(/<mark[^>]*data-color[^>]*>([^<]*)<\/mark>/g, '$1');

    // 5. 完全なHTML文書を構築
    // - head内: AIガイド（ドキュメント構造と仕様説明）
    // - body直後: コマンドエリア（AIがコマンドを記述する場所）
    return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
${aiGuide}
<style>
:root { --page-margin: ${pageMarginText}; }
${cleanedCss}
</style>
</head>
<body class="${finalClass}">
${commandArea}
<div id="pages-container">
${cleanedHtml}
</div>
${aiImageIndexHtml}
</body>
</html>`;
}
