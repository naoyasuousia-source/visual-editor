# V1 -> V2 移行・機能ギャップ完全分析計画書

本ドキュメントは、オリジナルエディタ（V1）のコードベース（`src/v1`）を網羅的に調査し、V2（React + Tiptap）への移行において未実装または不完全な機能・ロジックを特定したものです。
V1のコードには「AIアシスタント連携」や「厳密なHTML構造維持」のための重要なロジックが多数含まれており、これらをV2でも完全に再現する必要があります。

---

## 1. コア機能・データ構造 (Core & Data)

| V1 ファイル | 機能名 | V2 現状 | 必要な対応 |
| :--- | :--- | :--- | :--- |
| `editor/formatting.ts` | **`renumberParagraphs`** | `extensions/ParagraphNumbering.ts` で一部実装済みだが、ロジックが異なる可能性あり。 | `data-para` 属性の付与だけでなく、**AIガイド用のID生成（`p1-1` / `p1`形式）** が V1 と完全に一致しているか確認し、不足があれば移植する。 |
| `editor/formatting.ts` | `replaceInlineTag` | Tiptap標準 | Tiptapはデフォルトで `<strong>`/`<em>` を使うため概ねOKだが、`<b>`/`<i>` が混入した場合の強制変換ロジックが必要か検討。 |
| `editor/formatting.ts` | `applyPendingBlockTag` | 未実装 | 入力中にブロックタグを予約するV1独自の挙動。UXに影響するため、Tiptapの `DefaultBrowserBehavior` と相談しつつ移植を検討。 |
| `editor/io.ts` | **`buildFullHTML`** | `utils/io.ts` | **最重要**。V1は `ai-meta-guide` (コメントタグ) や `style` タグ（CSS変数込み）を動的に生成して埋め込んでいる。V2の保存機能もこれと**1バイト単位で互換性のあるHTML**を出力する必要がある。 |
| `editor/io.ts` | `importDocx` | 未実装 | Mammoth.js を用いたWord取込機能。V2にも同等のロジック（画像除外・リンク解除・ブロック正規化）を移植する必要がある。 |
| `editor/ai-meta.ts` | **`updateAiMetaGuide`** | 未実装 | ファイル先頭に挿入される `<!-- AI ASSISTANT GUIDE ... -->` コメントの生成ロジック。AIがファイルを認識するために必須。 |

## 2. 編集・操作ロジック (Editing & Interactions)

| V1 ファイル | 機能名 | V2 現状 | 必要な対応 |
| :--- | :--- | :--- | :--- |
| `editor/page.ts` | **`checkPageOverflow`** | `extensions/Pagination.ts` | V2でもページネーションは実装済みだが、V1の「要素の分割位置判定」や「フォーカス維持」「アンカーノードの保存」ロジックほど堅牢か再確認が必要。特に日本語入力中の改ページ挙動。 |
| `ui/events.ts` | **IME確定直後のEnter制御** | 未実装 | ブラウザ/OSごとのIME挙動差異（確定Enterが改行として誤認識される問題）を吸収する `compositionEndTs` を用いたハック。Tiptapが吸収しきれない場合、移植が必要。 |
| `ui/events.ts` | `paste` イベント制御 | 未実装 | **画像ファイルの直接ペースト禁止**（ファイルメニュー利用強制）および、HTML画像タグのペースト禁止機能。ユーザー運用ルールに関わるため移植必須。 |
| `ui/events.ts` | `bindDocumentLevelHandlers` | 未実装 | インラインタブ（`inline-tab`）クリック時のキャレット制御（要素の前半なら前、後半なら後ろにキャレットを置く）など、細かいUX挙動。 |

## 3. 画像・オブジェクト管理 (Images & Objects)

| V1 ファイル | 機能名 | V2 現状 | 必要な対応 |
| :--- | :--- | :--- | :--- |
| `editor/image.ts` | **`rebuildFigureMetaStore`** | `components/AIImageIndex.tsx` | V1はDOM操作で全画像を走査し、`<div id="ai-image-index">` を更新する。V2もReactの状態管理だけでなく、**最終的なDOM（HTML）にこのインデックスを出力する**仕組みが必須。 |
| `editor/image.ts` | `ensureFigureWrapper` | 一部実装? | 画像を `.figure-inline` で囲み、前後に `.caret-slot`（ゼロ幅スペース）を配置するV1独特のDOM構造。Tiptapの `NodeView` でこの構造を再現しないと、キャレット移動や保存データに互換性がなくなる。 |
| `editor/image.ts` | コンテキストメニュー詳細 | `components/ImageContextMenu` | 実装済みだが、「枠線の有無（`has-border`）」トグル、「サイズ変更（`img-s`, `img-m`...）」などのクラス操作がV1のCSSと完全に一致しているか検証が必要。 |
| `editor/image.ts` | `promptDropboxImageUrl` | 未実装 | Dropboxの共有URLを `dl=0` から `raw=1` に変換する便利機能。 |

