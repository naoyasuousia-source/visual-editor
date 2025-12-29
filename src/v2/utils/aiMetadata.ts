import { Editor } from '@tiptap/react';

/**
 * AIエージェント向け総合ガイド（命令書 + 仕様書）
 */
export function generateAiMetadata(isWordMode: boolean): string {
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
COMMAND AREA defined below.

## DOCUMENT STRUCTURE
- ${modeDesc}
- Editable content is inside elements with class "page-inner".
- Every paragraph/heading has a [data-para] attribute (e.g., [1], [2]).
- Images are wrapped in "image-container" and may have "data-title".

## COMMAND AREA
Place your commands between the following markers. 
The editor will detect changes, ask the user for approval, and execute them.

[AI_COMMAND_START]
<!-- Write your commands here. Example: <!-- INSERT_TEXT[1:0][Hello] --> -->
[AI_COMMAND_END]

## SUPPORTED COMMANDS

1. INSERT_TEXT[paragraph:offset][text]
   - Description: Inserts text at the specified offset in a paragraph.
   - Arguments:
     - paragraph: The [data-para] number (starting from 1).
     - offset: Character position within the paragraph (starting from 0).
     - text: The string to insert.
   - Example: <!-- INSERT_TEXT[1:0][Important: ] -->

2. REPLACE_TEXT[search][replace][options]
   - Description: Searches and replaces text within the document.
   - Arguments:
     - search: String or Regex to find.
     - replace: Replacement string.
     - options: "all" (replace all), "regex" (use regex), "caseSensitive".
   - Example: <!-- REPLACE_TEXT[apple][orange][all] -->

## IMPORTANT RULES
- Commands must be wrapped in HTML comments: <!-- COMMAND[...] -->
- Only one command per line inside the COMMAND AREA.
- Do NOT edit any content outside the COMMAND AREA. The editor will 
  ignore/overwrite external changes to the content itself during auto-edit.
- Always use the [data-para] numbers displayed in the editor for targeting.

===============================================================================
-->
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

    // 2. AIメタデータ（ガイド+コマンドエリア）を生成
    const aiMetadata = generateAiMetadata(isWordMode);

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

    // 5. 完全なHTML文書を構築
    // ガイドとコマンドエリアを <head> の直後（bodyの前）または bodyの最上部に配置
    return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
<style>
:root { --page-margin: ${pageMarginText}; }
${cleanedCss}
</style>
${aiMetadata}
</head>
<body class="${finalClass}">
<div id="pages-container">
${cleanedHtml}
</div>
${aiImageIndexHtml}
</body>
</html>`;
}
