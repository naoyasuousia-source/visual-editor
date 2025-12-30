


/**
 * AIエージェント向けガイド（head内に配置するコメント）
 * 新コマンドシステム（段落IDベース）用
 */
export function generateAiGuide(isWordMode: boolean): string {
    const modeDesc = isWordMode 
        ? "Word Mode: A continuous document flow with paragraph IDs like 'p1', 'p2', etc." 
        : "Paginated Mode: Split into A4 sections with paragraph IDs like 'p1-1', 'p1-2' (page-paragraph).";

    return `
<!--
===============================================================================
AI ASSISTANT GUIDE & COMMAND API SPECIFICATIONS (v2.0 - Paragraph ID System)
===============================================================================

## OVERVIEW
This document is being edited with a visual editor.
As an AI Assistant, you can perform automated edits by writing commands targeting
specific paragraphs using their unique IDs in the COMMAND AREA at the beginning of <body>.

## DOCUMENT STRUCTURE
- ${modeDesc}
- Every paragraph/heading has a unique 'id' attribute (e.g., id="p1-1", id="p2-3").
- The format is "${isWordMode ? 'p{number}' : 'p{page}-{paragraph}'}" where numbers are 1-indexed.
- Editable content is inside elements with class "page-inner".

## COMMAND AREA LOCATION
The COMMAND AREA is located immediately after the <body> tag opening.
Look for the markers: <!-- AI_COMMAND_START --> and <!-- AI_COMMAND_END -->

## SUPPORTED COMMANDS (New Paragraph ID System)

All commands use paragraph IDs to target specific paragraphs.
Commands are written as: COMMAND_NAME(arguments)

1. REPLACE_PARAGRAPH(targetId, text, [options])
   - Replaces the content of a paragraph with new text.
   - targetId: The paragraph ID (e.g., "p1-2" or "p5")
   - text: New text content (can include <b>, <br>, <sup>, <sub> tags)
   - options (optional): key=value pairs separated by commas
     * blockType=p|h1|h2|h3 (default: p)
     * textAlign=left|center|right (default: left)
     * spacing=none|small|medium|large (default: none)
     * indent=0|1|2|3|4 (default: 0)
   - Examples:
     REPLACE_PARAGRAPH(p1-2, これは<b>修正された</b>テキストです。)
     REPLACE_PARAGRAPH(p3-1, 見出しテキスト, blockType=h1, textAlign=center)
     REPLACE_PARAGRAPH(p2-5, インデント段落, indent=1, spacing=medium)

2. INSERT_PARAGRAPH(targetId, text, [options])
   - Inserts a new paragraph immediately AFTER the target paragraph.
   - targetId: The paragraph ID after which to insert
   - text: New paragraph content (can include <b>, <br>, <sup>, <sub> tags)
   - options (optional): Same as REPLACE_PARAGRAPH
   - The new paragraph will receive a temporary ID (temp-{uuid}) until the document is saved.
   - Examples:
     INSERT_PARAGRAPH(p1-3, これは新しい段落です。)
     INSERT_PARAGRAPH(p2-1, 新しい見出し, blockType=h2, textAlign=center)

3. DELETE_PARAGRAPH(targetId)
   - Marks a paragraph for deletion (visually crossed out until approved).
   - targetId: The paragraph ID to delete
   - Example:
     DELETE_PARAGRAPH(p2-2)

4. MOVE_PARAGRAPH(sourceId, targetId)
   - Moves a paragraph from sourceId position to immediately AFTER targetId.
   - sourceId: The paragraph ID to move
   - targetId: The paragraph ID after which to place the moved paragraph
   - Example:
     MOVE_PARAGRAPH(p2-3, p1-5)  // Moves p2-3 to after p1-5

5. SPLIT_PARAGRAPH(targetId, beforeText, afterText)
   - Splits a paragraph into two paragraphs at a specific text boundary.
   - targetId: The paragraph ID to split
   - beforeText: Text that should end the first paragraph
   - afterText: Text that should start the second paragraph
   - The split point is determined by finding these texts in the paragraph.
   - The second paragraph receives a temporary ID (temp-{uuid}).
   - Example:
     SPLIT_PARAGRAPH(p2-4, 前半部分。, 後半部分)

6. MERGE_PARAGRAPH(sourceId, targetId)
   - Merges two paragraphs by appending sourceId content to targetId.
   - sourceId: The paragraph ID whose content will be appended
   - targetId: The paragraph ID that will receive the merged content
   - The sourceId paragraph is deleted after merging.
   - Example:
     MERGE_PARAGRAPH(p3-1, p3-2)  // Append p3-1 to p3-2, delete p3-1

## HTML TAG SUPPORT IN TEXT
Text content can include the following HTML tags:
- <b>bold text</b> - Bold formatting
- <br> - Line break
- <sup>superscript</sup> - Superscript
- <sub>subscript</sub> - Subscript

Example: REPLACE_PARAGRAPH(p1-1, H<sub>2</sub>O is water.<br>CO<sub>2</sub> is <b>carbon dioxide</b>.)

## OPTION VALUES REFERENCE
- blockType: p (paragraph), h1 (heading 1), h2 (heading 2), h3 (heading 3)
- textAlign: left, center, right
- spacing: none, small (0.5em), medium (1em), large (1.5em)
- indent: 0 (none), 1 (36pt), 2 (72pt), 3 (108pt), 4 (144pt)

## IMPORTANT RULES
- Commands must be ONE PER LINE inside the COMMAND AREA.
- Use paragraph IDs exactly as they appear in the document (e.g., "p1-2", not "p1-02").
- Do NOT edit any content outside the COMMAND AREA.
- The editor will detect, execute, and highlight your changes for user approval.
- Commands are executed sequentially in the order they appear.
- After execution, changed paragraphs are highlighted in different colors:
  * Blue: REPLACE_PARAGRAPH
  * Green: INSERT_PARAGRAPH
  * Red: DELETE_PARAGRAPH (with strikethrough)
  * Purple: MOVE_PARAGRAPH
  * Orange: SPLIT_PARAGRAPH
  * Teal: MERGE_PARAGRAPH

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
 * @param htmlContent エディタから取得したHTML文字列
 * @param isWordMode Wordモードかどうか
 * @param contentCss コンテンツCSS文字列
 * @param pageMarginText ページマージンのCSS値 (例: "17mm")
 * @param aiImageIndexHtml AI画像インデックスのHTML文字列
 * @returns 完全なHTML文書文字列
 */
export function buildFullHTML(
    htmlContent: string,
    isWordMode: boolean,
    contentCss: string,
    pageMarginText: string,
    aiImageIndexHtml: string
): string {
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
