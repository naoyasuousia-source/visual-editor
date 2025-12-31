/**
 * コマンド検証ユーティリティ
 * コマンドのバリデーション純粋関数
 */

import type {
  Command,
  CommandType,
  Position,
  Range,
} from '@/types/ai-sync.types';

/**
 * 許可されたコマンドタイプのホワイトリスト
 */
const ALLOWED_COMMANDS: CommandType[] = [
  'INSERT_TEXT',
  'REPLACE_TEXT',
  'DELETE_TEXT',
  'INSERT_PARAGRAPH',
  'DELETE_PARAGRAPH',
  'MOVE_PARAGRAPH',
];

/**
 * コマンドタイプが許可されているかチェック
 * @param type - コマンドタイプ
 * @returns 許可されていればtrue
 */
export function isAllowedCommand(type: string): type is CommandType {
  return ALLOWED_COMMANDS.includes(type as CommandType);
}

/**
 * 位置情報の妥当性をチェック
 * @param position - 位置情報
 * @returns 妥当であればtrue
 */
export function isValidPosition(position: Position): boolean {
  return (
    Number.isInteger(position.paragraph) &&
    position.paragraph >= 1 &&
    Number.isInteger(position.offset) &&
    position.offset >= 0
  );
}

/**
 * 範囲情報の妥当性をチェック
 * @param range - 範囲情報
 * @returns 妥当であればtrue
 */
export function isValidRange(range: Range): boolean {
  if (!isValidPosition(range.start) || !isValidPosition(range.end)) {
    return false;
  }

  // 同じ段落内の範囲のみ許可
  if (range.start.paragraph !== range.end.paragraph) {
    return false;
  }

  // 開始位置が終了位置より前であること
  return range.start.offset <= range.end.offset;
}

/**
 * コマンドの妥当性をチェック
 * @param command - コマンド
 * @returns 妥当であればtrue、エラーメッセージを含むオブジェクト
 */
export function validateCommand(
  command: Command
): { valid: boolean; error?: string } {
  // コマンドタイプの確認
  if (!isAllowedCommand(command.type)) {
    return {
      valid: false,
      error: `許可されていないコマンド: ${command.type}`,
    };
  }

  // 各コマンド固有のバリデーション
  switch (command.type) {
    case 'INSERT_TEXT': {
      if (!isValidPosition(command.position)) {
        return { valid: false, error: '無効な挿入位置' };
      }
      if (typeof command.text !== 'string' || command.text.length === 0) {
        return { valid: false, error: '挿入テキストが空です' };
      }
      // attributes.bold のバリデーション
      if (command.attributes?.bold !== undefined && typeof command.attributes.bold !== 'boolean') {
        return { valid: false, error: 'bold属性はboolean型である必要があります' };
      }
      break;
    }

    case 'REPLACE_TEXT': {
      if (typeof command.search !== 'string' || command.search.length === 0) {
        return { valid: false, error: '検索文字列が空です' };
      }
      if (typeof command.replace !== 'string') {
        return { valid: false, error: '置換文字列が不正です' };
      }
      if (command.options?.regex) {
        try {
          new RegExp(command.search);
        } catch {
          return { valid: false, error: '検索文字列が不正な正規表現です' };
        }
      }
      break;
    }

    case 'DELETE_TEXT': {
      if (!isValidRange(command.range)) {
        return { valid: false, error: '無効な削除範囲' };
      }
      break;
    }



    case 'INSERT_PARAGRAPH': {
      if (!Number.isInteger(command.position) || command.position < 1) {
        return { valid: false, error: '無効な段落挿入位置' };
      }
      if (typeof command.text !== 'string') {
        return { valid: false, error: '段落テキストが不正です' };
      }
      // オプションのバリデーション
      if (command.options) {
        const { type, level, align, indent } = command.options;
        if (type && !['paragraph', 'heading'].includes(type)) {
          return { valid: false, error: '無効なブロックタイプ' };
        }
        if (level !== undefined) {
          if (![1, 2, 3].includes(level)) {
            return { valid: false, error: '見出しレベルは1-3である必要があります' };
          }
          // typeが明示的に'paragraph'の場合のみエラー（headingまたはundefinedはOK）
          if (type === 'paragraph') {
            return { valid: false, error: 'levelはtype=headingの場合のみ指定可能です' };
          }
        }
        if (align && !['left', 'center', 'right'].includes(align)) {
          return { valid: false, error: '無効な配置指定' };
        }
        if (indent !== undefined && (!Number.isInteger(indent) || indent < 0)) {
          return { valid: false, error: 'インデントは0以上の整数である必要があります' };
        }
      }
      break;
    }

    case 'DELETE_PARAGRAPH': {
      if (!Number.isInteger(command.paragraph) || command.paragraph < 1) {
        return { valid: false, error: '無効な段落番号' };
      }
      break;
    }

    case 'MOVE_PARAGRAPH': {
      if (!Number.isInteger(command.from) || command.from < 1) {
        return { valid: false, error: '無効な移動元段落番号' };
      }
      if (!Number.isInteger(command.to) || command.to < 1) {
        return { valid: false, error: '無効な移動先段落番号' };
      }
      if (command.from === command.to) {
        return { valid: false, error: '移動元と移動先が同じです' };
      }
      break;
    }
  }

  return { valid: true };
}


