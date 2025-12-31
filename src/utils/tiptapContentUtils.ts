/**
 * Tiptapコンテンツ操作ユーティリティ
 */

/**
 * HTMLテキストをパースしてTiptapノード用のコンテンツに変換
 * 太字、改行、上付き下付きタグを解釈
 * 
 * @param htmlText - HTMLタグを含むテキスト
 * @returns パースされたコンテンツ配列
 */
export function parseHtmlText(htmlText: string): any[] {
  if (!htmlText) return [];

  const content: any[] = [];
  
  // 簡易タグパーサー (太字: ** または <b>, <i>, <u>, <sup>, <sub>, <br>)
  // 実際には正規表現で分割して処理
  const tokens = htmlText.split(/(<b>.*?<\/b>|<strong>.*?<\/strong>|<i>.*?<\/i>|<em>.*?<\/em>|<sup>.*?<\/sup>|<sub>.*?<\/sub>|<br\s*\/?>)/g);

  for (const token of tokens) {
    if (!token) continue;

    if (token.startsWith('<b>') || token.startsWith('<strong>')) {
      const text = token.replace(/<\/?(b|strong)>/g, '');
      content.push({ type: 'text', text, marks: [{ type: 'bold' }] });
    } else if (token.startsWith('<i>') || token.startsWith('<em>')) {
      const text = token.replace(/<\/?(i|em)>/g, '');
      content.push({ type: 'text', text, marks: [{ type: 'italic' }] });
    } else if (token.startsWith('<sup>')) {
      const text = token.replace(/<\/?sup>/g, '');
      content.push({ type: 'text', text, marks: [{ type: 'superscript' }] });
    } else if (token.startsWith('<sub>')) {
      const text = token.replace(/<\/?sub>/g, '');
      content.push({ type: 'text', text, marks: [{ type: 'subscript' }] });
    } else if (token.startsWith('<br')) {
      content.push({ type: 'hardBreak' });
    } else {
      // プレーンテキスト
      content.push({ type: 'text', text: token });
    }
  }

  return content;
}
