# ソースコード分割（リファクタリング）計画書

## 目的
巨大化した `src/main.ts` (約2800行) を機能ごとの小さなモジュールに分割し、可読性・保守性・拡張性を向上させる。

## 構成案
`src/` 配下を以下の構成に再編する。

```
src/
 ├─ types.ts                # 型定義 (Window拡張, SelectionStateなど)
 ├─ globals.ts              # グローバル変数・定数 (DOM要素への参照, 設定値など)
 ├─ utils/
 │   ├─ dom.ts              # DOM操作ヘルパー
 │   └─ file.ts             # ファイル入出力, HTML生成
 ├─ editor/
 │   ├─ core.ts             # エディタのコア動作 (イベントリスナ, キャレット, 段落管理)
 │   ├─ selection.ts        # 選択範囲の保存・復元ロジック
 │   └─ formatting.ts       # テキスト装飾 (Bold, Color, Highlightなど)
 ├─ features/
 │   ├─ image.ts            # 画像処理 (挿入, コンテキストメニュー)
 │   └─ link.ts             # リンク・ブックマーク処理
 └─ ui/
     ├─ menu.ts             # メニュー・ツールバーの開閉制御
     └─ dialog.ts           # ダイアログ制御
 └─ main.ts                 # エントリーポイント (初期化, グローバル登録)
```

## 作業手順

### Phase 1: 基盤整理
1.  **ディレクトリ作成**: `src/utils`, `src/editor`, `src/features`, `src/ui` を作成。
2.  **型定義の分離 (`src/types.ts`)**: `main.ts` から `interface Window` や `SelectionState` などを移動。
3.  **グローバル定数・変数の分離 (`src/globals.ts`)**: `pagesContainerElement` や `currentEditor` などの共有ステートを移動。循環参照を防ぐため、ステートのGetter/Setterパターンも検討。

### Phase 2: ユーティリティとコア機能の抽出
4.  **Utilsの抽出 (`src/utils/*.ts`)**: `unwrapColorSpan` や `calculateOffsetWithinNode` などの純粋な関数を移動。
5.  **Selectionロジックの抽出 (`src/editor/selection.ts`)**: `restoreRangeFromSelectionState` などを移動。
6.  **Encoding/IOの抽出 (`src/utils/file.ts`)**: `saveFullHTML`, `importFullHTMLText` などを移動。

### Phase 3: 機能モジュールの抽出
7.  **Formattingの抽出 (`src/editor/formatting.ts`)**: `toggleBold`, `applyBlockElement` などを移動。
8.  **Editor Coreの抽出 (`src/editor/core.ts`)**: `bindEditorEvents`, `renumberParagraphs` などを移動。
9.  **Feature/UIの抽出 (`src/features/*.ts`, `src/ui/*.ts`)**: 画像、リンク、メニュー制御を移動。

### Phase 4: 統合
10. **main.ts の再構築**: 各モジュールをインポートし、`window` オブジェクトへの紐付けや初期化処理 (`initEditor`) を行う。
11. **動作確認**: `npm run build` およびブラウザでの動作確認。

## 注意点
- **循環参照**: モジュール間での相互参照が発生しやすいため、可能な限り `globals.ts` や `core.ts` に依存を集約させるか、依存関係を一方向に保つ。
- **Windowオブジェクト**: 既存の `index.html` 内のイベントハンドラ (`onclick="..."` などは除去済みだが、互換性のため) から呼べるよう、`main.ts` で確実にグローバルスコープへ公開する。

---
**本セッションでは Phase 1 と Phase 2 の一部（Utils/Selection）までを実施し、ビルドが通る状態を目指す。**
