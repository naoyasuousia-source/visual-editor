/**
 * HTML構造操作ユーティリティ
 */

/**
 * フルHTML文書の特定エリアを編集後のコンテンツで置換する
 * @param baseFullHtml - 元のHTML全文
 * @param editorHtml - エディタの出力（<div>...</div> など）
 * @returns 置換後のHTML全文
 */
export function injectContentToHtml(baseFullHtml: string, editorHtml: string): string {
  // 1. pages-container を探す
  const containerId = 'id="pages-container"';
  const containerIndex = baseFullHtml.indexOf(containerId);

  if (containerIndex === -1) {
    // コンテナが見つからない場合は単なる置換
    return injectToBody(baseFullHtml, editorHtml);
  }

  // 2. コンテナの開始タグの終わりを探す
  const containerEndTagStart = baseFullHtml.indexOf('>', containerIndex);
  if (containerEndTagStart === -1) return editorHtml;

  // 3. コンテナの閉じタグを探す
  // ※簡易的な実装：pages-containerの直後の</div>を探す
  const nextDivClose = baseFullHtml.indexOf('</div>', containerEndTagStart);
  if (nextDivClose === -1) return editorHtml;

  // 前後の部分を抽出して、エディタの内容を挟む
  const before = baseFullHtml.substring(0, containerEndTagStart + 1);
  const after = baseFullHtml.substring(nextDivClose);

  // コンテンツを少し整形（改行など）
  return `${before}\n    ${editorHtml}\n  ${after}`;
}

/**
 * <body>タグの中身を置換する（フォールバック用）
 */
function injectToBody(fullHtml: string, editorHtml: string): string {
  const bodyStart = fullHtml.indexOf('<body');
  if (bodyStart === -1) return editorHtml;

  const bodyTagEnd = fullHtml.indexOf('>', bodyStart);
  const bodyClose = fullHtml.indexOf('</body>');

  if (bodyTagEnd === -1 || bodyClose === -1) return editorHtml;

  const before = fullHtml.substring(0, bodyTagEnd + 1);
  const after = fullHtml.substring(bodyClose);

  return `${before}\n  ${editorHtml}\n${after}`;
}
