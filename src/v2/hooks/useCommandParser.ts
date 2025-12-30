/**
 * コマンドパーサーフック
 * HTMLコメントからコマンドを抽出・解析する
 * 新コマンドシステム（段落IDベース）と旧コマンドシステムの両方をサポート
 */

import { useCallback } from 'react';
import { extractCommandArea, extractCommands } from '@/utils/htmlCommentParser';
import { parseCommands } from '@/utils/commandParser';
import { parseNewCommands } from '@/utils/newCommandParser';
import type { ParseResult as OldParseResult } from '@/types/ai-sync.types';
import type { ParseResult as NewParseResult } from '@/types/command';

interface UseCommandParserReturn {
  /** HTMLコンテンツから旧コマンドを解析（後方互換性のため保持） */
  parseFromHtml: (htmlContent: string) => OldParseResult;
  /** HTMLコンテンツから新コマンドを解析 */
  parseNewCommandsFromHtml: (htmlContent: string) => NewParseResult;
  /** コマンドエリアの存在チェック */
  hasCommands: (htmlContent: string) => boolean;
  /** 新コマンドが含まれているかチェック */
  hasNewCommands: (htmlContent: string) => boolean;
}

/**
 * コマンドパーサーフック
 */
export function useCommandParser(): UseCommandParserReturn {
  /**
   * HTMLコンテンツから旧コマンドを解析（後方互換性のため）
   */
  const parseFromHtml = useCallback((htmlContent: string): OldParseResult => {
    const commandArea = extractCommandArea(htmlContent);

    if (!commandArea) {
      return {
        commands: [],
        errors: [],
      };
    }

    const commandStrings = extractCommands(commandArea);

    if (commandStrings.length === 0) {
      return {
        commands: [],
        errors: [],
      };
    }

    return parseCommands(commandStrings);
  }, []);

  /**
   * HTMLコンテンツから新コマンドを解析
   */
  const parseNewCommandsFromHtml = useCallback((htmlContent: string): NewParseResult => {
    const commandArea = extractCommandArea(htmlContent);

    if (!commandArea) {
      return {
        commands: [],
        errors: [],
      };
    }

    const commandStrings = extractCommands(commandArea);

    if (commandStrings.length === 0) {
      return {
        commands: [],
        errors: [],
      };
    }

    // 新コマンドパーサーを使用
    return parseNewCommands(commandStrings);
  }, []);

  /**
   * コマンドエリアにコマンドが存在するかチェック（旧・新両対応）
   */
  const hasCommands = useCallback((htmlContent: string): boolean => {
    const commandArea = extractCommandArea(htmlContent);
    if (!commandArea) {
      return false;
    }

    const commandStrings = extractCommands(commandArea);
    return commandStrings.length > 0;
  }, []);

  /**
   * 新コマンドが含まれているかチェック
   */
  const hasNewCommands = useCallback((htmlContent: string): boolean => {
    const commandArea = extractCommandArea(htmlContent);
    if (!commandArea) {
      return false;
    }

    const trimmed = commandArea.trim();
    if (!trimmed) {
      return false;
    }

    // 新コマンドのパターンにマッチするかチェック
    const newCommandPattern = /(REPLACE_PARAGRAPH|INSERT_PARAGRAPH|DELETE_PARAGRAPH|MOVE_PARAGRAPH|SPLIT_PARAGRAPH|MERGE_PARAGRAPH)\s*\(/;
    return newCommandPattern.test(trimmed);
  }, []);

  return {
    parseFromHtml,
    parseNewCommandsFromHtml,
    hasCommands,
    hasNewCommands,
  };
}