## 4. リンク・ナビゲーション (Links & Navigation)

| V1 ファイル | 機能名 | V2 現状 | 必要な対応 |
| :--- | :--- | :--- | :--- |
| `editor/links.ts` | **内部ブックマーク機能** | 標準Linkのみ | V1はURLリンクだけでなく、選択範囲を特定の `span id="bm-..."` で囲み、そこへの内部リンクを作成する機能を持つ。V2のLink拡張を拡張し、この「内部アンカー生成」機能を実装する必要がある。 |
| `ui/navigator.ts` | `jumpToParagraph` | 実装済み | `p1-1` (標準) / `p1` (Word) 形式へのジャンプに加え、**テキスト検索フォールバック**（IDで見つからない場合、本文検索してハイライト）がV1にはある。V2のジャンプ機能にもこのフォールバックを追加すべきか検討。 |
| `ui/navigator.ts` | サムネイル生成 | `PageNavigator.tsx` | 実装済み。`cloneNode` してIDを除去するロジックはほぼ同じ。 |

## 移行優先度と実行プラン（React & Custom Hooks アプローチ）

**方針**: オリジナルエディタのロジックをそのままコピー＆ペーストするのではなく、**Reactの設計思想（コンポーネント指向・フック）** に適合させる。複雑なDOM操作やイベントハンドリングはカスタムフック（例: `usePageOverflow`）にカプセル化し、ライブラリで代替可能な機能（例: 画像アップロード、ドラッグ＆ドロップ）は積極的に既存のReactライブラリを採用する。Tiptapについては、要件通り拡張機能（Extension）として実装されているか厳密にチェックする。

1.  **AIメタデータ & 保存形式の完全一致 (最優先)**
    *   **アプローチ**: `utils/io.ts` を単なる関数集ではなく、`useFileIO` フックとして再設計し、ロード時のパース状態と保存時のHTML生成を管理する。
    *   `ai-meta-guide` の生成ロジックは、保存直前に走る Tiptap の `transformer` または `serializer` として実装するのではなく、最終的なHTML文字列生成時に注入するユーティリティ関数として切り出す（Tiptapのドキュメントモデルを汚染しないため）。
    *   `ParagraphNumbering` 拡張機能が生成するID形式が `p1-1`（標準）/ `p1`（Word）と完全に一致するか、テストケースを作成して検証する。

2.  **画像管理・コンテキストメニュー**
    *   **アプローチ**: `ImageContextMenu` は既にReactコンポーネント化されているため、不足機能（ボーダー切替、サイズ変更）をそのコンポーネント内のステート操作として実装する。DOMを直接操作するのではなく、Tiptapの `updateAttributes` コマンドを通じてこれを行う。
    *   `rebuildFigureMetaStore`（画像インデックス生成）は、`useEffect` でドキュメントの変更を監視し（`editor.on('update')`）、Reactのステートとして最新の画像リストを保持、それをレンダリング時に隠しDOM `<div id="ai-image-index">` として出力する形にする。これにより、DOM走査のコストを下げ、リアクティブな更新を実現する。
    *   Dropbox画像対応等は、`react-dropzone` などの外部ライブラリ導入を検討するか、シンプルな `window.prompt` のラッパーフックを作成する。

3.  **イベント制御・制約の適用**
    *   **アプローチ**: `useIMEControl` フックを作成し、IME入力中の `Enter` キー挙動を制御するロジックをカプセル化。これを `Editor` コンポーネントの `editorProps.handleKeyDown` に接続する。
    *   ペースト制御についても `handlePaste` プロップスを通じて、クリップボードの内容（ファイルvsHTML）を判定するロジックをフックとして実装する。

4.  **Tiptap構成の検証**
    *   現在の `extensions` フォルダ内の実装が、Tiptapの推奨する Class ベースの拡張機能記述ルールに沿っているか再チェックする。特に `Schema` 定義や `addCommands`, `addKeyboardShortcuts` の使い方が正しいか監査する。
