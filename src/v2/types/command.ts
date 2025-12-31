/**
 * 新コマンドシステムの型定義
 * 段落IDベースのコマンド処理とハイライト/承認破棄システム
 */

/**
 * 段落ID形式
 * - Paginatedモード: p{ページ番号}-{段落番号} (例: p1-1, p2-3)
 * - Wordモード: p{通し番号} (例: p1, p2, p45)
 * - 仮ID (AI発行/自動生成): temp-{uuid}
 */
export type ParagraphId = string;

/**
 * コマンドタイプ
 * 以下の6種類に限定
 */
export type CommandType =
  | 'REPLACE_PARAGRAPH'
  | 'INSERT_PARAGRAPH'
  | 'DELETE_PARAGRAPH'
  | 'MOVE_PARAGRAPH'
  | 'SPLIT_PARAGRAPH'
  | 'MERGE_PARAGRAPH';

/**
 * ブロック要素タイプ
 */
export type BlockType = 'p' | 'h1' | 'h2' | 'h3';

/**
 * 文字揃え
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * 段落下余白
 */
export type ParagraphSpacing = 'none' | 'small' | 'medium' | 'large';

/**
 * インデントレベル（0～4）
 * 0: なし, 1: 36pt, 2: 72pt, 3: 108pt, 4: 144pt
 */
export type IndentLevel = 0 | 1 | 2 | 3 | 4;

/**
 * 段落オプション
 * 太字タグ(<b>)、改行(<br>)などはテキスト内に直接記述する
 */
export interface ParagraphOptions {
  /** ブロックタイプ (p, h1, h2, h3) */
  blockType?: BlockType;
  /** 文字揃え (left, center, right) */
  textAlign?: TextAlign;
  /** 段落下余白 (none, small, medium, large) */
  spacing?: ParagraphSpacing;
  /** インデントレベル (0-4) */
  indent?: IndentLevel;
}

/**
 * コマンドベース
 */
interface BaseCommand {
  /** コマンド種別 */
  type: CommandType;
  /** コマンドの一意識別子（ハイライトや承認管理用） */
  commandId: string;
  /** 元の行番号 */
  lineNumber?: number;
}

/**
 * REPLACE_PARAGRAPH コマンド
 * 指定した段落の内容を新しいテキスト（HTMLタグ含む）で置き換える
 */
export interface ReplaceParagraphCommand extends BaseCommand {
  type: 'REPLACE_PARAGRAPH';
  /** 置換対象の段落ID */
  targetId: ParagraphId;
  /** 新しいテキスト（<b>, <br>, <sup>, <sub> を含めることが可能） */
  text: string;
  /** 適用するスタイルオプション */
  options?: ParagraphOptions;
}

/**
 * INSERT_PARAGRAPH コマンド
 * 指定した段落の直後に新しい段落を挿入する
 */
export interface InsertParagraphCommand extends BaseCommand {
  type: 'INSERT_PARAGRAPH';
  /** 挿入の基準となる段落ID */
  targetId: ParagraphId;
  /** 挿入するテキスト（HTMLタグ含む） */
  text: string;
  /** 適用するスタイルオプション */
  options?: ParagraphOptions;
  /** AI側で発行された仮ID（連続挿入を可能にするため） */
  tempId: ParagraphId;
}

/**
 * DELETE_PARAGRAPH コマンド
 * 指定した段落を削除対象とする
 */
export interface DeleteParagraphCommand extends BaseCommand {
  type: 'DELETE_PARAGRAPH';
  /** 削除対象の段落ID */
  targetId: ParagraphId;
}

/**
 * MOVE_PARAGRAPH コマンド
 * 段落の順序を入れ替える
 */
export interface MoveParagraphCommand extends BaseCommand {
  type: 'MOVE_PARAGRAPH';
  /** 移動させる段落のID */
  sourceId: ParagraphId;
  /** 移動先の基準段落ID（この直後に移動） */
  targetId: ParagraphId;
}

/**
 * SPLIT_PARAGRAPH コマンド
 * 1つの段落を特定の文字列位置で2つに分割する
 */
export interface SplitParagraphCommand extends BaseCommand {
  type: 'SPLIT_PARAGRAPH';
  /** 分割対象の段落ID */
  targetId: ParagraphId;
  /** 前半部分の末尾文字列 */
  beforeText: string;
  /** 後半部分の開始文字列 */
  afterText: string;
  /** 分割後に生成される新しい段落の仮ID */
  tempId: ParagraphId;
}

/**
 * MERGE_PARAGRAPH コマンド
 * 指定した段落の内容を別の段落の末尾に結合する
 */
export interface MergeParagraphCommand extends BaseCommand {
  type: 'MERGE_PARAGRAPH';
  /** 結合させる側の段落ID（処理後削除） */
  sourceId: ParagraphId;
  /** 結合される側の段落ID */
  targetId: ParagraphId;
}

/**
 * 利用可能な全コマンドのユニオン型
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
 * 破棄（元に戻す）操作のために、変更前の状態を保持する
 */
export interface ParagraphSnapshot {
  /** 段落ID */
  paragraphId: ParagraphId;
  /** プレーンテキスト内容 */
  text: string;
  /** HTMLタグを含む完全な内容 */
  html: string;
  /** 適用されていたオプション */
  options: ParagraphOptions;
  /** 取得時タイムスタンプ */
  timestamp: number;
}

/**
 * コマンド一括実行の結果
 */
export interface CommandExecutionResult {
  /** 成功可否 */
  success: boolean;
  /** 対応するコマンドID */
  commandId: string;
  /** コマンド種別 */
  commandType: CommandType;
  /** 影響を受けた（ハイライト対象となる）段落IDの配列 */
  affectedParagraphIds: ParagraphId[];
  /** エラーメッセージ（失敗時） */
  error?: string;
  /** 復元用の実行前スナップショット */
  beforeSnapshot?: ParagraphSnapshot[];
  /** 完了時刻 */
  timestamp: number;
}

/**
 * エディタ上のハイライト・承認待ち状態
 */
export interface HighlightState {
  /** コマンドID */
  commandId: string;
  /** コマンド種別 */
  commandType: CommandType;
  /** ハイライトを維持する段落IDリスト */
  paragraphIds: ParagraphId[];
  /** 破棄操作時に復元するためのデータ群 */
  beforeSnapshot: ParagraphSnapshot[];
  /** 実行されたコマンド情報 */
  command: Command;
  /** 承認フラグ */
  approved: boolean;
  /** 破棄フラグ */
  rejected: boolean;
  /** 作成時刻 */
  timestamp: number;
}

/**
 * パース結果の全体像
 */
export interface ParseResult {
  /** 正常に解釈されたコマンド群 */
  commands: Command[];
  /** 解釈に失敗したエラー群 */
  errors: ParseError[];
}

/**
 * 構文エラー情報
 */
export interface ParseError {
  /** エラーメッセージ（日本語） */
  message: string;
  /** ファイル内での行番号 */
  lineNumber?: number;
  /** エラーとなった元の文字列 */
  rawCommand?: string;
}

/**
 * 承認・破棄アクションの種別
 */
export type ApprovalAction = 'approve' | 'reject';

/**
 * 承認・破棄の結果
 */
export interface ApprovalResult {
  /** 処理の完遂可否 */
  success: boolean;
  /** 対象となったコマンドID */
  commandId: string;
  /** 実行されたアクション */
  action: ApprovalAction;
  /** エラーメッセージ（失敗時） */
  error?: string;
  /** 処理完了時刻 */
  timestamp: number;
}
