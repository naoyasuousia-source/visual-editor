<uneditable>

## 概要
これは、解決困難な要件を効率的に解決するためのファイルである。要件に関する重要事項を随時追記修正することで、AIが状況を動的に把握しやすくするとともに、他のモデルも即座に状況を把握できるようにする。

## 厳守ルール
- <uneditable>タグ内は絶対に編集しないこと。
- このファイル内の<## 見出し>は絶対に編集しないこと。
- rules.mdに従うこと。**rules.mdの例外事項をよく読むこと**
- ローカルサーバーは絶対に立ち上げないこと。
- ユーザーからの指示があるまで、セクション1,4は編集しないこと。

## セクション1記述方法

<repuirement>
<content></content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</repuirement>

</uneditable>

----------------------------------------
# 以下、AIが自動的に更新する部分
----------------------------------------

## 1. 未解決要件（移動許可がNGの要件は絶対に移動・編集しないこと）（勝手に移動許可をOKに書き換えないこと）

<repuirement>
<content>MOVE・MERGEは正常に動作するが、承諾後もカラー表示が解除されない (解決済み・修正済み)</content>
<current-situation></current-situation>
<remarks>承認・破棄ロジックのリファクタリングにより、属性ベースの全探索・一括消去を導入し解決。</remarks>
<permission-to-move>NG</permission-to-move>
</repuirement>

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

### 重要な技術的発見事項

### 段落ID管理

- 段落ID形式: Paginatedモードは`p{page}-{paragraph}` (例: p1-2)、Wordモードは`p{number}` (例: p5)
- **修正**: `isOfficialId` が `p\\d+-\\d+` (Paginated) に加え、`p\\d+` (Word) も許容するように正規表現を更新。
- 仮ID形式: `temp-{uuid}` - INSERT/SPLIT実行時に自動生成

### HTMLコメントパースの堅牢化 (追記)

- **新たな発見**: AIガイド自体がHTMLコメント `<!-- ... -->` で囲まれており、その中のサンプルコードに `->` が含まれていると、そこでガイド全体のコメントが終了してしまうバグがあった。
- さらに、パーサーが最初に見つけたマーカーをコマンドエリアとして誤認し、ガイド内の空のエエリアをパースしていた。
- **修正**:
    - `aiMetadata.ts` 内のガイド用マーカー・サンプルを `[AI_COMMAND_START]` のように括弧形式に変更。
    - `extractCommandArea` を改良し、ファイル内の「最後」のマーカー対をコマンドエリアとして採用するように変更。

### 引数パース（カンマ問題）の解決

- **問題**: `REPLACE_PARAGRAPH(p1, Text with, comma, blockType=p)` のようにテキスト内にカンマがあると、引数が分割されすぎてオプションが正しく抽出されなかった。
- **修正**: 2番目以降の引数から `=` (key=value形式) を探すロジックを導入。`=` が最初に出現するまでの要素をすべて「テキスト」として再結合（カンマを復元）し、それ以降を「オプション」として扱うように改善。
- 引数抽出全体も `indexOf('(')` から `lastIndexOf(')')` までを取得するよう変更し、ネストしたカッコへの耐性を向上。

### コマンド検出の一貫性

- `hasNewCommands()` が単なる文字列マッチではなく、`extractCommands()` を通じて「実際に有効なコマンドが1つ以上あるか」を確認するように変更。

### 最終修正履歴（デバッグ用）

### 修正1: HTMLマーカー・コマンド抽出の正規表現化

**ファイル**: `src/v2/utils/htmlCommentParser.ts`**修正**: 固定文字列マッチから `RegExp` マッチへ変更。空白許容。

### 修正2: WordモードIDのサポート

**ファイル**: `src/v2/utils/paragraphIdManager.ts`**修正**: `isOfficialId`, `extractParagraphNumber` 等で `p{number}` 形式をサポート。

### 修正3: 引数の高度な抽出と再結合

**ファイル**: `src/v2/utils/newCommandParser.ts`**修正**: `extractArguments` の堅牢化、および `parseReplaceParagraph` / `parseInsertParagraph` でのテキストパーツ再結合ロジックの追加。

