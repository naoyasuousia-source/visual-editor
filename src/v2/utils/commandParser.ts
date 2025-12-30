/**
 * コマンドパーサー
 * コマンド文字列を解析してCommandオブジェクトに変換する純粋関数
 */

import type {
  Command,
  ParseResult,
  ParseError,
} from '@/types/ai-sync.types';
import { isAllowedCommand } from '@/utils/commandValidator';
import { handleOldCommand } from './parsers/oldCommandHandlers';

/**
 * コマンド文字列から引数を抽出（括弧で囲まれた部分）
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
 */
export function parseSingleCommand(
  commandStr: string,
  lineNumber?: number
): Command | ParseError {
  const trimmed = commandStr.trim();

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

  const args = extractArguments(trimmed);
  const result = handleOldCommand(type, args, commandStr, lineNumber);
  
  // ParseErrorの形式に適合させる
  if ('message' in result && !('type' in result)) {
    return result as ParseError;
  }
  
  return result as Command;
}

/**
 * 複数のコマンド文字列をパース
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
