/**
 * 新コマンドパーサー
 * 段落IDベースのコマンド文字列を解析してCommandオブジェクトに変換
 */

import type {
  Command,
  ParseResult,
  ParseError,
  ParagraphOptions,
  BlockType,
  TextAlign,
  ParagraphSpacing,
  IndentLevel,
} from '@/types/command';
import { generateTempId, isValidParagraphId } from '@/utils/paragraphIdManager';
import { v4 as uuidv4 } from 'uuid';

/**
 * コマンド文字列から引数を抽出
 * カッコで囲まれた部分を抽出
 * 
 * @param commandStr - コマンド文字列
 * @returns 引数配列
 */
function extractArguments(commandStr: string): string[] {
  const args: string[] = [];
  const regex = /\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(commandStr)) !== null) {
    args.push(match[1].trim());
  }

  return args;
}

/**
 * オプション文字列をパース
 * 形式: key=value, key=value, ...
 * 
 * @param optionsStr - オプション文字列
 * @returns ParagraphOptions
 */
function parseOptions(optionsStr: string): ParagraphOptions {
  const options: ParagraphOptions = {};

  if (!optionsStr || optionsStr.trim() === '') {
    return options;
  }

  // key=value形式を分割
  const pairs = optionsStr.split(',').map(p => p.trim());

  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(s => s.trim());

    if (!key || !value) continue;

    switch (key) {
      case 'blockType':
        if (['p', 'h1', 'h2', 'h3'].includes(value)) {
          options.blockType = value as BlockType;
        }
        break;
      case 'textAlign':
        if (['left', 'center', 'right'].includes(value)) {
          options.textAlign = value as TextAlign;
        }
        break;
      case 'spacing':
        if (['none', 'small', 'medium', 'large'].includes(value)) {
          options.spacing = value as ParagraphSpacing;
        }
        break;
      case 'indent':
        const indentNum = parseInt(value, 10);
        if (indentNum >= 0 && indentNum <= 4) {
          options.indent = indentNum as IndentLevel;
        }
        break;
    }
  }

  return options;
}

/**
 * REPLACE_PARAGRAPH コマンドをパース
 * 形式: REPLACE_PARAGRAPH(targetId, text, options?)
 * 
 * @param args - 引数配列
 * @param lineNumber - 行番号
 * @returns Command | ParseError
 */
function parseReplaceParagraph(
  args: string[],
  lineNumber?: number
): Command | ParseError {
  if (args.length < 2) {
    return {
      message: 'REPLACE_PARAGRAPH: 引数が不足しています（targetId, text が必要）',
      lineNumber,
      rawCommand: `REPLACE_PARAGRAPH(${args.join(', ')})`,
    };
  }

  const [targetId, text, optionsStr] = args;

  if (!isValidParagraphId(targetId)) {
    return {
      message: `REPLACE_PARAGRAPH: 無効な段落ID: ${targetId}`,
      lineNumber,
      rawCommand: `REPLACE_PARAGRAPH(${args.join(', ')})`,
    };
  }

  const options = optionsStr ? parseOptions(optionsStr) : undefined;

  return {
    type: 'REPLACE_PARAGRAPH',
    commandId: uuidv4(),
    targetId,
    text,
    options,
    lineNumber,
  };
}

/**
 * INSERT_PARAGRAPH コマンドをパース
 * 形式: INSERT_PARAGRAPH(targetId, text, options?)
 * 
 * @param args - 引数配列
 * @param lineNumber - 行番号
 * @returns Command | ParseError
 */
function parseInsertParagraph(
  args: string[],
  lineNumber?: number
): Command | ParseError {
  if (args.length < 2) {
    return {
      message: 'INSERT_PARAGRAPH: 引数が不足しています（targetId, text が必要）',
      lineNumber,
      rawCommand: `INSERT_PARAGRAPH(${args.join(', ')})`,
    };
  }

  const [targetId, text, optionsStr] = args;

  if (!isValidParagraphId(targetId)) {
    return {
      message: `INSERT_PARAGRAPH: 無効な段落ID: ${targetId}`,
      lineNumber,
      rawCommand: `INSERT_PARAGRAPH(${args.join(', ')})`,
    };
  }

  const options = optionsStr ? parseOptions(optionsStr) : undefined;
  const tempId = generateTempId();

  return {
    type: 'INSERT_PARAGRAPH',
    commandId: uuidv4(),
    targetId,
    text,
    options,
    tempId,
    lineNumber,
  };
}

/**
 * DELETE_PARAGRAPH コマンドをパース
 * 形式: DELETE_PARAGRAPH(targetId)
 * 
 * @param args - 引数配列
 * @param lineNumber - 行番号
 * @returns Command | ParseError
 */