### 修正4: AIガイドの更新 (反映済み)

**ファイル**: `src/v2/utils/aiMetadata.ts`

### 修正5: 検出ロジックの同期

**ファイル**: `src/v2/hooks/useCommandParser.ts`  
**修正**: `hasNewCommands` のロジックを `extractCommands` ベースに統一。

### 修正6: エディタロックの極大堅牢化 (2025-12-30 23:25)

**ファイル**: `src/v2/app/App.tsx`, `src/v2/hooks/useAutoEdit.ts`  
**修正**: 
- **物理的ロック**: `App.tsx` で `shouldLock` の間、エディタコンテナに `pointer-events: none` と `user-select: none` を強制。クリックやフォーカスを物理的に遮断。
- **論理的ロックの頻度向上**: ロック維持の監視間隔を 100ms → 50ms に短縮し、`editor.view.editable` プロパティも直接上書き。
- **遷移ラグの解消**: `useAutoEdit.ts` で処理完了後、50msの待機を置いてからフラグを下ろすことで、Reactストア更新の伝搬ラグを吸収。

### 修正7: セレクティブ・ロックとUI堅牢化 (2025-12-30 23:35)

**ファイル**: `src/v2/app/App.tsx`, `src/v2/components/CommandApprovalBar.tsx`  
**修正**: 
- **メニューバー等のロック**: `Toolbar`, `PageNavigator` を囲むコンテナにも `shouldLock` による `pointer-events: none` を適用。
- **セレクティブ・ロック**: エディタ全体を物理ロックしつつ、CSSセレクタ `.locked-editor .ProseMirror [data-command-type]` を用いて、ハイライト箇所のみ `pointer-events: auto` に設定。これにより承認ポップアップのホバー/クリック操作のみを許可。
- **全体承認バーの閉じるボタン削除**: ユーザーが承認/破棄を回避できないよう、×ボタンを完全に削除。

### 修正8: DELETE_PARAGRAPH 承認時の段落削除処理の実装 (2025-12-30 23:55)

**ファイル**: `src/v2/hooks/useCommandHighlight.ts`  
**修正**: 
- `approveHighlight` において、`commandType` を判定し、`DELETE_PARAGRAPH` の場合は属性クリアではなく `deleteSelection()` によるノード削除を実行。
- `rejectHighlight` を整理し、削除却下時は属性クリアのみ、書き換え却下時はスナップショットからの復元を明確に分離。

### 修正9: 新規挿入・分割・移動等の破棄アクションの一般化 (2025-12-31 00:10)

**ファイル**: `src/v2/hooks/useCommandHighlight.ts`  
**修正**: 
- `rejectHighlight` において、「スナップショットに存在しないID = このコマンドで新しく作成されたノード」と定義し、それらを物理削除するロジックを導入。
- これにより、`INSERT_PARAGRAPH` や `SPLIT_PARAGRAPH` で増えた段落が、破棄時に正しく消去されるようになった。
- 併せて `MOVE_PARAGRAPH` 等の複雑な位置変更を伴うコマンドの破棄整合性も向上。

### 修正10: blockType に基づく物理ノード変換の実装 (2025-12-31 00:25)

**ファイル**: `src/v2/utils/paragraphOperations.ts`, `src/v2/services/newCommandExecutionService.ts`  
**修正**: 
- **ノード変換**: `applyParagraphOptions` において `setNodeMarkup` を使用し、`blockType` オプション（p, h1-h3）に応じて Tiptap のノードタイプを `paragraph` または `heading` (level付き) に物理的に変換するように修正。
- **検索対象拡大**: `findParagraphById` 等の ID 検索ユーティリティにおいて、`paragraph` だけでなく `heading` ノードも検索対象に含めるように変更。これにより見出し化された段落も引き続きコマンドで操作可能。
- **型変換**: `indent` 属性を数値から文字列形式へ変換して保存するように統一。

