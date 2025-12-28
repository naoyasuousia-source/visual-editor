/**
 * コマンドパーサーフック
 * HTMLコメントからコマンドを抽出・解析する
 */

import { useCallback } from 'react';
import { extractCommandArea, extractCommands } from '@/v2/utils/htmlCommentParser';
import { parseCommands } from '@/v2/utils/commandParser';
import type { ParseResult } from '@/v2/types/ai-sync.types';

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
      return {
        commands: [],
        errors: [],
      };
    }

    // コマンド行を抽出
    const commandStrings = extractCommands(commandArea);

    if (commandStrings.length === 0) {
      return {
        commands: [],
        errors: [],
      };
    }

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
