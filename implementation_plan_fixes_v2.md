# UI/UX改善実装計画書

## 目的
エディタの操作性を向上させるため、以下の4点の課題を解決する。

1. **ハイライト取り消し時のメニュー維持**: ハイライトパレットの「取消」ボタン押下後もパレットを閉じず、連続操作可能にする。
2. **ブロック要素適用時のメニュー維持**: 段落スタイルメニュー内のブロック要素変更後もメニューを閉じず、連続操作可能にする。
3. **メニューの排他制御**: あるメニューを開いた際、既に開いている他のメニューを自動的に閉じる。
4. **Align（整列）機能の修正**: 初回適用時における選択範囲解除およびメニュー閉鎖のバグを修正する。

## 原因分析と対策

### 1. & 2. メニューが閉じてしまう問題
**原因**: 
ツールバー内のボタンクリックイベントが `document` までバブリングし、`bindDocumentLevelHandlers` 内で定義されている「メニュー外クリック検知ロジック」が反応してしまっている、もしくは処理実行後のフォーカス移動等により意図せず閉じている可能性がある。特に、DOM操作を伴うアクション（取り消しやブロック変換）の後、イベントの伝播もしくは判定ロジックが「メニュー外」とみなしている可能性が高い。

**対策**: 
`bindToolbarHandlers` 内の各アクション実行時に `event.stopPropagation()` (または `event.stopImmediatePropagation()`) を確実に呼び出し、`document` レベルのクリックハンドラ（メニューを閉じる処理）への到達を阻止する。

### 3. メニューの排他制御
**現状**: 
各メニュー（フォント、段落、ハイライト、ファイル）が独立して開閉状態を管理しているため、同時に複数のメニューが開いてしまう。

**対策**: 
共通関数 `closeAllMenus(excludeType?)` を作成し、各メニューの `toggle` 処理の冒頭でこれを呼び出す。引数で指定されたメニュー以外を全て閉じるようにする。

### 4. Align機能の初回バグ
**原因**: 
Align適用時 (`applyParagraphAlignment`)、対象段落にラッパー要素 (`span.inline-align`) が存在しない場合は新規作成 (`ensureParagraphWrapper`) している。このDOM構造の大幅な変更（親要素の差し替え）により、ブラウザが保持していた選択範囲 (`Range`) が無効化または消失していると考えられる。また、これに伴いメニュー閉鎖の問題も誘発されている。

**対策**: 
`applyParagraphAlignment` 関数内で、処理実行前の選択状態（対象ノードなど）を保存し、DOM変更処理後に適切な選択範囲 (`Range`) を再生成して適用するロジックを追加する。また、メニューボタンクリック時の `stopPropagation` も併用する。

## 実装手順

### Step 1: 共通ヘルパーの実装 (`src/main.ts`)
- `closeAllMenus()` 関数を実装する。以下の要素の閉鎖処理をまとめる。
    - Font Family / Block Menu (`.font-chooser`)
    - Paragraph Menu (`.paragraph-chooser`)
    - Highlight Palette (`.highlight-control`)
    - File Dropdown (`.file-dropdown`)
    - Nested Dropdowns (`.nested-dropdown`)
※ Image Context Menu は独立性が高いため、必要に応じて調整する。

### Step 2: 各Toggle関数の改修 (`src/main.ts`)
- 以下の関数で `closeAllMenus` を呼ぶように修正する。
    - `toggleFontMenu`
    - `toggleParagraphMenu`
    - `toggleHighlightPalette`
    - `toggleFileDropdown`

### Step 3: イベントハンドラの改修 (`bindToolbarHandlers`)
- ツールバー内のクリックイベントリスナーにおいて、メニュー内ボタン（`font-color-swatch`, `block-element`, `paragraph-spacing`, `highlight-reset` など）が押された際、`event.preventDefault()` に加えて `event.stopPropagation()` を実行するように修正する。
    - 特に **「取り消し（highlight-reset）」** と **「ブロック要素（block-element）」** のケースを重点的に確認する。

### Step 4: Align機能の修正 (`applyParagraphAlignment`)
- DOM操作前後で選択範囲を維持するためのロジックを追加する。
    - `getParagraphsInRange` で対象を取得した後、変更後の要素を含んで範囲選択し直す処理を加える。

## 検証項目
1. ハイライトパレットを開き、「取消」を押してもパレットが閉じないこと。また、連続して他の箇所の取り消しができること。
2. 段落スタイルメニューを開き、ブロック要素（見出し等）を変更してもメニューが閉じないこと。
3. フォントメニューを開いた状態で段落メニューを開くと、フォントメニューが閉じること。
4. Align（左揃え等）を、まだ適用されていない段落に対して実行した際、選択範囲が維持され、かつメニューも開いたまま維持されること。
