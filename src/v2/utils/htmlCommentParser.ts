/**
 * HTMLコメント解析ユーティリティ
 * AIコマンドエリアからコマンド文字列を抽出する純粋関数
 */

/**
 * コマンドエリアのマーカー（正規表現）
 */
const COMMAND_START_REGEX = /<!--\s*AI_COMMAND_START\s*-->/;
const COMMAND_END_REGEX = /<!--\s*AI_COMMAND_END\s*-->/;

/**
 * HTMLコメント内のコマンドエリアを検出
 * @param htmlContent - HTML文字列
 * @returns コマンドエリアの内容（見つからない場合はnull）
 */
export function extractCommandArea(htmlContent: string): string | null {
  const startMatch = htmlContent.match(COMMAND_START_REGEX);
  const endMatch = htmlContent.match(COMMAND_END_REGEX);

  if (!startMatch || !endMatch) {
    return null;
  }

  const startIndex = startMatch.index! + startMatch[0].length;
  const endIndex = endMatch.index!;

  if (startIndex >= endIndex) {
    return null;
  }

  return htmlContent.substring(startIndex, endIndex).trim();
}

/**
 * コマンドエリアが存在するかチェック
 * @param htmlContent - HTML文字列
 * @returns コマンドエリアが存在すればtrue
 */
export function hasCommandArea(htmlContent: string): boolean {
  return COMMAND_START_REGEX.test(htmlContent) && COMMAND_END_REGEX.test(htmlContent);
}

/**
 * HTMLコメント行を判定
 * @param line - 行文字列
 * @returns HTMLコメント行であればtrue
 */
export function isHtmlComment(line: string): boolean {
  const trimmed = line.trim();
  return /^<!--[\s\S]*-->$/.test(trimmed);
}

/**
 * HTMLコメントからコマンド文字列を抽出
 * @param line - HTMLコメント行
 * @returns コマンド文字列（コメント記号を除外）
 */
export function extractCommandFromComment(line: string): string | null {
  const trimmed = line.trim();

  // HTMLコメント形式かチェック
  const commentMatch = trimmed.match(/^<!--\s*([\s\S]*?)\s*-->$/);
  if (!commentMatch) {
    return null;
  }

  const content = commentMatch[1].trim();

  // 空行、説明、ガイド文などを除外
  if (
    !content ||
    content.startsWith('ここにコマンドを記述') ||
    content.startsWith('Write your commands') ||
    content.startsWith('AI_COMMAND_')
  ) {
    return null;
  }

  // 新コマンド形式かチェック（COMMAND_NAME( の形式）
  const newCommandPattern = /^(REPLACE_PARAGRAPH|INSERT_PARAGRAPH|DELETE_PARAGRAPH|MOVE_PARAGRAPH|SPLIT_PARAGRAPH|MERGE_PARAGRAPH)\s*\(/;
  if (!newCommandPattern.test(content)) {
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

  // 行を跨いで記述されている場合（<!-- ... --> が複数行にわたる場合）への対応は
  // 現状の要件（1行1コマンド）に基づき、上記で行う

  return commands;
}