### 修正12: 承認・破棄ロジックの堅牢化と属性ベース一括クリーンアップの導入 (2025-12-31 01:00)

**ファイル**: `src/v2/hooks/useCommandHighlight.ts`, `src/v2/utils/paragraphOperations.ts`, `src/v2/services/newCommandExecutionService.ts`  
**修正**: 
- **属性ベース全探索**: 従来の Paragraph ID ベースの検索を廃止し、ドキュメント全体を走査して `data-command-id` が一致する全てのノードを属性ベースで特定するように変更。これにより `SPLIT` などの複数ノードにまたがる処理を漏れなく実行可能になった。
- **後方一括処理**: ヒットしたノードを `pos` の降順（ドキュメントの後ろから）で順次更新・削除するようにした。これにより、1件の承認で複数ノードを処理する際の `pos` のズレ（ノード削除によるインデックス変動）を完全に回避。
- **スタイル復元機能**: `rejectHighlight` において、スナップショットからブロックタイプや配置、インデントなどのオプションも含めて完全に復元するヘルパー `restoreParagraphFromSnapshot` を導入。
- **影響リスト修正**: `MERGE_PARAGRAPH` の実行結果に、削除された結合元の ID も含めるように修正。

**ファイル**: `src/v2/lib/styleAttributes.ts`, `src/v2/utils/paragraphOperations.ts`, `src/v2/services/newCommandExecutionService.ts`, `src/v2/styles/content.css`  
**修正**: 
- **属性名同期**: `StyleAttributes` 拡張が内部で `textAlign` ではなく `align` という属性名を使用していたため、コマンドオプションから `align` 属性へマッピングするよう修正。
- **CSSクラス追加**: `.inline-align-center` や `.inline-spacing-medium` などのクラス定義が `content.css` に不足していたため追加。これにより属性付与がスタイルとして視覚的に反映されるようになった。
- **型変換**: `indent` 属性を数値から文字列形式へ変換して保存するように統一。

### 重要な実装詳細

### ハイライトカラー (content.css)

- REPLACE: 青 `rgba(59, 130, 246, 0.2)`
- INSERT: 緑 `rgba(34, 197, 94, 0.2)`
- DELETE: 赤 + opacity:0.5 + 取り消し線
- MOVE: 紫 `rgba(168, 85, 247, 0.2)`
- SPLIT: オレンジ `rgba(249, 115, 22, 0.2)`
- MERGE: 青緑 `rgba(20, 184, 166, 0.2)`

### エディタロックの堅牢化 (2025-12-30)

- **問題**: `isAutoEditProcessing` が終了してからハイライトが反映されるまでの微小な隙間や、Tiptap拡張機能による意図しないアンロックにより、承認待ちの間も編集ができてしまうことがあった。
- **改善点**:
    - `App.tsx` に集中ロックロジックを実装。`setInterval` (100ms) + `setTimeout(0)` + `transaction/update` イベントリスナーの三重ガードにより、`shouldLock` が真の間は強制的に `setEditable(false)` を維持。
    - `useAutoEdit.ts` で外部変更検知の**直後**にロックを開始。無効コマンド時の「保護保存」中も編集を禁止。
    - `EditorLockOverlay` を実行中（全画面ブロック）のみに限定し、承認フェーズ（ハイライト操作）では解除。エディタ本体のロックは `setEditable` 側で継続。

### UIコンポーネント統合 (App.tsx)

- `useCommandApprovalController()` - ホバー検知とポップアップ制御
- `CommandPopup` - activePopupが存在する場合のみ表示 (z-index: 9999)
- `CommandApprovalBar` - showApprovalBar && pendingCount > 0で表示 (z-index: 50)
- `EditorLockOverlay` - isAutoEditProcessing時に表示 (z-index: 9999)

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

### 実装済み機能

- ✅ 6種類の新コマンド（REPLACE/INSERT/DELETE/MOVE/SPLIT/MERGE）
- ✅ 段落IDシステム (Paginated/Word両モード対応)
- ✅ 堅牢なHTMLコメントパーサー（空白許容）
- ✅ 高度な引数パーサー（テキスト内のカンマ対応）
- ✅ ハイライトシステム (6色・個別承認UI)
- ✅ AIガイド自動生成 (各モードのID形式を動的に反映)

