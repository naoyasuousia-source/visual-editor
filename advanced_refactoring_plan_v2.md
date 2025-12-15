# 高度リファクタリング計画 (改訂版)

## 反省と改善方針
前回の反省点：**ロジックを移動した際、`window` オブジェクトへの紐付け（互換性維持コード）も一緒に削除してしまい、アプリケーションが機能不全に陥った。**

改善策：
1. **`src/registry.ts` の早期導入**: ロジック移動の前に、まず「グローバル公開」の責任を持つファイルを分離する。
2. **2段階移行**:
   - Phase 1: `main.ts` にある `window.xxx = yyy` をすべて `src/registry.ts` に移動。
   - Phase 2: ロジックを別ファイルへ移動し、`registry.ts` の import 元を書き換える。
   これなら「ロジック移動」と「グローバル公開」を別々に管理でき、公開漏れを防げる。

## アーキテクチャ構成
```text
src/
├── main.ts                 # エントリーポイント (registryの読み込みとinitEditor実行のみ)
├── registry.ts             # 【新設】windowオブジェクトへの関数登録を一元管理
├── types.ts                # 型定義
├── globals.ts              # グローバル状態・定数
├── utils/                  # 汎用ユーティリティ
├── editor/                 # エディタのコアロジック
│   ├── core.ts             
│   ├── page.ts             # 完了
│   ├── selection.ts        
│   ├── formatting.ts       
│   ├── image.ts            # 次はここ
│   └── io.ts               
└── ui/                     # UI制御
    ├── toolbar.ts
    ├── menu.ts 
    └── events.ts
```

## 実施ステップ (改訂)

### Step 6: グローバル登録の分離 (`src/registry.ts`) **<-- 最優先**
- **目的**: 既存の `main.ts` にある `window.xxx = ...` をすべてこのファイルに移動する。
- **作業**:
  1. `src/registry.ts` を作成。
  2. `main.ts` から `window` への代入行をすべて `registry.ts` へ移動。
  3. `registry.ts` に必要な関数を `main.ts` や他モジュールから import する。
  4. `main.ts` で `import './registry.js'` する。
- **効果**: 今後ロジックを移動しても、`registry.ts` の import パスを変えるだけで済み、`window` への登録漏れが起きない。

### Step 7: 画像ロジックの完全分離 (`src/editor/image.ts`)
- **対象**: `promptDropboxImageUrl`, `promptWebImageUrl`, `insertImageAtCursor`, `applyImageSize`, `showImageContextMenu`, `closeImageContextMenu`, `applyImageTitle`, `updateImageMetaTitle`, `removeExistingImageTitle`, `initImageContextMenuControls`
- **作業**:
  1. 上記関数を `src/main.ts` から `src/editor/image.ts` へ移動。
  2. `src/registry.ts` の import 元を `./main.js` から `./editor/image.js` に変更。
- **注意**: `ensureAiImageIndex` と `rebuildFigureMetaStore` は既に移動済みなので、それらとの整合性を取る。

### Step 8: イベントリスナーの分離 (`src/ui/events.ts`) (完了)
- **対象**: `bindEditorEvents`, `bindDocumentLevelHandlers`, `initPageLinkHandler`
- **目的**: ユーザー入力とロジックの結合部を切り出す。

### Step 9: UIコンポーネントの分離 (`src/ui/*`)
- **対象**: ツールバー制御(`toolbar.ts`)、メニュー制御(`menu.ts`)、ダイアログ制御(`dialog.ts`)。

### Step 10: エントリーポイントの最終清掃 (`src/main.ts`)
- `main.ts` に残った細かな初期化コードを整理し、完了。

## 作業ルール
- **`registry.ts` を常に確認**: 関数を移動したら、必ず `registry.ts` の import パスを修正する。代入行自体は削除しない。
- **`npm run build`**: 各ステップごとに実行し、import エラーがないか確認する。
