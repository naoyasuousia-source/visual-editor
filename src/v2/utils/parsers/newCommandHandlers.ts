import { v4 as uuidv4 } from 'uuid';
import type { Command, ParseError } from '@/types/command';
import { generateTempId, isValidParagraphId } from '@/utils/paragraphIdManager';
import { parseOptions } from './common';

/**
 * REPLACE_PARAGRAPH コマンドをパース
 */
export function parseReplaceParagraph(
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

  const targetId = args[0];
  let firstOptionIndex = args.length;
  for (let i = 2; i < args.length; i++) {
    if (args[i].includes('=')) {
      firstOptionIndex = i;
      break;
    }
  }

  const textParts = args.slice(1, firstOptionIndex);
  const text = textParts.join(', ');
  const optionsStr = firstOptionIndex < args.length ? args.slice(firstOptionIndex).join(', ') : undefined;

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
 */
export function parseInsertParagraph(
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

  const targetId = args[0];
  let firstOptionIndex = args.length;
  for (let i = 2; i < args.length; i++) {
    if (args[i].includes('=')) {
      firstOptionIndex = i;
      break;
    }
  }

  const textParts = args.slice(1, firstOptionIndex);
  const text = textParts.join(', ');
  const optionsStr = firstOptionIndex < args.length ? args.slice(firstOptionIndex).join(', ') : undefined;

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
 */
export function parseDeleteParagraph(
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
 */
export function parseMoveParagraph(
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
 */
export function parseSplitParagraph(
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
 */
export function parseMergeParagraph(
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
