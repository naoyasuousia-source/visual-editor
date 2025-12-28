## 概要
これは、解決困難な要件を効率的に解決するためのファイルである。要件に関する重要事項を随時追記修正することで、AIが状況を動的に把握しやすくするとともに、他のモデルも即座に状況を把握できるようにする。

内容は以下の通りとする。
1.未解決要件、2.未解決要件に関するコード変更履歴（毎回、分析結果・方針・変更内容を詳細に記述する）3.分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）、4.解決済み要件とその解決方法、5.要件に関連する全ファイルのファイル構成、6.要件に関連する技術スタック、7.要件に関する機能の動作原理（依存関係含む）

## ワークフロー

### 現状把握と分析
まず、1を確認して未解決要件を把握する。
その後、2～7を参考にしつつ、コードベースを分析して、現状の問題点を考える。
同時に、3を更新する。

### 5～7の更新
分析を踏まえて、5～7を更新する。
***常に、最新の要件に関連する記述を行い、最新の要件に関係のない記述は削除すること。***

### コード編集作業
次に、実際に要件を満たすためにコーディングを行う。途中、適宜3を更新する。

### 作業終了後
作業後は、ユーザーから、フィードバックを受けたのち、ユーザーの指示に従って、1,4を更新する。
***勝手に1,4を編集しないこと。***

----------------------------------------
# 以下、AIが自動的に更新する部分
----------------------------------------

## 1. 未解決要件
- Wordモードはページという概念無くし、1ページ目が永遠に下まで続くようにする。
- デフォルトではA4ページ1枚を配置。（A4ページの下辺から一段落目の高さ）をXとし、常にページの最終行の下にXの領域が確保されるようにする。（最終行の下に常に決まった長さの余白ができる）（その余白より下にはスクロールできないようにする）
**このロジックはv1で実装されているので、積極的に参考にすること**

- 現在、段落番号チェックボックスをオフにしても、段落番号が消えないので、ちゃんと切り替えられるようにする。
- 段落番号on/offチェックボックスは「ファイル」と「B」の間に移動する。
- 「標準モードに切替」ボタンの背景、v1と同じ色にする。
- wordモードのブロック要素選択メニューは、現在変更するとメニューが閉じてしまうが、メニューはメニュー外の領域をクリックするまで閉じず、連続切り替えできるようにする。
- ハイライトメニューはwordモードでは、実装しないので、Wordモードでは完全に消す。

- **モード切替時のデータ破棄とリフレッシュ**: モード切り替え時に確認ダイアログ（v1互換メッセージ）を表示し、承認された場合にのみ `localStorage` を更新して `window.location.reload()` を実行するようにしました。

## 2. 未解決要件に関するコード変更履歴
- **2025-12-29 実装完了**:
    - `useParagraphNumberToggle.ts`: `toggleParagraphNumbers` へのリネームにより、Toolbarからの呼び出しを正常化。
    - `Pagination.ts`: `isWordMode` オプションを追加し、Wordモード時はページ分割をスキップ。
    - `useTiptapEditor.ts` & `App.tsx`: `Pagination` と `ParagraphNumbering` への `isWordMode` の伝搬を実装。
    - `content.css`: Wordモード用の無限ページスタイル (`height: auto`, `min-height: 297mm`, `padding-bottom` 余白) を追加。段落番号非表示の `!important` 適用。
    - `Toolbar.tsx`: 段落番号チェックボックスを「ファイル」と「B」の間に移動。モード切替ボタンをオレンジグラデーションに。ハイライトメニューをWordモードで非表示化。
    - `WordBlockMenu.tsx`: Radix UI ベースの新規コンポーネント。選択しても閉じない挙動を実現。
    - `useAppStore.ts`: `toggleWordMode` に確認ダイアログとリロード処理を追加。初期状態を `localStorage` から取得するように変更。
    - `useBrowserCheck.ts` & `BrowserWarningDialog.tsx`: v1準拠の判定ロジック（PC且つChrome/Edge以外で警告）及び、プレミアムな警告ダイアログの実装。

## 3. 分析中に気づいた重要ポイント
- **Wordモードの無限ページ**: `Pagination` エクステンションに `isWordMode` オプションを追加し、`update` フック内でスキップ。CSSで `height: auto` と `min-height: 297mm` を強制。
- **下部余白**: `padding-bottom: calc(297mm - var(--page-margin))` を使用することで、常に最終行の下に A4 1枚分の余白を確保。
- **段落番号トグル**: フックの戻り値と呼び出し名の不一致がバグの直接原因。
- **メニュー制御**: Radix UI の `BaseDropdownMenu` を使い、`MenuItem` の `onSelect` で `e.preventDefault()` を呼ぶことで「選択しても閉じない」動作を達成。

## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成
- `src/v2/app/App.tsx`: モード切り替え、レイアウト管理
- `src/v2/store/useAppStore.ts`: `isWordMode` ステートの管理
- `src/v2/styles/content.css`: Wordモード時のページ・余白スタイル
- `src/v2/hooks/useParagraphNumberToggle.ts`: 段落番号のON/OFF
- `src/v2/components/features/Toolbar.tsx` (仮): チェックボックスの配置
- `src/v2/hooks/useTiptapEditor.ts`: エディタの初期化、ページ溢れ防止ロジック
- `src/v1/styles/ui_word_mode.css`: v1のWordモード用CSS（参考）
- `src/v1/editor/page.ts`: v1のページ制御（参考）

## 6. 要件に関連する技術スタック
- React 18
- Tiptap (Prosemirror)
- Tailwind CSS
- Zustand (useAppStore)
- Shadcn/ui (Radix UI)

## 7. 要件に関する機能の動作原理
- **Wordモードの無限ページ**: 
    - `isWordMode` が true の時、Tiptap の `checkPageOverflow` ロジックをスキップし、ページ要素 (`section.page`) の高さを `auto`、`min-height` を `297mm` に設定する。
    - 下部余白は CSS の `padding-bottom: calc(297mm - 40px)` で確保する。
- **段落番号**:
    - Tiptap のカスタムエクステンションまたは CSS 定義により表示。
    - `useParagraphNumberToggle` フックでクラスまたは属性を切り替える。
- **メニュー制御**:
    - Radix UI の `DropdownMenu` または `Select` を使用している場合、`onInteractOutside` や `open` プロパティを制御して、メニューが閉じないようにする。