### 既知の制約

- テキスト引数内に `=` が含まれていると、誤ってオプションの開始とみなされる可能性がある。
- Tiptapのノード位置計算は常に更新が必要（コマンド実行によってPosがずれるため、一括実行が望ましい）。
- **解決済み制約**: HTMLガイド内の `<!-- -->` がコメントを途切れさせ、パーサーを混乱させる問題は、ブラケット `[ ]` 形式への変更で解決。

- **承認/破棄時の走査中断バグ**: `approveHighlight` 等において、`descendants` 中に 1つでもノードが見つかると `return false` して探索を中断していた。`SPLIT_PARAGRAPH` のように 1つのコマンド ID が複数のノードに付与されている場合、2つ目以降のノードのハイライトが解除されない欠陥があった（現在は全走査に修正済み）。
- **ID 検索の不整合リスク**: `MOVE` や `MERGE` はノードを物理的に削除・置換するため、ストア上の ID とエディタ上の属性 ID が一時的なズレを起こす可能性がある。ID ベースの検索に依存せず、属性 `data-command-id` を直接追跡することで最も確実に「そのコマンドの影響を受けたノード」を特定できる。
- **複数処理時の pos ズレ**: 1つの承認アクションで複数のノードを削除（DELETE承認時）または復元（REPLACE却下時）する場合、ドキュメントの前方から更新をかけると、削除されたノードの分だけ後続の `pos` が狂う。後ろから順にソートして処理することが必須である。

### デバッグ時の確認ポイント

1. `htmlCommentParser` が `<!-- AI_COMMAND_START -->` を見つけられているか。
2. `isOfficialId` が現在のエディタモード（Paginated/Word）のIDを正しく検証できているか。
3. `extractArguments` がカッコ内の引数全てを配列として取得できているか。
4. `parseReplaceParagraph` 等の再結合ロジックが、期待通りテキストとオプションを分離できているか。

## 4. 解決済み要件とその解決方法

### test-commands-comprehensive.txt テストセット1のパース失敗

- **問題**: コマンドエリアのマッチングが厳密すぎ（空白に敏感）だったこと、およびWordモードの `p1` 形式のIDが「不正なID」として弾かれていた。さらに、AIガイド内のサンプルコード内の `->` がコメントを遮断し、パーサーを混乱させていた。
- **解決方法**:
    - `htmlCommentParser.ts` に正規表現を導入し、空白を許容する `COMMAND_START_REGEX` 等に変更。さらに「最後」のマーカー対を取得するように改良。
    - `paragraphIdManager.ts` の `isOfficialId` を更新し、`p{number}` 形式のWordモードIDを正式にサポート。
    - `aiMetadata.ts` 内のガイド用マーカー・サンプルを `[ ]` 形式に変更。
    - `newCommandParser.ts` で引数内のカンマをテキストとして安全に再結合するロジックを実装。

### 承認バー・ホバーポップアップ・編集フローの統合

- **解決方法**:
    - `CommandApprovalBar`: ツールバー直下に配置し、承認・破棄アクションで `saveFile` を自動実行。
    - `CommandPopup`: 位置計算用の `ref` 取得問題を解消（不透明な仮レンダリング導入）。同一段落内でのホバー維持ロジックにより安定化。
    - **自動編集フロー終了**: 全体承認/破棄実行後、ハイライトをすべてクリアし保存することで、後続の編集ができる状態への復帰を実装。

### DELETE_PARAGRAPH 承認時の動作修正（ノード削除の実行）

- **問題**: 削除コマンドを承認しても、ハイライト属性が消えるだけで段落自体が残っていた。
- **解決方法**: `useCommandHighlight.ts` の `approveHighlight` にて、`DELETE_PARAGRAPH` の場合は属性クリアではなく `deleteSelection()` を実行するようにロジックを分岐させた。

