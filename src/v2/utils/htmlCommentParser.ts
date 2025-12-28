/**
 * HTMLコメント解析ユーティリティ
 * AIコマンドエリアからコマンド文字列を抽出する純粋関数
 */

/**
 * コマンドエリアのマーカー
 */
const COMMAND_START_MARKER = '<!-- AI_COMMAND_START -->';
const COMMAND_END_MARKER = '<!-- AI_COMMAND_END -->';

/**
 * HTMLコメント内のコマンドエリアを検出
 * @param htmlContent - HTML文字列
 * @returns コマンドエリアの内容（見つからない場合はnull）
 */
export function extractCommandArea(htmlContent: string): string | null {
  const startIndex = htmlContent.indexOf(COMMAND_START_MARKER);
  const endIndex = htmlContent.indexOf(COMMAND_END_MARKER);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return null;
  }

  const commandAreaStart = startIndex + COMMAND_START_MARKER.length;
  const commandArea = htmlContent
    .substring(commandAreaStart, endIndex)
    .trim();

  return commandArea;
}

/**
 * コマンドエリアをクリア（空にする）したHTML文字列を返す
 * @param htmlContent - 元のHTML文字列
 * @returns コマンドエリアがクリアされたHTML文字列
 */
export function clearCommandArea(htmlContent: string): string {
  const startIndex = htmlContent.indexOf(COMMAND_START_MARKER);
  const endIndex = htmlContent.indexOf(COMMAND_END_MARKER);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return htmlContent;
  }

  const before = htmlContent.substring(0, startIndex + COMMAND_START_MARKER.length);
  const after = htmlContent.substring(endIndex);

  // コマンドエリアを空にして再構成
  return `${before}\n<!-- ここにコマンドを記述してください -->\n${after}`;
}

/**
 * コマンドエリアが存在するかチェック
 * @param htmlContent - HTML文字列
 * @returns コマンドエリアが存在すればtrue
 */
export function hasCommandArea(htmlContent: string): boolean {
  return (
    htmlContent.includes(COMMAND_START_MARKER) &&
    htmlContent.includes(COMMAND_END_MARKER)
  );
}

/**
 * HTMLコメント行を判定
 * @param line - 行文字列
 * @returns HTMLコメント行であればtrue
 */
export function isHtmlComment(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('<!--') && trimmed.endsWith('-->');
}

/**
 * HTMLコメントからコマンド文字列を抽出
 * @param line - HTMLコメント行
 * @returns コマンド文字列（コメント記号を除外）
 */
export function extractCommandFromComment(line: string): string | null {
  const trimmed = line.trim();

  if (!isHtmlComment(trimmed)) {
    return null;
  }

  // <!-- と --> を除去
  const content = trimmed
    .replace(/^<!--\s*/, '')
    .replace(/\s*-->$/, '')
    .trim();

  // 空行やプレースホルダーは除外
  if (
    !content ||
    content.startsWith('ここにコマンドを記述') ||
    content.startsWith('AI_COMMAND_')
  ) {
    return null;
  }

  return content;
}

/**
 * コマンドエリアからコマンド行を抽出
 * @param commandArea - コマンドエリアの内容
 * @returns コマンド文字列の配列
 */
export function extractCommands(commandArea: string): string[] {
  const lines = commandArea.split('\n');
  const commands: string[] = [];

  for (const line of lines) {
    const command = extractCommandFromComment(line);
    if (command) {
      commands.push(command);
    }
  }

  return commands;
}
