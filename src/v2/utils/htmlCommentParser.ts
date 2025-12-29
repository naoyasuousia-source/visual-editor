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

  const content = trimmed
    .replace(/^<!--\s*/, '')
    .replace(/\s*-->$/, '')
    .trim();

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
  // CRLF/LF両対応で行分割
  const lines = commandArea.split(/\r?\n/);
  const commands: string[] = [];

  for (const line of lines) {
    const command = extractCommandFromComment(line);
    if (command) {
      commands.push(command);
    }
  }

  return commands;
}
