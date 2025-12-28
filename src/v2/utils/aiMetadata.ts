import { Editor } from '@tiptap/react';

/**
 * AIメタガイド生成ユーティリティ
 * V1の ai-meta.ts の機能を再現
 * 
 * 【重要】直接DOM操作は行わず、HTML文字列として生成する
 */
export function generateAiMetaGuide(isWordMode: boolean): string {
    if (isWordMode) {
        return `
<!-- AI ASSISTANT GUIDE
This HTML structure represents a continuous document (Word Mode).
- Paragraphs have simple sequential IDs like "p1", "p2", etc.
- Use these IDs to locate specific paragraphs when assisting the user.
-->
`;
    } else {
        return `
<!-- AI ASSISTANT GUIDE
This HTML structure represents a paginated document.
- <section class="page"> represents a physical A4 page.
- .page-inner contains the editable content.
- Paragraphs have IDs like "p1-1" (Page 1, Paragraph 1).
- Images and figure metadata are stored in #ai-image-index at the bottom.
Use the IDs to locate specific paragraphs when assisting the user.
-->
`;
    }
}

/**
 * 完全なHTML文書を生成する
 * V1の buildFullHTML を完全再現
 * 
 * @param editor Tiptapエディタインスタンス
 * @param isWordMode Wordモードかどうか
 * @param contentCss コンテンツCSS文字列
 * @returns 完全なHTML文書文字列
 */
export function buildFullHTML(
    editor: Editor,
    isWordMode: boolean,
    contentCss: string
): string {
    // 1. エディタコンテンツを取得
    const htmlContent = editor.getHTML();

    // 2. 現在のページマージン設定を取得
    const rootStyle = getComputedStyle(document.documentElement);
    const currentMargin = rootStyle.getPropertyValue('--page-margin').trim() || '17mm';

    // 3. AIメタガイドを生成
    const aiMetaGuide = generateAiMetaGuide(isWordMode);

    // 4. AI画像インデックスを取得（DOMから）
    // 注: これはReactコンポーネントがレンダリングしたものを取得
    const aiImageIndexElement = document.getElementById('ai-image-index');
    const aiImageIndex = aiImageIndexElement?.outerHTML || '';

    // 5. bodyクラスを設定
    const bodyClass = isWordMode ? 'mode-word' : '';
    const finalClass = `standalone-html ${bodyClass}`.trim();

    // 6. 出力用HTMLのクリーンアップ
    let cleanedHtml = htmlContent;

    // CSSからコメントを削除
    const cleanedCss = contentCss.replace(/\/\*[\s\S]*?\*\//g, '');

    // contenteditable="true" を削除
    cleanedHtml = cleanedHtml.replace(/\scontenteditable="true"/g, '');

    // 段落(p)と見出し(h1-h6)から data-page 属性を削除
    cleanedHtml = cleanedHtml.replace(/(<(?:p|h1|h2|h3|h4|h5|h6)[^>]*)(\sdata-page="[^"]*")([^>]*>)/g, '$1$3');

    // imgタグから data-caption と data-tag 属性を削除
    // ※複数の属性を確実に削除するため、個別に置換
    cleanedHtml = cleanedHtml.replace(/(<img[^>]*)(\sdata-caption="[^"]*")([^>]*>)/g, '$1$3');
    cleanedHtml = cleanedHtml.replace(/(<img[^>]*)(\sdata-tag="[^"]*")([^>]*>)/g, '$1$3');

    // 7. 完全なHTML文書を構築
    return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
<style>
:root { --page-margin: ${currentMargin}; }
${cleanedCss}
</style>
</head>
<body class="${finalClass}">
${aiMetaGuide}
<div id="pages-container">
${cleanedHtml}
</div>
${aiImageIndex}
</body>
</html>`;
}
