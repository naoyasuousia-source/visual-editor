import type {
  Command,
  Position,
  Range,
} from '@/types/ai-sync.types';
import { validateCommand } from '@/utils/commandValidator';

/**
 * 位置指定文字列をパース（例: "3:10" → {paragraph: 3, offset: 10}）
 */
export function parsePosition(posStr: string): Position | null {
  const match = posStr.match(/^(\d+):(\d+)$/);
  if (!match) return null;

  return {
    paragraph: parseInt(match[1], 10),
    offset: parseInt(match[2], 10),
  };
}

/**
 * 範囲指定文字列をパース（例: "3:10-20" → Range）
 */
export function parseRange(rangeStr: string): Range | null {
  const match = rangeStr.match(/^(\d+):(\d+)-(\d+)$/);
  if (!match) return null;

  const paragraph = parseInt(match[1], 10);
  return {
    start: { paragraph, offset: parseInt(match[2], 10) },
    end: { paragraph, offset: parseInt(match[3], 10) },
  };
}

/**
 * コマンドのパース実体
 */
export function handleOldCommand(
  type: string,
  args: string[],
  commandStr: string,
  lineNumber?: number
): Command | { message: string; lineNumber?: number; rawCommand: string } {
  try {
    let command: Command;

    switch (type) {
      case 'INSERT_TEXT': {
        if (args.length < 2) throw new Error('引数が不足しています（位置、テキストが必要）');
        const position = parsePosition(args[0]);
        if (!position) throw new Error(`位置指定が不正です: ${args[0]}`);
        const attributes = args[2] === 'bold' ? { bold: true } : undefined;
        command = {
          type: 'INSERT_TEXT',
          position,
          text: args[1],
          ...(attributes && { attributes }),
          lineNumber,
        };
        break;
      }

      case 'REPLACE_TEXT': {
        if (args.length < 2) throw new Error('引数が不足しています（検索、置換が必要）');
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
        if (args.length < 1) throw new Error('引数が不足しています（範囲が必要）');
        const range = parseRange(args[0]);
        if (!range) throw new Error(`範囲指定が不正です: ${args[0]}`);
        command = {
          type: 'DELETE_TEXT',
          range,
          lineNumber,
        };
        break;
      }

      case 'INSERT_PARAGRAPH': {
        if (args.length < 2) throw new Error('引数が不足しています（位置、テキストが必要）');
        const position = parseInt(args[0], 10);
        if (isNaN(position)) throw new Error(`段落位置が不正です: ${args[0]}`);
        
        const options: any = {};
        for (let i = 2; i < args.length; i++) {
          const option = args[i];
          if (option === 'heading') options.type = 'heading';
          else if (option === 'paragraph') options.type = 'paragraph';
          else if (option.match(/^level:([123])$/)) options.level = parseInt(option.split(':')[1], 10) as 1 | 2 | 3;
          else if (option === 'center') options.align = 'center';
          else if (option === 'right') options.align = 'right';
          else if (option === 'left') options.align = 'left';
          else if (option.match(/^indent:(\d+)$/)) options.indent = parseInt(option.split(':')[1], 10);
        }
        
        command = {
          type: 'INSERT_PARAGRAPH',
          position,
          text: args[1],
          ...(Object.keys(options).length > 0 && { options }),
          lineNumber,
        };
        break;
      }

      case 'DELETE_PARAGRAPH': {
        if (args.length < 1) throw new Error('引数が不足しています（段落番号が必要）');
        const paragraph = parseInt(args[0], 10);
        if (isNaN(paragraph)) throw new Error(`段落番号が不正です: ${args[0]}`);
        command = {
          type: 'DELETE_PARAGRAPH',
          paragraph,
          lineNumber,
        };
        break;
      }

      case 'MOVE_PARAGRAPH': {
        if (args.length < 2) throw new Error('引数が不足しています（移動元、移動先が必要）');
        const from = parseInt(args[0], 10);
        const to = parseInt(args[1], 10);
        if (isNaN(from) || isNaN(to)) throw new Error(`段落番号が不正です: ${args[0]}, ${args[1]}`);
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
