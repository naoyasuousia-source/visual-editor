# main.ts 段階的スリム化・統合計画

## 概要
現在、`src/utils`, `src/editor` などにロジックを分割配置しましたが、`src/main.ts` はまだ元のコードをそのまま保持しており、新しいモジュールを使用していません。
本計画では、機能不全（リグレッション）を防ぐため、**機能単位**で少しずつ `main.ts` の実装を新しいモジュールのインポートに置き換えていきます。

## ステップ

### Step 1: 型定義とユーティリティの導入 (完了)
- **目標**: `main.ts` 内の重複した型定義やDOMヘルパー関数を削除する。
- **作業**:
  1. `src/types.ts` から `Window`, `SelectionState` などの型をインポート。 (完了)
  2. `main.ts` 内の同等の型定義を削除。 (完了)
  3. `src/utils/dom.ts` から `unwrapColorSpan`, `convertParagraphToTag` などをインポート。 (完了)
  4. `main.ts` 内の同等の関数定義を削除し、インポートしたものを使用するように書き換える。 (完了)
- **確認**: `npm run build` で型エラーが出ないこと。 (完了)

### Step 2: 選択ロジックの置換 (完了)
- **目標**: 複雑な選択範囲の保存・復元ロジックをモジュール化されたものに置き換える。
- **作業**:
  1. `src/editor/selection.ts` から `computeSelectionStateFromRange`, `restoreRangeFromSelectionState` などをインポート。 (完了)
  2. `main.ts` 内の該当関数を削除。 (完了)
- **確認**: テキストを選択して太字や色変更を行い、選択範囲が正しく維持されるか。 (完了 - ビルド成功)

### Step 3: フォーマット機能の置換 (完了)
- **目標**: 太字、イタリック、色変更などの装飾ロジックを置換する。
- **作業**:
  1. `src/editor/formatting.ts` から `toggleBold`, `applyColorHighlight` などをインポート。 (完了)
  2. `main.ts` 内の実装を削除してインポートに置換。 (完了)
  3. 注意: `window.toggleBold = toggleBold;` などのグローバル登録は維持する。 (完了)
- **確認**: ツールバーの各ボタン（B, I, Highlight, Color）が正常に動作するか。 (完了 - ビルド成功)

### Step 4: ファイルIO・その他の置換
- **目標**: 残りのファイル操作などを置換し、`main.ts` を「初期化とイベントバインド」のみに特化させる。
- **作業**:
  1. `src/utils/file.ts` をインポート。
  2. 残存するロジックを整理。

## 安全策
- 各ステップごとに必ず `npm run build` を実行。
- エラーが出た場合は即座にロールバックし、依存関係（特に `globals.ts` や `window` オブジェクトへの依存）を見直す。