function parseDeleteParagraph(
  args: string[],
  lineNumber?: number
): Command | ParseError {
  if (args.length < 1) {
    return {
      message: 'DELETE_PARAGRAPH: 引数が不足しています（targetId が必要）',
      lineNumber,
      rawCommand: `DELETE_PARAGRAPH(${args.join(', ')})`,
    };
  }

  const targetId = args[0];

  if (!isValidParagraphId(targetId)) {
    return {
      message: `DELETE_PARAGRAPH: 無効な段落ID: ${targetId}`,
      lineNumber,
      rawCommand: `DELETE_PARAGRAPH(${args.join(', ')})`,
    };
  }

  return {
    type: 'DELETE_PARAGRAPH',
    commandId: uuidv4(),
    targetId,
    lineNumber,
  };
}

/**
 * MOVE_PARAGRAPH コマンドをパース
 * 形式: MOVE_PARAGRAPH(sourceId, targetId)
 * 
 * @param args - 引数配列
 * @param lineNumber - 行番号
 * @returns Command | ParseError
 */
function parseMoveParagraph(
  args: string[],
  lineNumber?: number
): Command | ParseError {
  if (args.length < 2) {
    return {
      message: 'MOVE_PARAGRAPH: 引数が不足しています（sourceId, targetId が必要）',
      lineNumber,
      rawCommand: `MOVE_PARAGRAPH(${args.join(', ')})`,
    };
  }

  const [sourceId, targetId] = args;

  if (!isValidParagraphId(sourceId)) {
    return {
      message: `MOVE_PARAGRAPH: 無効な移動元段落ID: ${sourceId}`,
      lineNumber,
      rawCommand: `MOVE_PARAGRAPH(${args.join(', ')})`,
    };
  }

  if (!isValidParagraphId(targetId)) {
    return {
      message: `MOVE_PARAGRAPH: 無効な移動先段落ID: ${targetId}`,
      lineNumber,
      rawCommand: `MOVE_PARAGRAPH(${args.join(', ')})`,
    };
  }

  return {
    type: 'MOVE_PARAGRAPH',
    commandId: uuidv4(),
    sourceId,
    targetId,
    lineNumber,
  };
}

/**
 * SPLIT_PARAGRAPH コマンドをパース
 * 形式: SPLIT_PARAGRAPH(targetId, beforeText, afterText)
 * 
 * @param args - 引数配列
 * @param lineNumber - 行番号
 * @returns Command | ParseError
 */
function parseSplitParagraph(
  args: string[],
  lineNumber?: number
): Command | ParseError {
  if (args.length < 3) {
    return {
      message: 'SPLIT_PARAGRAPH: 引数が不足しています（targetId, beforeText, afterText が必要）',
      lineNumber,
      rawCommand: `SPLIT_PARAGRAPH(${args.join(', ')})`,
    };
  }

  const [targetId, beforeText, afterText] = args;

  if (!isValidParagraphId(targetId)) {
    return {
      message: `SPLIT_PARAGRAPH: 無効な段落ID: ${targetId}`,
      lineNumber,
      rawCommand: `SPLIT_PARAGRAPH(${args.join(', ')})`,
    };
  }

  const tempId = generateTempId();

  return {
    type: 'SPLIT_PARAGRAPH',
    commandId: uuidv4(),
    targetId,
    beforeText,
    afterText,
    tempId,
    lineNumber,
  };
}

/**
 * MERGE_PARAGRAPH コマンドをパース
 * 形式: MERGE_PARAGRAPH(sourceId, targetId)
 * 
 * @param args - 引数配列
 * @param lineNumber - 行番号
 * @returns Command | ParseError
 */
function parseMergeParagraph(
  args: string[],
  lineNumber?: number
): Command | ParseError {
  if (args.length < 2) {
    return {
      message: 'MERGE_PARAGRAPH: 引数が不足しています（sourceId, targetId が必要）',
      lineNumber,
      rawCommand: `MERGE_PARAGRAPH(${args.join(', ')})`,
    };
  }

  const [sourceId, targetId] = args;

  if (!isValidParagraphId(sourceId)) {
    return {
      message: `MERGE_PARAGRAPH: 無効な結合元段落ID: ${sourceId}`,
      lineNumber,
      rawCommand: `MERGE_PARAGRAPH(${args.join(', ')})`,
    };
  }

  if (!isValidParagraphId(targetId)) {
    return {
      message: `MERGE_PARAGRAPH: 無効な結合先段落ID: ${targetId}`,
      lineNumber,
      rawCommand: `MERGE_PARAGRAPH(${args.join(', ')})`,
    };
  }

  return {
    type: 'MERGE_PARAGRAPH',
    commandId: uuidv4(),
    sourceId,
    targetId,
    lineNumber,
  };
}

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
      // Commandオブジェクト
      commands.push(result);
    } else {
      // ParseError
      errors.push(result);
    }
  });

  return { commands, errors };
}
