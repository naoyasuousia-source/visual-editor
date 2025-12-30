/**
 * 新コマンドシステムの型定義
 * 段落IDベースのコマンド処理とハイライト/承認破棄システム
 */

/**
 * 段落ID形式
 * 正式ID: p{ページ番号}-{段落番号} (例: p2-1)
 * 仮ID: temp-{uuid}
 */
export type ParagraphId = string;

/**
 * コマンドタイプ（6種類の段落操作コマンド）
 */
export type CommandType =
  | 'REPLACE_PARAGRAPH'
  | 'INSERT_PARAGRAPH'
  | 'DELETE_PARAGRAPH'
  | 'MOVE_PARAGRAPH'
  | 'SPLIT_PARAGRAPH'
  | 'MERGE_PARAGRAPH';

/**
 * ブロック要素タイプ（4択）
 */
export type BlockType = 'p' | 'h1' | 'h2' | 'h3';

/**
 * 文字揃え（3択）
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * 段落下余白（4択）
 */
export type ParagraphSpacing = 'none' | 'small' | 'medium' | 'large';

/**
 * インデントレベル（0～4）
 */
export type IndentLevel = 0 | 1 | 2 | 3 | 4;

/**
 * 段落オプション
 * HTMLタグ（太字、改行、上付き下付き）はテキスト内に直書き
 * それ以外は引数として指定
 */
export interface ParagraphOptions {
  /** ブロック要素タイプ */
  blockType?: BlockType;
  /** 文字揃え */
  textAlign?: TextAlign;
  /** 段落下余白 */
  spacing?: ParagraphSpacing;
  /** インデントレベル */
  indent?: IndentLevel;
}

/**
 * コマンドベース
 */
interface BaseCommand {
  /** コマンドタイプ */
  type: CommandType;
  /** コマンドID（ハイライト管理用） */
  commandId: string;
  /** コマンドが記述された行番号（デバッグ用） */
  lineNumber?: number;
}

/**
 * REPLACE_PARAGRAPH コマンド
 * 既存段落の内容を新テキストで置換
 */
export interface ReplaceParagraphCommand extends BaseCommand {
  type: 'REPLACE_PARAGRAPH';
  /** ターゲット段落ID */
  targetId: ParagraphId;
  /** 新しいテキスト（HTMLタグ含む） */
  text: string;
  /** 段落オプション */
  options?: ParagraphOptions;
}

/**
 * INSERT_PARAGRAPH コマンド
 * 指定段落の直後に新段落を挿入
 */
export interface InsertParagraphCommand extends BaseCommand {
  type: 'INSERT_PARAGRAPH';
  /** ターゲット段落ID（この直後に挿入） */
  targetId: ParagraphId;
  /** 挿入するテキスト（HTMLタグ含む） */
  text: string;
  /** 段落オプション */
  options?: ParagraphOptions;
  /** 仮ID（AI側で発行） */
  tempId?: ParagraphId;
}

/**
 * DELETE_PARAGRAPH コマンド
 * 指定段落を削除
 */
export interface DeleteParagraphCommand extends BaseCommand {
  type: 'DELETE_PARAGRAPH';
  /** 削除する段落ID */
  targetId: ParagraphId;
}

/**
 * MOVE_PARAGRAPH コマンド
 * 段落を移動
 */
export interface MoveParagraphCommand extends BaseCommand {
  type: 'MOVE_PARAGRAPH';
  /** 移動元段落ID */
  sourceId: ParagraphId;
  /** 移動先段落ID（この直後に移動） */
  targetId: ParagraphId;
}

/**
 * SPLIT_PARAGRAPH コマンド
 * 段落を分割
 */
export interface SplitParagraphCommand extends BaseCommand {
  type: 'SPLIT_PARAGRAPH';
  /** 分割する段落ID */
  targetId: ParagraphId;
  /** 分割位置直前の文字列 */
  beforeText: string;
  /** 分割位置直後の文字列 */
  afterText: string;
  /** 新段落用の仮ID */
  tempId?: ParagraphId;
}

/**
 * MERGE_PARAGRAPH コマンド
 * 段落を結合
 */
export interface MergeParagraphCommand extends BaseCommand {
  type: 'MERGE_PARAGRAPH';
  /** 結合元段落ID */
  sourceId: ParagraphId;
  /** 結合先段落ID（この直後に結合） */
  targetId: ParagraphId;
}

/**
 * コマンド型の統合
 */
export type Command =
  | ReplaceParagraphCommand
  | InsertParagraphCommand
  | DeleteParagraphCommand
  | MoveParagraphCommand
  | SplitParagraphCommand
  | MergeParagraphCommand;

/**
 * 段落スナップショット
 * 承認/破棄時の復元用
 */
export interface ParagraphSnapshot {
  /** 段落ID */
  paragraphId: ParagraphId;
  /** テキスト内容 */
  text: string;
  /** HTMLコンテンツ */
  html: string;
  /** オプション */
  options: ParagraphOptions;
  /** スナップショット作成時刻 */
  timestamp: number;
}

/**
 * コマンド実行結果
 */
export interface CommandExecutionResult {
  /** 成功したか */
  success: boolean;
  /** コマンドID */
  commandId: string;
  /** コマンドタイプ */
  commandType: CommandType;
  /** 影響を受けた段落ID */
  affectedParagraphIds: ParagraphId[];
  /** エラーメッセージ（失敗時） */
  error?: string;
  /** 実行前スナップショット */
  beforeSnapshot?: ParagraphSnapshot[];
  /** 実行時刻 */
  timestamp: number;
}

/**
 * ハイライト状態
 */
export interface HighlightState {
  /** コマンドID */
  commandId: string;
  /** コマンドタイプ */
  commandType: CommandType;
  /** ハイライト対象段落ID */
  paragraphIds: ParagraphId[];
  /** 実行前スナップショット */
  beforeSnapshot: ParagraphSnapshot[];
  /** コマンドオブジェクト */
  command: Command;
  /** 承認済みか */
  approved: boolean;
  /** 破棄済みか */
  rejected: boolean;
  /** ハイライト作成時刻 */
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
 * 承認/破棄アクション
 */
export type ApprovalAction = 'approve' | 'reject';

/**
 * 承認/破棄結果
 */
export interface ApprovalResult {
  /** 成功したか */
  success: boolean;
  /** コマンドID */
  commandId: string;
  /** アクション */
  action: ApprovalAction;
  /** エラーメッセージ（失敗時） */
  error?: string;
  /** 処理時刻 */
  timestamp: number;
}