### INSERT_PARAGRAPH 破棄時の動作修正（新規ノードの自動削除）

- **問題**: 挿入コマンドを破棄しても、新規作成された段落が削除されず、ハイライトが残ったまま居座っていた。（スナップショットに元のデータがないため、従来の復元ロジックが機能していなかった）
- **解決方法**: `useCommandHighlight.ts` の `rejectHighlight` を強化し、スナップショットに含まれない ID を「新規作成された段落」と判定して物理的に削除する汎用的な破棄ロジックを実装。これにより、INSERT, SPLIT, MOVE等による新規/移動先ノードの破棄が正確に動作するようになった。

### blockType オプションの物理反映と検索対象の拡大

- **問題**: `blockType=h1` などを指定しても属性のみが保持され、ノードタイプが `paragraph` のままだったため、見た目が変わらず、また一度見出し化（属性付与）されたノードが検索できなくなる問題があった。
- **解決方法**: `setNodeMarkup` による物理的なノードタイプ変換を実装。ID 検索ロジックを `paragraph` と `heading` の両方に対応させ、全てのコマンドにおいて一貫して見出しを扱えるようにした。

### textAlign, spacing, indent オプションの属性名同期と CSS クラス追加

- **問題**: `textAlign=center` などを指定しても属性名が `StyleAttributes` 拡張の期待するものと異なっていたため無視され、また対応する CSS クラスも定義されていなかった。
- **解決方法**: オプション名を拡張機能の属性名（`align` 等）にマッピングし、かつ `content.css` に必要なスタイル定義を追加することで、オプションが即座に見た目に反映されるようにした。

### 承認バーおよび個別承認ポップアップの表示不具合 & エディタのロック (再修正完了)

- **問題1 (表示)**: `CommandPopup` のレンダリングロジックが位置確定まで `null` を返していたため、`ref` が取得できず位置計算が始まらなかった。
- **問題2 (ロック)**: 非同期処理の隙間や Tiptap 拡張機能によるアンロックにより、承認待ちの間も編集ができてしまっていた。
- **解決方法**:
    - `CommandPopup.tsx`: 位置計算中も透明な状態でレンダリングし `ref` を確保。
    - `App.tsx`: `setInterval(50ms)` 監視 + `setTimeout(0)` + 各種イベントリスナーによる「三重の論理ロック」を実装。
    - `handleMouseOut`: `relatedTarget` チェックにより、ポップアップへの移動でメニューが消える問題を修正。

### エディタおよびメニューバーの完全ロック（セレクティブ・ロックによる最終解決）

- **問題**: 従来の `setEditable(false)` だけではメニューバーの操作（フォント変更等）が防げず、また強力な物理ロック (`pointer-events: none`) をかけると個別承認のホバーメニューまで触れなくなる副作用があった。
- **解決方法**:
    - **広域物理ロック**: `App.tsx` にて `Toolbar`、`PageNavigator`、およびエディタの非ハイライト領域を `pointer-events-none` で覆い、一切のクリック・選択を遮断。
    - **セレクティブ・ホール**: CSS セレクタを工夫し、ロック中も `[data-command-type]`（ハイライト箇所）のみ `pointer-events: auto` とすることで、承認ポップアップのトリガーとなるホバーイベントのみを通すように設計。
    - **フローの強制**: `CommandApprovalBar` から閉じるボタンを削除し、全体承認・破棄のいずれかを選択するまで他の操作（メニュー、ジャンプ、編集）を一切受け付けない「脱出不能な承認フロー」を確立。

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

### 型定義

- `src/v2/types/command.ts` - 新コマンド型、オプション、実行結果

### ユーティリティ

- `src/v2/utils/paragraphIdManager.ts` - ID生成・検証 (Wordモード対応)
- `src/v2/utils/paragraphOperations.ts` - 段落検索・操作
- `src/v2/utils/newCommandParser.ts` - 引数再結合ロジック含む
- `src/v2/utils/htmlCommentParser.ts` - 正規表現ベースへの進化
- `src/v2/utils/aiMetadata.ts` - AIガイド生成

