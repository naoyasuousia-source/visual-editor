/**
 * コマンドパーサー
 * コマンド文字列を解析してCommandオブジェクトに変換する純粋関数
 */

import type {
  Command,
  Position,
  Range,
  ParseResult,
  ParseError,
} from '@/types/ai-sync.types';
import { isAllowedCommand, validateCommand } from '@/utils/commandValidator';

/**
 * 位置指定文字列をパース（例: "3:10" → {paragraph: 3, offset: 10}）
 * @param posStr - 位置指定文字列
 * @returns Position | null
 */
function parsePosition(posStr: string): Position | null {
  const match = posStr.match(/^(\d+):(\d+)$/);
  if (!match) return null;

  return {
    paragraph: parseInt(match[1], 10),
    offset: parseInt(match[2], 10),
  };
}

/**
 * 範囲指定文字列をパース（例: "3:10-20" → Range）
 * @param rangeStr - 範囲指定文字列
 * @returns Range | null
 */
function parseRange(rangeStr: string): Range | null {
  const match = rangeStr.match(/^(\d+):(\d+)-(\d+)$/);
  if (!match) return null;

  const paragraph = parseInt(match[1], 10);
  return {
    start: { paragraph, offset: parseInt(match[2], 10) },
    end: { paragraph, offset: parseInt(match[3], 10) },
  };
}

/**
 * コマンド文字列から引数を抽出（括弧で囲まれた部分）
 * @param commandStr - コマンド文字列
 * @returns 引数の配列
 */
function extractArguments(commandStr: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let currentArg = '';
  let inBracket = false;

  for (let i = 0; i < commandStr.length; i++) {
    const char = commandStr[i];

    if (char === '[' && depth === 0) {
      inBracket = true;
      depth++;
      currentArg = '';
    } else if (char === '[' && depth > 0) {
      depth++;
      currentArg += char;
    } else if (char === ']' && depth > 0) {
      depth--;
      if (depth === 0) {
        args.push(currentArg);
        currentArg = '';
        inBracket = false;
      } else {
        currentArg += char;
      }
    } else if (inBracket) {
      currentArg += char;
    }
  }

  return args;
}

/**
 * 単一のコマンド文字列をパース
 * @param commandStr - コマンド文字列
 * @param lineNumber - 行番号（エラー表示用）
 * @returns Command | ParseError
 */
function parseSingleCommand(
  commandStr: string,
  lineNumber?: number
): Command | ParseError {
  const trimmed = commandStr.trim();

  // コマンドタイプを抽出
  const typeMatch = trimmed.match(/^([A-Z_]+)/);
  if (!typeMatch) {
    return {
      message: 'コマンドタイプが識別できません',
      lineNumber,
      rawCommand: commandStr,
    };
  }

  const type = typeMatch[1];
  if (!isAllowedCommand(type)) {
    return {
      message: `許可されていないコマンド: ${type}`,
      lineNumber,
      rawCommand: commandStr,
    };
  }

  // 引数を抽出
  const args = extractArguments(trimmed);

  try {
    let command: Command;

    switch (type) {
      case 'INSERT_TEXT': {
        if (args.length < 2) {
          throw new Error('引数が不足しています（位置、テキストが必要）');
        }
        const position = parsePosition(args[0]);
        if (!position) {
          throw new Error(`位置指定が不正です: ${args[0]}`);
        }
        command = {
          type: 'INSERT_TEXT',
          position,
          text: args[1],
          lineNumber,
        };
        break;
      }

      case 'REPLACE_TEXT': {
        if (args.length < 2) {
          throw new Error('引数が不足しています（検索、置換が必要）');
        }
        command = {
          type: 'REPLACE_TEXT',
          search: args[0],
          replace: args[1],
          options: {
            all: args[2] === 'all',
            regex: args[3] === 'regex',
            caseSensitive: args[4] === 'caseSensitive',
          },
          lineNumber,
        };
        break;
      }

      case 'DELETE_TEXT': {
        if (args.length < 1) {
          throw new Error('引数が不足しています（範囲が必要）');
        }
        const range = parseRange(args[0]);
        if (!range) {
          throw new Error(`範囲指定が不正です: ${args[0]}`);
        }
        command = {
          type: 'DELETE_TEXT',
          range,
          lineNumber,
        };
        break;
      }

      case 'FORMAT_TEXT': {
        if (args.length < 2) {
          throw new Error('引数が不足しています（範囲、書式が必要）');
        }
        const range = parseRange(args[0]);
        if (!range) {
          throw new Error(`範囲指定が不正です: ${args[0]}`);
        }
        const format = args[1] as 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';
        command = {
          type: 'FORMAT_TEXT',
          range,
          format,
          lineNumber,
        };
        break;
      }

      case 'INSERT_PARAGRAPH': {
        if (args.length < 2) {
          throw new Error('引数が不足しています（位置、テキストが必要）');
        }
        const position = parseInt(args[0], 10);
        if (isNaN(position)) {
          throw new Error(`段落位置が不正です: ${args[0]}`);
        }
        command = {
          type: 'INSERT_PARAGRAPH',
          position,
          text: args[1],
          lineNumber,
        };
        break;
      }

      case 'DELETE_PARAGRAPH': {
        if (args.length < 1) {
          throw new Error('引数が不足しています（段落番号が必要）');
        }
        const paragraph = parseInt(args[0], 10);
        if (isNaN(paragraph)) {
          throw new Error(`段落番号が不正です: ${args[0]}`);
        }
        command = {
          type: 'DELETE_PARAGRAPH',
          paragraph,
          lineNumber,
        };
        break;
      }

      case 'MOVE_PARAGRAPH': {
        if (args.length < 2) {
          throw new Error('引数が不足しています（移動元、移動先が必要）');
        }
        const from = parseInt(args[0], 10);
        const to = parseInt(args[1], 10);
        if (isNaN(from) || isNaN(to)) {
          throw new Error(`段落番号が不正です: ${args[0]}, ${args[1]}`);
        }
        command = {
          type: 'MOVE_PARAGRAPH',
          from,
          to,
          lineNumber,
        };
        break;
      }

      default:
        throw new Error(`未実装のコマンド: ${type}`);
    }

    // コマンドのバリデーション
    const validation = validateCommand(command);
    if (!validation.valid) {
      return {
        message: validation.error || 'バリデーションエラー',
        lineNumber,
        rawCommand: commandStr,
      };
    }

    return command;
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : '不明なエラー',
      lineNumber,
      rawCommand: commandStr,
    };
  }
}

/**
 * 複数のコマンド文字列をパース
 * @param commandStrings - コマンド文字列の配列
 * @returns ParseResult
 */
export function parseCommands(commandStrings: string[]): ParseResult {
  const commands: Command[] = [];
  const errors: ParseError[] = [];

  commandStrings.forEach((commandStr, index) => {
    const result = parseSingleCommand(commandStr, index + 1);

    if ('type' in result) {
      commands.push(result);
    } else {
      errors.push(result);
    }
  });

  return { commands, errors };
}
