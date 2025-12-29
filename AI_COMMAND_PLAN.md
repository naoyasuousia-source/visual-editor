# AI自動編集コマンド拡張計画書

## 1. 目的
現在、AI自動編集機能（Auto-Edit）では、テキストの挿入 (`INSERT_TEXT`) と置換 (`REPLACE_TEXT`) のみが実装されています。
より高度で人間らしい編集操作（段落の削除、装飾、スタイルの変更など）をAIが実行できるように、コマンドセットを拡張します。

## 2. 現在のステータス
- **実装済み**:
    - `INSERT_TEXT`: テキスト挿入（**太字指定追加予定**）
    - `REPLACE_TEXT`: テキスト置換（正規表現対応）
- **定義済み・実装予定**:
    - `INSERT_PARAGRAPH`: 段落挿入（**ブロック要素指定、配置、インデント追加予定**）
    - `DELETE_TEXT`: テキスト削除
    - `DELETE_PARAGRAPH`: 段落削除
    - `MOVE_PARAGRAPH`: 段落移動

## 3. 実装ロードマップ & 進捗記録

### フェーズ 1: コマンド仕様の改修と実装
ユーザーフィードバックに基づき、既存コマンドの仕様を拡張し、不要なコマンドを削除します。

- [ ] **INSERT_TEXT (仕様変更)**
    - [ ] Update `ai-sync.types.ts`: `attributes: { bold?: boolean }` を追加
    - [ ] Logic Update (`commandExecutionService.ts`): 太字での挿入に対応
    - [ ] Validator Update (`commandValidator.ts`)

- [ ] **INSERT_PARAGRAPH (仕様変更)**
    - [ ] Update `ai-sync.types.ts`: `options` (type, align, indent) を追加
    - [ ] Logic Update (`commandExecutionService.ts`): 指定されたスタイルでの段落挿入に対応
    - [ ] Validator Update (`commandValidator.ts`)

- [ ] **DELETE_TEXT**
    - [ ] Logic Implementation (`commandExecutionService.ts`)
    - [ ] Validator Check (`commandValidator.ts`)

- [ ] **DELETE_PARAGRAPH**
    - [ ] Logic Implementation (`commandExecutionService.ts`)
    - [ ] Validator Check (`commandValidator.ts`)

- [ ] **MOVE_PARAGRAPH**
    - [ ] Logic Implementation (`commandExecutionService.ts`)
    - [ ] Validator Check (`commandValidator.ts`)


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
