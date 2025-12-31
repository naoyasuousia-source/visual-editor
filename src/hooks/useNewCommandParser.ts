/**
 * 新コマンドパーサーフック
 * コマンドエリアのテキストを新コマンドとしてパース
 */

import { useState, useCallback } from 'react';
import type { ParseResult, Command, ParseError } from '@/types/command';
import { parseNewCommands } from '@/utils/newCommandParser';

/**
 * 新コマンドパーサーフック
 * 
 * @returns パース関数とパース結果
 */
export function useNewCommandParser() {
  const [lastParseResult, setLastParseResult] = useState<ParseResult | null>(null);

  /**
   * コマンド文字列の配列をパース
   */
  const parseCommands = useCallback((commandStrings: string[]): ParseResult => {
    // 空行やコメント行を除外
    const validCommandStrings = commandStrings
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('//') && !s.startsWith('#'));

    const result = parseNewCommands(validCommandStrings);
    setLastParseResult(result);

    // パースエラーがあればコンソールに出力
    if (result.errors.length > 0) {
      console.group('コマンドパースエラー');
      result.errors.forEach(error => {
        console.error(
          `行 ${error.lineNumber || '?'}: ${error.message}`,
          error.rawCommand ? `\n原文: ${error.rawCommand}` : ''
        );
      });
      console.groupEnd();
    }

    return result;
  }, []);

  /**
   * 単一のコマンド文字列をパース
   */
  const parseSingleCommand = useCallback((commandString: string): ParseResult => {
    return parseCommands([commandString]);
  }, [parseCommands]);

  /**
   * コマンドテキスト（複数行）をパース
   */
  const parseCommandText = useCallback((text: string): ParseResult => {
    const lines = text.split('\n');
    return parseCommands(lines);
  }, [parseCommands]);

  /**
   * コマンドが含まれているかチェック
   */
  const hasCommands = useCallback((text: string): boolean => {
    const trimmed = text.trim();
    // 空文字列はコマンドなしと判定
    if (!trimmed) return false;
    
    // コマンドタイプのパターンにマッチするかチェック
    const commandPattern = /(REPLACE_PARAGRAPH|INSERT_PARAGRAPH|DELETE_PARAGRAPH|MOVE_PARAGRAPH|SPLIT_PARAGRAPH|MERGE_PARAGRAPH)\s*\(/;
    return commandPattern.test(trimmed);
  }, []);

  return {
    parseCommands,
    parseSingleCommand,
    parseCommandText,
    hasCommands,
    lastParseResult,
  };
}
