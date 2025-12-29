/**
 * コマンドパーサーフック
 * HTMLコメントからコマンドを抽出・解析する
 */

import { useCallback } from 'react';
import { extractCommandArea, extractCommands } from '@/utils/htmlCommentParser';
import { parseCommands } from '@/utils/commandParser';
import type { ParseResult } from '@/types/ai-sync.types';

interface UseCommandParserReturn {
  /** HTMLコンテンツからコマンドを解析 */
  parseFromHtml: (htmlContent: string) => ParseResult;
  /** コマンドエリアの存在チェック */
  hasCommands: (htmlContent: string) => boolean;
}

/**
 * コマンドパーサーフック
 */
export function useCommandParser(): UseCommandParserReturn {
  /**
   * HTMLコンテンツからコマンドを解析
   */
  const parseFromHtml = useCallback((htmlContent: string): ParseResult => {
    // コマンドエリアを抽出
    const commandArea = extractCommandArea(htmlContent);

    if (!commandArea) {
      console.log('[CommandParser] コマンドエリアが見つかりませんでした');
      return {
        commands: [],
        errors: [],
      };
    }

    console.log('[CommandParser] コマンドエリア抽出成功:', commandArea.substring(0, 200));

    // コマンド行を抽出
    const commandStrings = extractCommands(commandArea);

    if (commandStrings.length === 0) {
      console.log('[CommandParser] コマンド行が見つかりませんでした');
      return {
        commands: [],
        errors: [],
      };
    }

    console.log('[CommandParser] 抽出されたコマンド文字列:', commandStrings);

    // コマンドをパース
    return parseCommands(commandStrings);
  }, []);

  /**
   * コマンドエリアにコマンドが存在するかチェック
   */
  const hasCommands = useCallback((htmlContent: string): boolean => {
    const commandArea = extractCommandArea(htmlContent);
    if (!commandArea) {
      return false;
    }

    const commandStrings = extractCommands(commandArea);
    return commandStrings.length > 0;
  }, []);

  return {
    parseFromHtml,
    hasCommands,
  };
}
