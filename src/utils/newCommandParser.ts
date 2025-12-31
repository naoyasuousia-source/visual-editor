/**
 * 新コマンドパーサー
 * 段落IDベースのコマンド文字列を解析してCommandオブジェクトに変換
 */

import type {
  Command,
  ParseResult,
  ParseError,
} from '@/types/command';
import { extractArguments } from './parsers/common';
import {
  parseReplaceParagraph,
  parseInsertParagraph,
  parseDeleteParagraph,
  parseMoveParagraph,
  parseSplitParagraph,
  parseMergeParagraph,
} from './parsers/newCommandHandlers';

/**
 * 単一のコマンド文字列をパース
 * 
 * @param commandStr - コマンド文字列
 * @param lineNumber - 行番号
 * @returns Command | ParseError
 */
export function parseSingleCommand(
  commandStr: string,
  lineNumber?: number
): Command | ParseError {
  const trimmed = commandStr.trim();

  if (!trimmed) {
    return {
      message: '空のコマンド文字列です',
      lineNumber,
      rawCommand: commandStr,
    };
  }

  // コマンドタイプを抽出
  const commandTypeMatch = trimmed.match(/^([A-Z_]+)\(/);
  if (!commandTypeMatch) {
    return {
      message: 'コマンドタイプが識別できません',
      lineNumber,
      rawCommand: commandStr,
    };
  }

  const commandType = commandTypeMatch[1];
  const args = extractArguments(trimmed);

  switch (commandType) {
    case 'REPLACE_PARAGRAPH':
      return parseReplaceParagraph(args, lineNumber);
    case 'INSERT_PARAGRAPH':
      return parseInsertParagraph(args, lineNumber);
    case 'DELETE_PARAGRAPH':
      return parseDeleteParagraph(args, lineNumber);
    case 'MOVE_PARAGRAPH':
      return parseMoveParagraph(args, lineNumber);
    case 'SPLIT_PARAGRAPH':
      return parseSplitParagraph(args, lineNumber);
    case 'MERGE_PARAGRAPH':
      return parseMergeParagraph(args, lineNumber);
    default:
      return {
        message: `未知のコマンドタイプ: ${commandType}`,
        lineNumber,
        rawCommand: commandStr,
      };
  }
}

/**
 * 複数のコマンド文字列をパース
 * 
 * @param commandStrings - コマンド文字列の配列
 * @returns ParseResult
 */
export function parseNewCommands(commandStrings: string[]): ParseResult {
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