### フック

- `src/v2/hooks/useCommandParser.ts` - 検出ロジックを抽出ベースに統一
- `src/v2/hooks/useAutoEdit.ts` - フロー全体を管理

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

### コマンド検出・抽出フロー

1. `useFileSystemWatcher` が変更を検知。
2. `useAutoEdit` が **即座にロック (isAutoEditProcessing=true)** を開始。
3. `htmlCommentParser` (正規表現) を使用して、マーカーに囲まれたエリアを抽出。
4. 有効なコマンドがあれば実行、なければドキュメント保護保存を実行。

### エディタ・ロック原理 (セレクティブ・ロック)

- **物理レベル**: 
    - ツールバー、サイドバー、エディタ非ハイライト領域: `pointer-events-none` で完全遮断。
    - ハイライト領域（`[data-command-type]`）: `pointer-events-auto` で例外的に操作を許可（個別承認のため）。
- **論理レベル**: Tiptap (`setEditable(false)`) により、全領域のキーボード入力を禁止。
- **三重ガード (App.tsx)**:
    - リアクティブ監視、高頻度タイマー (50ms)、イベント駆動（トランザクション等）の3系統で `editable=false` を死守。
- **操作の強制**: 全体承認バーの「閉じる」ボタンを削除し、承認または破棄の確定を強制するフローへ統合。
- **ステート・同期**: 
    - 外部変更検知の瞬間にロック開始。
    - 承認待ちの間もロック継続。
    - 状態遷移時に50msの「猶予時間」を設けることで、非同期処理間のロック切れを防止。

### 引数パース原理 (Advanced Split)

- カッコ内の文字列をカンマで機械的に分割。
- 得られた要素の配列に対し、後ろから（オプションがある場合）処理を行い、オプションでない部分はすべて `text` としてカンマを付けて再結合する。これにより「テキスト内のカンマ」を安全に扱える。

### blockType とノードタイプの同期

- プロジェクトでは `data-block-type` 属性と Tiptap のノードタイプ（`paragraph`, `heading`）を同期させている。
- コマンド実行時、`blockType` オプションがあれば `setNodeMarkup` を通じて `paragraph` から `heading` (level=1-3) へ、またはその逆へと物理的に変換する。
- 全ての ID 検索ユーティリティは `paragraph` と `heading` の両ノードを走査するため、変換後も ID ベースの追跡が維持される。

### スタイル属性と CSS クラスの同期

### 属性ベース走査と後方一括処理の仕組み

- **一括特定**: 承認・破棄時にはドキュメントを 1回フル走査し、`data-command-id` が一致する全ノードの位置（`pos`）とタイプを取得する。
- **降順処理**: 収集したターゲットを `pos` の大きい順にソートして処理する。これにより、ノードの削除やスタイルの変更がドキュメント前方の `pos` に影響を与えることを防ぎ、一貫した更新を保証する。
- **snapshot 駆動の復元**: `reject` 時はスナップショットに保存されたオプション（`blockType`, `textAlign`, `spacing`, `indent`）を参照し、エディタの状態を操作前の状態（属性も含めて）に完全にロールバックする。

### 個別承認の仕組み

- **属性付与**: `data-command-type` 等の属性をノードに付与することでCSS（content.css）でのハイライトを実現。
- **承認 (Approve)**:
    - `REPLACE`, `INSERT` 等: ハイライト属性（`data-command-*`）を削除して確定。
    - `DELETE`: `deleteSelection()` により対象段落を物理的に削除。
- **破棄 (Reject)**:
    - `REPLACE`, `MERGE`, `SPLIT` (既存部): 実行前のスナップショットからテキストと属性を復元。
    - `INSERT`, `SPLIT` (新規部), `MOVE` (移動先): スナップショットに存在しないID（新規作成物）を `deleteSelection()` により物理削除。
    - `DELETE`: 属性のみを削除し、段落を存続させることで削除予定を撤回。
    - `MOVE` (移動元): スナップショットに基づき、元の位置に段落を復元。
