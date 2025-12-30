


/**
 * AIエージェント向けガイド（head内に配置するコメント）
 * 簡潔版: コンテキスト消費を最小化
 */
export function generateAiGuide(isWordMode: boolean): string {
    const modeDesc = isWordMode 
        ? "Word Mode: Continuous flow, IDs like 'p1', 'p2'." 
        : "Paginated Mode: A4 sections, IDs like 'p1-1', 'p1-2' (page-paragraph).";

    return `
<!--
===============================================================================
AI COMMAND API (v2.0 - Paragraph ID System)
===============================================================================

OVERVIEW:
Visual editor document. Edit via commands targeting paragraph IDs in COMMAND AREA.

STRUCTURE:
- ${modeDesc}
- Every paragraph/heading has unique 'id' (e.g., id="p1-1", id="p2-3")
- Format: "${isWordMode ? 'p{number}' : 'p{page}-{paragraph}'}" (1-indexed)
- Content inside class "page-inner"

COMMAND AREA:
Located after &lt;body&gt; tag:
  &lt;!-- AI_COMMAND_START --&gt;
  &lt;!-- AI_COMMAND_END --&gt;

CRITICAL: Write commands BETWEEN markers, NOT replacing them!

COMMAND FORMAT:
Each command MUST be wrapped: &lt;!-- COMMAND --&gt;

Example:
  &lt;!-- AI_COMMAND_START --&gt;
  &lt;!-- REPLACE_PARAGRAPH(p1-2, New text) --&gt;
  &lt;!-- INSERT_PARAGRAPH(p1-3, Another paragraph) --&gt;
  &lt;!-- DELETE_PARAGRAPH(p2-1) --&gt;
  &lt;!-- AI_COMMAND_END --&gt;

COMMANDS:

1. REPLACE_PARAGRAPH(targetId, text, [options])
   Replace paragraph content.
   Options: blockType=p|h1|h2|h3, textAlign=left|center|right, 
            spacing=none|small|medium|large, indent=0|1|2|3|4
   Example: &lt;!-- REPLACE_PARAGRAPH(p1-2, &lt;b&gt;Bold&lt;/b&gt; text, blockType=h1) --&gt;

2. INSERT_PARAGRAPH(targetId, text, [options])
   Insert new paragraph AFTER target. Options same as REPLACE_PARAGRAPH.
   Example: &lt;!-- INSERT_PARAGRAPH(p1-3, New paragraph) --&gt;

3. DELETE_PARAGRAPH(targetId)
   Mark for deletion (crossed out until approved).
   Example: &lt;!-- DELETE_PARAGRAPH(p2-2) --&gt;

4. MOVE_PARAGRAPH(sourceId, targetId)
   Move source paragraph to AFTER target.
   Example: &lt;!-- MOVE_PARAGRAPH(p2-3, p1-5) --&gt;

5. SPLIT_PARAGRAPH(targetId, beforeText, afterText)
   Split paragraph at text boundary.
   Example: &lt;!-- SPLIT_PARAGRAPH(p2-4, First part., Second part) --&gt;

6. MERGE_PARAGRAPH(sourceId, targetId)
   Merge source into target (source deleted).
   Example: &lt;!-- MERGE_PARAGRAPH(p3-1, p3-2) --&gt;

HTML TAGS IN TEXT:
&lt;b&gt;bold&lt;/b&gt;, &lt;br&gt;, &lt;sup&gt;superscript&lt;/sup&gt;, &lt;sub&gt;subscript&lt;/sub&gt;

RULES:
1. Each command on own line with &lt;!-- --&gt;
2. Use exact paragraph IDs (e.g., "p1-2", not "p1-02")
3. Do NOT edit outside COMMAND AREA
4. Do NOT replace/remove markers
5. Commands execute sequentially

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
 * CSSをモード別に最適化する
 * @param contentCss 完全なCSS文字列
 * @param isWordMode Wordモードかどうか
 * @returns 最適化されたCSS文字列
 */
function optimizeCssForMode(contentCss: string, isWordMode: boolean): string {
    // 1. コメント削除
    let cleanedCss = contentCss.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 2. CSS変数の重複を削除（content.cssの:rootを削除、buildFullHTMLで再定義する）
    cleanedCss = cleanedCss.replace(/:root\s*\{[^}]*\}/g, '');
    
    // 3. エディタ専用クラスを削除（出力HTMLには不要）
    cleanedCss = cleanedCss.replace(/\.ProseMirror\s*\{[^}]*\}/g, '');
    
    // 4. 未使用のエディタ専用セレクタを削除
    cleanedCss = cleanedCss.replace(/body\.hide-page-numbers[^{]*\{[^}]*\}/g, '');
    cleanedCss = cleanedCss.replace(/body\.hide-para-numbers[^{]*\{[^}]*\}/g, '');
    
    // 5. @media print内のエディタ専用セレクタを削除（PDF出力には不要）
    cleanedCss = cleanedCss.replace(
        /@media print\s*\{([\s\S]*?)\}/,
        (match, printContent) => {
            let optimizedPrint = printContent
                .replace(/\.flex\.flex-col\.h-screen\s*\{[^}]*\}/g, '')
                .replace(/\.flex\.flex-1\.overflow-hidden\s*\{[^}]*\}/g, '');
            return `@media print {${optimizedPrint}}`;
        }
    );
    
    // 6. モード別の最適化
    if (isWordMode) {
        cleanedCss = cleanedCss.replace(/section\.page::after\s*\{[^}]*\}/g, '');
        cleanedCss = cleanedCss.replace(
            /section\.page\s*\{\s*position:\s*relative;\s*width:\s*210mm;\s*min-width:\s*210mm;\s*height:\s*297mm;\s*min-height:\s*297mm;[^}]*\}/g,
            'section.page { position: relative; width: 210mm; min-width: 210mm; background: #fff; box-shadow: 10px 0 10px -5px rgba(0, 0, 0, 0.1), -10px 0 10px -5px rgba(0, 0, 0, 0.1); box-sizing: border-box; overflow: visible; margin: 0 auto; height: auto; min-height: 297mm; }'
        );
    } else {
        cleanedCss = cleanedCss.replace(/body\.mode-word[^{]*\{[^}]*\}/g, '');
    }
    
    // 7. エディタ専用プロパティの削除
    // caret-color（カーソル色）の削除
    cleanedCss = cleanedCss.replace(/\s*caret-color:\s*[^;]+;/g, '');
    
    // overflow-y: auto（エディタのスクロール）の削除
    cleanedCss = cleanedCss.replace(/\s*overflow-y:\s*auto;/g, '');
    
    // outline: none（フォーカス枠削除）の削除
    cleanedCss = cleanedCss.replace(/\s*outline:\s*none;/g, '');
    
    // transition（エディタのアニメーション）の削除
    cleanedCss = cleanedCss.replace(/\s*transition:\s*[^;]+;/g, '');
    
    // 8. ProseMirror関連セレクタを含むルールの削除
    // .ProseMirror-separator, .ProseMirror-trailingBreak などを含むルール
    cleanedCss = cleanedCss.replace(
        /[^}]*\.ProseMirror-[^{]*\{[^}]*\}\s*/g,
        ''
    );
    
    // 9. 空行の削除（3行以上の連続空行を2行に、末尾空白削除）
    cleanedCss = cleanedCss.replace(/\n\s*\n\s*\n+/g, '\n\n');
    cleanedCss = cleanedCss.trim();
    
    return cleanedCss;
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

    // CSSをモード別に最適化
    const optimizedCss = optimizeCssForMode(contentCss, isWordMode);

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
:root { 
  --page-margin: ${pageMarginText}; 
  --editor-font-family: inherit;
  --tab-width: 0px;
}
${optimizedCss}
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
