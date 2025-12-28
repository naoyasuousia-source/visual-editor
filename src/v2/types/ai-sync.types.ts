/**
 * AI同期編集機能の型定義
 */

/**
 * コマンドタイプ
 */
export type CommandType =
  | 'INSERT_TEXT'
  | 'REPLACE_TEXT'
  | 'DELETE_TEXT'
  | 'FORMAT_TEXT'
  | 'INSERT_PARAGRAPH'
  | 'DELETE_PARAGRAPH'
  | 'MOVE_PARAGRAPH';

/**
 * 位置指定
 */
export interface Position {
  /** 段落番号（1始まり） */
  paragraph: number;
  /** 文字位置（0始まり） */
  offset: number;
}

/**
 * 範囲指定
 */
export interface Range {
  /** 開始位置 */
  start: Position;
  /** 終了位置 */
  end: Position;
}

/**
 * コマンドベース
 */
interface BaseCommand {
  /** コマンドタイプ */
  type: CommandType;
  /** コマンドが記述された行番号（デバッグ用） */
  lineNumber?: number;
}

/**
 * テキスト挿入コマンド
 */
export interface InsertTextCommand extends BaseCommand {
  type: 'INSERT_TEXT';
  /** 挿入位置 */
  position: Position;
  /** 挿入するテキスト */
  text: string;
}

/**
 * テキスト置換コマンド
 */
export interface ReplaceTextCommand extends BaseCommand {
  type: 'REPLACE_TEXT';
  /** 検索文字列 */
  search: string;
  /** 置換文字列 */
  replace: string;
  /** オプション */
  options?: {
    /** すべて置換 */
    all?: boolean;
    /** 正規表現を使用 */
    regex?: boolean;
    /** 大文字小文字を区別 */
    caseSensitive?: boolean;
  };
}

/**
 * テキスト削除コマンド
 */
export interface DeleteTextCommand extends BaseCommand {
  type: 'DELETE_TEXT';
  /** 削除範囲 */
  range: Range;
}

/**
 * 書式変更コマンド
 */
export interface FormatTextCommand extends BaseCommand {
  type: 'FORMAT_TEXT';
  /** 対象範囲 */
  range: Range;
  /** 書式タイプ */
  format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code';
}

/**
 * 段落挿入コマンド
 */
export interface InsertParagraphCommand extends BaseCommand {
  type: 'INSERT_PARAGRAPH';
  /** 挿入位置（段落番号） */
  position: number;
  /** 段落テキスト */
  text: string;
}

/**
 * 段落削除コマンド
 */
export interface DeleteParagraphCommand extends BaseCommand {
  type: 'DELETE_PARAGRAPH';
  /** 削除する段落番号 */
  paragraph: number;
}

/**
 * 段落移動コマンド
 */
export interface MoveParagraphCommand extends BaseCommand {
  type: 'MOVE_PARAGRAPH';
  /** 移動元の段落番号 */
  from: number;
  /** 移動先の段落番号 */
  to: number;
}

/**
 * コマンド型の統合
 */
export type Command =
  | InsertTextCommand
  | ReplaceTextCommand
  | DeleteTextCommand
  | FormatTextCommand
  | InsertParagraphCommand
  | DeleteParagraphCommand
  | MoveParagraphCommand;

/**
 * コマンド実行結果
 */
export interface ExecutionResult {
  /** 成功したか */
  success: boolean;
  /** エラーメッセージ（失敗時） */
  error?: string;
  /** 変更された範囲 */
  changedRanges?: Range[];
  /** 実行時刻 */
  timestamp: number;
}

/**
 * コマンドパース結果
 */
export interface ParseResult {
  /** パースされたコマンド */
  commands: Command[];
  /** パースエラー */
  errors: ParseError[];
}

/**
 * パースエラー
 */
export interface ParseError {
  /** エラーメッセージ */
  message: string;
  /** エラーが発生した行番号 */
  lineNumber?: number;
  /** エラーの原因となったコマンド文字列 */
  rawCommand?: string;
}

/**
 * ファイル変更イベント
 */
export interface FileChangeEvent {
  /** 変更されたファイルのハンドル */
  fileHandle: FileSystemFileHandle;
  /** 変更時刻 */
  timestamp: number;
  /** ファイル内容 */
  content: string;
}

/**
 * AI同期の状態
 */
export interface AiSyncState {
  /** 同期が有効か */
  isEnabled: boolean;
  /** ファイル監視中か */
  isWatching: boolean;
  /** エディタがロックされているか */
  isLocked: boolean;
  /** 最終同期時刻 */
  lastSyncTime: number | null;
  /** 現在のファイルハンドル */
  fileHandle: FileSystemFileHandle | null;
}

/**
 * 変更ハイライト情報
 */
export interface HighlightInfo {
  /** ハイライトID */
  id: string;
  /** 変更範囲 */
  range: Range;
  /** 実行されたコマンド */
  command: Command;
  /** ハイライト作成時刻 */
  timestamp: number;
}
