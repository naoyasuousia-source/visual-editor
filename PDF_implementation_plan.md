# PDF出力機能の改善計画

## 1. 現状分析
- 現在、`window.print()`を実行すると、エディタ保持用のUI（ツールバー、サイドバーなど）も一緒に印刷されてしまう。
- `src/v2/styles/content.css`の`@media print`は、`body.standalone-html`のみを対象としており、エディタ環境での印刷に対応していない。
- テキストの選択可能性については、既に`user-select: text !important`が指定されているが、エディタ特有のスタイル（ProseMirrorなど）が干渉している可能性がある。

## 2. 解決方針
V1の実装（`src/v1/styles/ui.css`および`src/v1/styles/content.css`）を参考に、以下の変更を行う。
1.  **UIコンポーネントの非表示化**: 印刷時にツールバー、サイドバー、ダイアログ、ボタンなどを非表示にするCSSルールを追加する。
2.  **レイアウトのリセット**: 印刷時に`body`やメインコンテナの`overflow: hidden`や`height: 100vh`を解除し、コンテンツが正しく流れるようにする。
3.  **A4領域の最適化**: `section.page`がA4サイズ（210mm x 297mm）に正確に一致し、ページ区切りが正しく行われるようにする。
4.  **テキスト選択の保証**: PDFリーダーでテキストが選択可能であることを確実にする。

## 3. 具体的な作業内容

### 3.1. `src/v2/app/App.tsx` の修正
- 印刷時に特定しやすくするため、主要なUIコンポーネントをラップしている要素にIDまたはクラスを付与する。
  - ツールバー: `id="toolbar"` (V1互換)
  - サイドバー: `id="page-navigator"` (V1互換)
  - メイン領域: `id="pages-container"` (V1互換)

### 3.2. `src/v2/styles/content.css` の修正
- `@media print` ブロックを強化する。
- `body.standalone-html` だけでなく、通常の `body` にも適用されるようにする。
- 以下の要素を非表示にする:
  - `#toolbar`
  - `#page-navigator`
  - `.sonner` (Toaster)
  - `button`
  - `dialog`
  - `[role="menu"]` (Radix UIのメニュー)
  - `.bubble-menu`
- 以下のレイアウトを調整する:
  - `body`: `overflow: visible`, `height: auto`, `background: #fff`
  - ページの親コンテナ: `overflow: visible`, `height: auto`, `zoom: 1 !important` (ズームのリセット)

## 4. 完了条件
- 印刷プレビュー（PDF出力）時に、A4の各ページのみが表示され、ツールバーなどが含まれない。
- PDF内のテキストが選択可能である。
- 出力されるコンテンツがA4領域に正しく収まっている。
