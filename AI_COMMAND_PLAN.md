# AI自動編集コマンド拡張計画書

## 1. 目的
現在、AI自動編集機能（Auto-Edit）では、テキストの挿入 (`INSERT_TEXT`) と置換 (`REPLACE_TEXT`) のみが実装されています。
より高度で人間らしい編集操作（段落の削除、装飾、スタイルの変更など）をAIが実行できるように、コマンドセットを拡張します。

---

## 📋 実装状況サマリー

**ステータス**: ✅ **全て完了** (2025-12-30)

### 実装完了項目
1. **INSERT_TEXT拡張**: 太字属性 (`bold`) のサポート追加
2. **INSERT_PARAGRAPH拡張**: ブロックタイプ、見出しレベル、配置、インデント指定のサポート追加
3. **DELETE_TEXT実装**: 指定範囲のテキスト削除機能を実装
4. **DELETE_PARAGRAPH実装**: 段落単位での削除機能を実装
5. **MOVE_PARAGRAPH実装**: 段落の位置移動機能を実装
6. **FORMAT_TEXT削除**: ユーザー要望により既存テキストへの装飾機能を削除

### 変更ファイル一覧
- `src/v2/types/ai-sync.types.ts`: 型定義の更新
- `src/v2/utils/commandParser.ts`: パーサー拡張
- `src/v2/utils/commandValidator.ts`: バリデーション追加
- `src/v2/services/commandExecutionService.ts`: 実装ロジック追加
- `src/v2/services/moveParagraphService.ts`: MOVE_PARAGRAPH専用サービス新規作成
- `src/v2/hooks/useCommandExecutor.ts`: フック統合

---

## 2. 現在のステータス
- **実装済み**:
    - `INSERT_TEXT`: テキスト挿入（**太字指定サポート済み** ✅）
    - `REPLACE_TEXT`: テキスト置換（正規表現対応）
    - `INSERT_PARAGRAPH`: 段落挿入（**ブロック要素指定、配置、インデント対応済み** ✅）
    - `DELETE_TEXT`: テキスト削除 ✅
    - `DELETE_PARAGRAPH`: 段落削除 ✅
    - `MOVE_PARAGRAPH`: 段落移動 ✅

## 3. 実装ロードマップ & 進捗記録

### フェーズ 1: コマンド仕様の改修と実装
ユーザーフィードバックに基づき、既存コマンドの仕様を拡張し、不要なコマンドを削除します。

- [x] **INSERT_TEXT (仕様変更)** ✅ 完了
    - [x] Update `ai-sync.types.ts`: `attributes: { bold?: boolean }` を追加
    - [x] Logic Update (`commandExecutionService.ts`): 太字での挿入に対応
    - [x] Validator Update (`commandValidator.ts`)
    - [x] Parser Update (`commandParser.ts`)

- [x] **INSERT_PARAGRAPH (仕様変更)** ✅ 完了
    - [x] Update `ai-sync.types.ts`: `options` (type, align, indent) を追加
    - [x] Logic Update (`commandExecutionService.ts`): 指定されたスタイルでの段落挿入に対応
    - [x] Validator Update (`commandValidator.ts`)
    - [x] Parser Update (`commandParser.ts`)

- [x] **DELETE_TEXT** ✅ 完了
    - [x] Logic Implementation (`commandExecutionService.ts`)
    - [x] Validator Check (`commandValidator.ts`)

- [x] **DELETE_PARAGRAPH** ✅ 完了
    - [x] Logic Implementation (`commandExecutionService.ts`)
    - [x] Validator Check (`commandValidator.ts`)

- [x] **MOVE_PARAGRAPH** ✅ 完了
    - [x] Logic Implementation (`moveParagraphService.ts`)
    - [x] Export from `commandExecutionService.ts`
    - [x] Hook Integration (`useCommandExecutor.ts`)

- [x] **FORMAT_TEXT 削除** ✅ 完了
    - [x] Remove from `ai-sync.types.ts`
    - [x] Remove from `commandParser.ts`
    - [x] Remove from `commandValidator.ts`
    - [x] Remove from `commandExecutionService.ts`
    - [x] Remove from `useCommandExecutor.ts`


## 4. コマンド仕様詳細 (改定版)

### INSERT_TEXT (Enhanced)
```typescript
interface InsertTextCommand extends BaseCommand {
  type: 'INSERT_TEXT';
  position: Position;
  text: string;
  attributes?: {
    bold?: boolean; // 新追加: 挿入テキストを太字にする
  };
}
```

### INSERT_PARAGRAPH (Enhanced)
```typescript
interface InsertParagraphCommand extends BaseCommand {
  type: 'INSERT_PARAGRAPH';
  position: number;
  text: string;
  options?: { // 新追加
    type?: 'paragraph' | 'heading'; // ブロック要素タイプ
    level?: 1 | 2 | 3; // 見出しレベル (type='heading'時)
    align?: 'left' | 'center' | 'right'; // 配置
    indent?: number; // インデントレベル (0-n)
  };
}
```

## 5. 開発時の注意点
- **Undo/Redo**: Tiptapのトランザクションを使用し、ユーザーがUndo可能な状態を保つこと。
- **ハイライト**: 編集箇所はユーザーの承認待ちとしてハイライト表示（黄色）される必要がある。`ExecutionResult` の `changedRanges` を正しく返すこと。
- **バリデーション**: AIが生成するコマンドは誤りを含む可能性があるため、`commandValidator.ts` で厳密に検証すること。
