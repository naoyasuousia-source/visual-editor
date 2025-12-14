# 高度リファクタリング計画: モダンアーキテクチャへの移行

## 現状の課題
`src/main.ts` の行数は減りましたが、依然として「ページ管理」「UIイベントハンドリング」「画像処理」「グローバル登録」など、**異なる責務（Concern）**が混在しています。これを「プロフェッショナルな設計」にするため、役割ごとに厳密にディレクトリとファイルを分け、**関心の分離 (Separation of Concerns)** を徹底します。

## 目標アーキテクチャ
`src/main.ts` は単なるエントリーポイント（起爆剤）とし、ロジックを持たせない構成にします。

```text
src/
├── main.ts                 # エントリーポイント (各モジュールの初期化起動のみ)
├── registry.ts             # windowオブジェクトへの関数登録（レガシー互換用グルーコード）
├── types.ts                # 型定義
├── globals.ts              # グローバル状態・定数
├── utils/                  # 汎用ユーティリティ (DOM, Fileなど)
│   ├── dom.ts
│   └── file.ts
├── editor/                 # エディタのコアロジック (ドキュメント操作)
│   ├── core.ts             # エディタの状態管理 (setActiveEditorなど)
│   ├── page.ts             # ページ管理 (add/remove/renumber)
│   ├── selection.ts        # 選択範囲管理
│   ├── formatting.ts       # 文字装飾
│   ├── image.ts            # 画像挿入・操作
│   └── io.ts               # 入出力
└── ui/                     # ユーザーインターフェース制御
    ├── toolbar.ts          # ツールバーのイベントハンドラ
    ├── menu.ts             # ドロップダウン、Paragraph/Fontメニュー
    ├── context-menu.ts     # 右クリックメニュー
    ├── dialog.ts           # 各種ダイアログ制御
    └── events.ts           # 入力イベントのバインディング (bindEditorEvents)
```

## 実施ステップ

### Step 5: ページ管理の分離 (`src/editor/page.ts`)
- **対象**: `createPage`, `addPage`, `removePage`, `renumberPages`, `initPages`
- **目的**: ドキュメント構造（ページ）の管理ロジックを独立させる。
- **作業**: 上記関数を移動し、必要な依存関係を解決する。

### Step 6: 画像ロジックの分離 (`src/editor/image.ts`)
- **対象**: `insertImageAtCursor`, `ensureAiImageIndex`, `rebuildFigureMetaStore` など
- **目的**: 画像処理に関するロジックを独立させる。

### Step 7: UIコンポーネントの分離 (`src/ui/*`)
- **対象**:
  - `bindToolbarHandlers`, `updateToolbarState` -> `src/ui/toolbar.ts`
  - `toggleFileDropdown`, `initFontChooserControls` -> `src/ui/menu.ts`
  - `showImageContextMenu` -> `src/ui/context-menu.ts`
  - `openTitleDialog` -> `src/ui/dialog.ts`
- **目的**: 見た目の制御とデータの制御を分ける。

### Step 8: イベントリスナーの分離 (`src/ui/events.ts`)
- **対象**: `bindEditorEvents`, `bindDocumentLevelHandlers`
- **目的**: ユーザーの入力イベント（キーボード、クリック）とロジックの橋渡し役を分離する。

### Step 9: グローバル登録の隔離 (`src/registry.ts`)
- **対象**: `window.xxx = xxx;` の代入文すべて。
- **目的**: `main.ts` を汚染している互換性維持コードを別ファイルに隔離し、将来的に削除しやすくする。

### Step 10: エントリーポイントの清掃 (`src/main.ts`)
- **作業**: 全てのロジックが移動した後、`main.ts` は `initEditor` を呼び出し、`registry` をインポートするだけの数行のファイルにする。

## ルール
- **循環参照の回避**: `ui` は `editor` を呼んでよいが、`editor` は `ui` を呼ぶべきではない（可能な限り）。状態が変わったらイベントを発火するか、コールバックで UI を更新する設計が理想だが、まずは関数呼び出しで移行する。
- **各ステップでのビルド確認**: 常時 `npm run build` が通る状態を維持する。
