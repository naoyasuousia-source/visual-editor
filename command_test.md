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
### 目的
**外部AI向けのコマンドロジックの大改造を行う**
### 要件
- **コマンドの刷新**
コマンドは以下だけに限定する。
***REPLACE_PARAGRAPH***
（ターゲット：各段落に振られたid（例：p2-1））
（オプション：太字タグ、brタグ挿入上付き下付き文字タグは指定可能：挿入テキスト内に直書きさせる）
（オプション：ブロック要素4択、文字揃え3択、段落下余白4択、インデント0～4→引数とする）
- 既存テキストの修正はすべてこれで行う。
- 自動修正後、置き換えられた段落全体を色付けハイライトし、ホバーすると、ポップアップで、変更前と変更後の比較を見ることができ、承諾or破棄を選べる。

***INSERT_PARAGRAPH***
（ターゲット：既存段落のid（例：p2-1））
（オプション：太字タグ、brタグ挿入上付き下付き文字タグは指定可能：挿入テキスト内に直書きさせる）
（オプション：ブロック要素4択、文字揃え3択、段落下余白4択、インデント0～4→引数とする）
- targetの段落の直後に挿入。
- AI側で仮idを発行する。（連続挿入可能にするため）
- 自動修正後、挿入された段落全体を色付けハイライトし、ホバーで承諾or破棄を選べる。

***DELETE_PARAGRAPH***
（ターゲット：各段落に振られたid（例：p2-1））
- targetの段落を削除。
- 自動修正後、削除された段落位置を色付けハイライトし、ホバーで削除段落の内容を見ることができ、承諾or破棄を選べる。

***MOVE_PARAGRAPH***
（ターゲット：移動段落のid、移動先のid）
- targetの段落を移動先のidの直後に移動。
- 自動修正後、移動先で色付けハイライトし、ホバーで承諾or破棄を選べる。

***SPLIT_PARAGRAPH***
（ターゲット：分割したい段落のid、分割位置（テキスト引用で分割位置直前の文字列と分割位置直後の文字列を指定））
- targetの段落を分割位置で分割し、新段落に仮idを振る。
- 自動修正後、分割された段落を色付けハイライトし、ホバーで承諾or破棄を選べる。

***MERGE_PARAGRAPH***
（ターゲット：結合したい段落のid、結合先のid）
- 結合したい段落を結合先のidの直後に結合。
- 自動修正後、結合先で色付けハイライトし、ホバーで承諾or破棄を選べる。

- **承認or破棄ロジックの刷新**
現在は、自動修正後、全体の承認or破棄のみを選択できるが、上で記述したように、部分的に承認or破棄を選択できるようにする。（全体の承認、破棄も引き続き行えるようにし、全体承認、破棄が選択されたら、部分選択されていない段落が残っていても、自動保存後、自動編集フローは終了とする）
### 注意
**ユーザーの指示があるまで、絶対にセクション1,4を編集しないこと**
**rules.mdに従うこと**
**ブラウザを立ち上げての確認はしないこと**

----------------------------------------

## 実装計画

### フェーズ1: 既存コード分析と設計
1. **既存コマンドシステムの把握**
   - `src/v2/services/commandParser.ts` の解析
   - `src/v2/services/commandExecutionService.ts` の解析
   - `src/v2/hooks/useCommandExecutor.ts` の解析
   - `src/v2/hooks/useCommandParser.ts` の解析
   - 現在のコマンドフローとデータ構造の理解

2. **段落ID管理システムの設計**
   - 各段落に一意のID（例：p2-1）を振る仕組みの設計
   - 仮ID発行ロジックの設計（INSERT_PARAGRAPH用）
   - IDの永続化とHTML出力への反映方法の設計

3. **新コマンドの型定義設計**
   - 6つの新コマンドの型定義（CommandType）
   - 各コマンドのオプション構造（太字、br、上付き下付き、ブロック要素4択、文字揃え3択、段落下余白4択、インデント0～4）
   - コマンドパース結果の型定義

### フェーズ2: コマンドパーサーの刷新
4. **commandParser.tsの全面改造**
   - 新コマンド6種のパースロジック実装
   - REPLACE_PARAGRAPHのパース（ターゲットID + オプション）
   - INSERT_PARAGRAPHのパース（ターゲットID + テキスト + オプション）
   - DELETE_PARAGRAPHのパース（ターゲットID）
   - MOVE_PARAGRAPHのパース（移動元ID + 移動先ID）
   - SPLIT_PARAGRAPHのパース（ターゲットID + 分割位置指定文字列）
   - MERGE_PARAGRAPHのパース（結合元ID + 結合先ID）
   - オプションパース処理（太字/br/上付き下付きタグの抽出、ブロック要素・文字揃え・余白・インデントの引数解析）

### フェーズ3: コマンド実行エンジンの実装
5. **commandExecutionService.tsの刷新**
   - REPLACE_PARAGRAPH実行ロジック（指定IDの段落を新テキスト+オプションで置換）
   - INSERT_PARAGRAPH実行ロジック（指定IDの直後に新段落挿入+仮ID発行）
   - DELETE_PARAGRAPH実行ロジック（指定IDの段落削除）
   - MOVE_PARAGRAPH実行ロジック（段落の移動）
   - SPLIT_PARAGRAPH実行ロジック（段落の分割+仮ID発行）
   - MERGE_PARAGRAPH実行ロジック（段落の結合）

6. **段落操作のためのユーティリティ実装**
   - 段落ID検索ユーティリティ
   - 段落挿入ユーティリティ
   - 段落削除ユーティリティ
   - 段落移動ユーティリティ
   - オプション適用ユーティリティ（ブロック要素、文字揃え、余白、インデント）

### フェーズ4: ハイライトと承認/破棄UIの実装
7. **変更ハイライトシステムの実装**
   - 変更された段落を色付けハイライトする仕組み（React State管理）
   - 変更種別ごとのハイライト色の定義（REPLACE/INSERT/DELETE/MOVE/SPLIT/MERGE）
   - ハイライト状態の保持（どの段落がどのコマンドで変更されたか）

8. **ホバーポップアップUIの実装**
   - REPLACE_PARAGRAPH用ポップアップ（変更前/変更後の比較表示 + 承諾/破棄ボタン）
   - INSERT_PARAGRAPH用ポップアップ（挿入内容表示 + 承諾/破棄ボタン）
   - DELETE_PARAGRAPH用ポップアップ（削除内容表示 + 承諾/破棄ボタン）
   - MOVE_PARAGRAPH用ポップアップ（移動元情報 + 承諾/破棄ボタン）
   - SPLIT_PARAGRAPH用ポップアップ（分割結果 + 承諾/破棄ボタン）
   - MERGE_PARAGRAPH用ポップアップ（結合結果 + 承諾/破棄ボタン）

9. **部分承認/破棄ロジックの実装**
   - 個別段落の承諾処理（ハイライト解除 + 変更確定）
   - 個別段落の破棄処理（元の状態に復元 + ハイライト解除）
   - 全体承諾ボタン（全ての未承諾変更を一括承諾）
   - 全体破棄ボタン（全ての未承諾変更を一括破棄）
   - 承諾/破棄後の自動保存トリガー

### フェーズ5: 統合とテスト準備
10. **既存フローとの統合**
    - useCommandExecutor.tsの更新（新ロジックへの対応）
    - useCommandParser.tsの更新（新パーサーへの対応）
    - 自動編集フロー全体の調整
    - エラーハンドリングの強化

11. **テスト用コマンドサンプルの準備**
    - 各コマンドの動作確認用HTMLサンプル作成
    - コマンドエリアへのサンプルコマンド記述
    - 段落ID付与のためのHTMLテンプレート準備


----------------------------------------
# 以下、AIが自動的に更新する部分
----------------------------------------
## 1. 未解決要件

### 1.1 段落ID管理システムの実装
- 各段落に一意のID（例：p2-1形式）を自動付与する仕組み
- 仮ID発行ロジック（INSERT_PARAGRAPH用）
- IDの永続化とHTML出力への反映
- ページ番号と段落番号の組み合わせによるID生成ルール

### 1.2 新コマンドパーサーの実装
- **REPLACE_PARAGRAPH**: ターゲットID + テキスト + オプション（太字/br/上付き下付きタグ、ブロック要素4択、文字揃え3択、段落下余白4択、インデント0～4）のパース
- **INSERT_PARAGRAPH**: ターゲットID + テキスト + オプション（同上）のパース、仮ID発行対応
- **DELETE_PARAGRAPH**: ターゲットIDのパース
- **MOVE_PARAGRAPH**: 移動元ID + 移動先IDのパース
- **SPLIT_PARAGRAPH**: ターゲットID + 分割位置（前後文字列引用）のパース
- **MERGE_PARAGRAPH**: 結合元ID + 結合先IDのパース
- オプション引数の詳細パース（HTMLタグ、スタイル設定値の抽出）

### 1.3 新コマンド実行エンジンの実装
- REPLACE_PARAGRAPH実行: 指定IDの段落を新テキスト+オプションで置換
- INSERT_PARAGRAPH実行: 指定IDの直後に新段落挿入+仮ID発行
- DELETE_PARAGRAPH実行: 指定IDの段落削除+削除内容保持
- MOVE_PARAGRAPH実行: 段落のDOM操作による移動
- SPLIT_PARAGRAPH実行: 段落の分割+仮ID発行
- MERGE_PARAGRAPH実行: 段落の結合
- 各実行結果の変更履歴保持（承認/破棄用）

### 1.4 ハイライトシステムの実装
- 変更された段落の色付けハイライト（React State管理）
- 変更種別ごとのハイライト色定義（REPLACE/INSERT/DELETE/MOVE/SPLIT/MERGE）
- ハイライト状態の永続化（どの段落がどのコマンドで変更されたか）
- エディタ内でのハイライトレンダリング

### 1.5 部分承認/破棄UIの実装
- ホバーポップアップコンポーネント（6種類のコマンドに対応）
- REPLACE用: 変更前/変更後の比較表示 + 承諾/破棄ボタン
- INSERT用: 挿入内容表示 + 承諾/破棄ボタン
- DELETE用: 削除内容表示 + 承諾/破棄ボタン
- MOVE用: 移動元情報 + 承諾/破棄ボタン
- SPLIT用: 分割結果 + 承諾/破棄ボタン
- MERGE用: 結合結果 + 承諾/破棄ボタン
- 個別承諾/破棄処理の実装
- 全体承諾/全体破棄ボタンの実装
- 承諾/破棄後の自動保存フロー

## 2. 未解決要件に関するコード変更履歴

### 2025-12-30 フェーズ1: 既存コード分析と設計（進行中）

#### 作成ファイル1: `src/v2/types/command.ts`
**分析結果:**
- 既存の`ai-sync.types.ts`は段落番号ベースのコマンドシステムを使用
- 新要件では段落IDベース（p2-1形式）のコマンドシステムが必要
- 6つの新コマンド（REPLACE_PARAGRAPH, INSERT_PARAGRAPH, DELETE_PARAGRAPH, MOVE_PARAGRAPH, SPLIT_PARAGRAPH, MERGE_PARAGRAPH）の型定義が必要

**方針:**
- 既存の型定義とは別に新しい`command.ts`ファイルを作成
- 段落ID（正式ID: p2-1、仮ID: temp-uuid）をサポート
- ハイライト状態と承認/破棄処理のための型を追加

**変更内容:**
- `CommandType`: 6種類の段落コマンドを定義
- `ParagraphOptions`: ブロック要素4択、文字揃え3択、段落下余白4択、インデント0～4を定義
- 各コマンドインターフェース: ReplaceParagraphCommand, InsertParagraphCommand, DeleteParagraphCommand, MoveParagraphCommand, SplitParagraphCommand, MergeParagraphCommand
- `ParagraphSnapshot`: 承認/破棄用の段落スナップショット
- `HighlightState`: ハイライト管理用の状態
- `CommandExecutionResult`: コマンド実行結果
- `ApprovalResult`: 承認/破棄結果

#### 作成ファイル2: `src/v2/utils/paragraphIdManager.ts`
**分析結果:**
- 段落IDの生成と管理を一元化する必要がある
- 正式ID（p{page}-{num}）と仮ID（temp-{uuid}）の2種類をサポート
- IDの検証、変換、ソート機能が必要

**方針:**
- 段落ID関連の全ユーティリティ関数を集約
- 型安全性を保証するための検証関数を提供
- 仮IDから正式IDへの昇格機能を実装

**変更内容:**
- `generateParagraphId()`: 正式ID生成
- `generateTempId()`: 仮ID生成（uuidを使用）
- `isOfficialId()`, `isTempId()`, `isValidParagraphId()`: ID検証
- `extractPageNumber()`, `extractParagraphNumber()`: ID解析
- `promoteTempId()`: 仮ID→正式ID変換
- `sortParagraphIds()`: ID配列のソート
- `filterTempIds()`, `filterOfficialIds()`: IDフィルタリング

#### 作成ファイル3: `src/v2/utils/paragraphOperations.ts`
**分析結果:**
- Tiptapエディタでの段落検索と操作には専用ユーティリティが必要
- ProseMirrorのデータ構造を直接操作する必要がある
- HTMLタグ（<b>、<br>、<sup>、<sub>）をパースしてTiptapノードに変換する機能が必要

**方針:**
- エディタに依存する段落操作を集約
- スナップショット取得機能で承認/破棄をサポート
- HTMLテキストのパース機能を実装

**変更内容:**
- `findParagraphById()`: 段落IDで段落ノードを検索
- `captureParagraphSnapshot()`: 単一段落のスナップショット取得
- `captureMultipleSnapshots()`: 複数段落のスナップショット一括取得
- `applyParagraphOptions()`: 段落オプションの適用
- `parseHtmlText()`: HTMLタグを含むテキストをTiptapノード用にパース
- `assignIdsToAllParagraphs()`: 全段落への自動ID付与
- `paragraphExists()`: 段落存在確認
- `getParagraphIdAtPosition()`: 位置から段落ID取得

#### 作成ファイル4: `src/v2/utils/newCommandParser.ts`
**分析結果:**
- 既存の`commandParser.ts`は旧コマンドシステム用
- 新コマンドシステムには6種類の段落ベースコマンドのパーサーが必要
- オプション文字列（key=value形式）のパース機能が必要

**方針:**
- 既存パーサーとは別に新しいパーサーファイルを作成
- 各コマンドタイプごとに専用のパース関数を実装
- 段落ID検証とエラーハンドリングを強化

**変更内容:**
- `extractArguments()`: カッコ内の引数を抽出
- `parseOptions()`: オプション文字列（key=value形式）をParagraphOptionsに変換
- `parseReplaceParagraph()`: REPLACE_PARAGRAPHのパース
- `parseInsertParagraph()`: INSERT_PARAGRAPHのパース（仮ID自動生成）
- `parseDeleteParagraph()`: DELETE_PARAGRAPHのパース
- `parseMoveParagraph()`: MOVE_PARAGRAPHのパース
- `parseSplitParagraph()`: SPLIT_PARAGRAPHのパース（仮ID自動生成）
- `parseMergeParagraph()`: MERGE_PARAGRAPHのパース
- `parseSingleCommand()`: 単一コマンドのディスパッチ
- `parseNewCommands()`: 複数コマンドの一括パース

#### 作成ファイル5: `src/v2/services/newCommandExecutionService.ts`
**分析結果:**
- 既存の`commandExecutionService.ts`は旧コマンドシステム用
- 新コマンドシステムには段落操作（置換、挿入、削除、移動、分割、結合）の実行ロジックが必要
- 実行前スナップショット取得と、data属性によるハイライトマークが必要

**方針:**
- 既存サービスとは別に新しいサービスファイルを作成
- 各コマンドタイプごとに専用の実行関数を実装
- ProseMirror Transactionを使った段落操作
- DELETE_PARAGRAPHは実際には削除せず、削除マークのみ付与（承認時に実削除）

**変更内容:**
- `executeReplaceParagraph()`: 段落内容の置換（スナップショット取得、HTMLパース、オプション適用）
- `executeInsertParagraph()`: 新段落の挿入（ターゲット直後に挿入、仮ID付与）
- `executeDeleteParagraph()`: 削除マーク付与（data-command-type='delete'）
- `executeMoveParagraph()`: 段落の移動（削除→挿入）
- `executeSplitParagraph()`: 段落の分割（分割位置検出、2つの段落に分割）
- `executeMergeParagraph()`: 段落の結合（テキスト結合、結合元削除）
- `executeNewCommand()`: コマンド実行のディスパッチ
- `executeNewCommands()`: 複数コマンドの順次実行

### 2025-12-30 フェーズ4～5: エディタ統合とテスト準備（完了）

#### 作成ファイル6: `src/v2/lib/paragraphCommandAttributes.ts`
**分析結果:**
- Tiptapの段落ノードに新コマンドシステム用のカスタム属性を追加する必要がある
- data-temp-id, data-command-type, data-command-id等のハイライト用属性が必要
- blockType, spacing, indent等の段落オプション用属性が必要

**方針:**
- Tiptap Extensionとして段落・見出しノードにカスタム属性を追加
- 既存のParagraphNumbering拡張と共存できる設計
- keepOnSplitフラグを適切に設定（コマンド関連属性はfalse、オプション属性はtrue）

**変更内容:**
- GlobalAttributesを使用して段落・見出しノードに属性を追加
- `data-temp-id`: 仮ID属性
- `data-command-type`: コマンドタイプ属性（ハイライト用）
- `data-command-id`: コマンドID属性（ハイライト管理用）
- `data-move-from`: 移動元位置属性
- `blockType`: ブロック要素タイプ（p, h1, h2, h3）
- `spacing`: 段落下余白（none, small, medium, large）
- `indent`: インデントレベル（0～4）

#### 修正ファイル1: `src/v2/hooks/useTiptapEditor.ts`
**変更内容:**
- `ParagraphCommandAttributes`拡張をインポート
- extensionsリストに`ParagraphCommandAttributes`を追加

#### 作成ファイル7: `src/v2/hooks/useNewCommandExecutor.ts`
**分析結果:**
- 新コマンド実行サービスをReactフックとしてラップする必要がある
- エディタの初期化状態チェックとエラーハンドリングが必要
- 単一コマンドと複数コマンドの両方をサポート

**方針:**
- useCallbackを使用してメモ化された実行関数を提供
- エラーハンドリングとログ出力を統合
- CommandExecutionResultを返す型安全な設計

**変更内容:**
- `executeSingleCommand()`: 単一コマンド実行
- `executeMultipleCommands()`: 複数コマンド順次実行
- エディタ未初期化チェック
- try-catchによる例外ハンドリング

#### 作成ファイル8: `src/v2/hooks/useNewCommandParser.ts`
**分析結果:**
- 新コマンドパーサーをReactフックとしてラップする必要がある
- コマンドテキストの前処理（空行除外、コメント除外）が必要
- コマンド存在チェック機能が必要

**方針:**
- useCallbackを使用してメモ化されたパース関数を提供
- パース結果をステートとして保持
- 複数の入力形式をサポート（配列、単一文字列、複数行テキスト）

**変更内容:**
- `parseCommands()`: コマンド文字列配列のパース
- `parseSingleCommand()`: 単一コマンド文字列のパース
- `parseCommandText()`: 複数行テキストのパース
- `hasCommands()`: コマンド存在チェック
- `lastParseResult`: 最後のパース結果を保持

#### 作成ファイル9: `test-new-commands.html`
**分析結果:**
- 新コマンドシステムの動作確認用テストファイルが必要
- 6種類すべてのコマンドを含むサンプルが必要
- 段落IDが正しく設定されたHTMLが必要

**方針:**
- 3ページ構成のテストドキュメント
- 各ページに複数の段落を配置
- コマンドエリアに6種類のコマンドサンプルを記述

**変更内容:**
- ページ1: REPLACE_PARAGRAPH, INSERT_PARAGRAPH用の段落
- ページ2: DELETE_PARAGRAPH, MOVE_PARAGRAPH, SPLIT_PARAGRAPH用の段落
- ページ3: MERGE_PARAGRAPH用の段落
- コマンドエリア: 6種類のコマンドサンプル（オプション引数含む）

### 2025-12-30 既存フローとの統合（完了）

#### 修正ファイル2: `src/v2/hooks/useCommandParser.ts`
**分析結果:**
- 既存のuseCommandParserは旧コマンドシステム用
- 新旧両方のコマンドシステムを共存させる必要がある
- 後方互換性を保ちつつ新機能を追加

**方針:**
- 旧コマンドパース機能は`parseFromHtml`として保持（後方互換性）
- 新コマンドパース機能を`parseNewCommandsFromHtml`として追加
- 新コマンド検出機能を`hasNewCommands`として追加
- 両方のParseResult型を使い分け

**変更内容:**
- インポート追加: `parseNewCommands`、新旧ParseResult型
- `parseFromHtml`: 旧コマンドパース（既存機能維持）
- `parseNewCommandsFromHtml`: 新コマンドパース（新規）
- `hasCommands`: 旧・新両対応のコマンド存在チェック
- `hasNewCommands`: 新コマンド専用の存在チェック（正規表現パターンマッチング）

#### 修正ファイル3: `src/v2/hooks/useCommandExecutor.ts`
**分析結果:**
- 既存のuseCommandExecutorは旧コマンドシステム用
- 新旧両方のコマンド実行機能を提供する必要がある
- エラーハンドリングとログ出力を強化

**方針:**
- 旧コマンド実行機能は`executeCommand`, `executeCommands`として保持
- 新コマンド実行機能を`executeNewCommand`, `executeNewCommands`として追加
- 新コマンド実行時のtry-catchによる堅牢なエラーハンドリング
- 両方のExecutionResult型を使い分け

**変更内容:**
- インポート追加: `executeNewCommand`, `executeNewCommands`、新旧Command/ExecutionResult型
- `executeCommand`: 旧コマンド実行（既存機能維持）
- `executeCommands`: 複数旧コマンド実行（既存機能維持）
- `executeSingleNewCommand`: 新コマンド実行（新規）
- `executeMultipleNewCommands`: 複数新コマンド実行（新規）
- エディタ未初期化チェックの強化
- 例外キャッチとエラーログ出力

### 2025-12-30 ハイライトシステム実装（完了）

#### 作成ファイル10: `src/v2/store/useCommandHighlightStore.ts`
**分析結果:**
- ハイライト状態をグローバルに管理する必要がある
- 複数のコンポーネントから参照・更新される可能性がある
- 承認/破棄状態の管理が必要

**方針:**
- Zustandを使用してグローバルストアとして実装
- Map<commandId, HighlightState>でハイライトを管理
- 承認/破棄のマーク機能と一括処理機能を提供

**変更内容:**
- `highlights: Map<string, HighlightState>`: ハイライトマップ
- `addHighlight()`: ハイライト追加
- `removeHighlight()`: ハイライト削除
- `getAllHighlights()`, `getHighlight()`: ハイライト取得
- `markAsApproved()`, `markAsRejected()`: 個別マーク
- `approveAll()`, `rejectAll()`: 一括マーク
- `clearAll()`: 全削除
- `getPendingCount()`: 未処理数取得

#### 作成ファイル11: `src/v2/hooks/useCommandHighlight.ts`
**分析結果:**
- コマンド実行結果をハイライトとして登録する処理が必要
- 承認時のdata属性削除処理が必要
- 破棄時の段落復元処理が必要

**方針:**
- ストアとエディタを橋渡しするフック
- CommandExecutionResultからHighlightStateへの変換
- 承認/破棄時のエディタ操作を実装

**変更内容:**
- `createHighlightFromResult()`: 実行結果→ハイライト変換
- `registerHighlight()`: 単一ハイライト登録
- `registerMultipleHighlights()`: 複数ハイライト一括登録
- `approveHighlight()`: ハイライト承認（data属性削除）
- `rejectHighlight()`: ハイライト破棄（段落復元）
- `approveAllHighlights()`: 全承認
- `rejectAllHighlights()`: 全破棄
- エディタのdescendantsを使った段落検索と更新

#### 修正ファイル4: `src/v2/styles/content.css`
**分析結果:**
- data-command-type属性に基づくCSSハイライトが必要
- 6種類のコマンドタイプごとに異なる視覚的表現が必要
- ホバー時の強調表示が必要

**方針:**
- 各コマンドタイプに固有の色を割り当て
- background-colorとborder-leftで視覚的に区別
- DELETE_PARAGRAPHは薄く表示+取り消し線

**変更内容:**
- REPLACE_PARAGRAPH: 青色ハイライト（rgba(59, 130, 246, 0.2)）
- INSERT_PARAGRAPH: 緑色ハイライト（rgba(34, 197, 94, 0.2)）
- DELETE_PARAGRAPH: 赤色ハイライト + opacity 0.5 + 取り消し線
- MOVE_PARAGRAPH: 紫色ハイライト（rgba(168, 85, 247, 0.2)）
- SPLIT_PARAGRAPH: オレンジ色ハイライト（rgba(249, 115, 22, 0.2)）
- MERGE_PARAGRAPH: 青緑色ハイライト（rgba(20, 184, 166, 0.2)）
- ホバー時の濃度強化（0.2 → 0.3）
- カーソルポインター追加

### 2025-12-30 部分承認/破棄UI実装（完了）

#### 作成ファイル12: `src/v2/components/CommandPopup.tsx`
**分析結果:**
- ハイライトされた段落にホバーした際に表示されるポップアップが必要
- 6種類のコマンドタイプごとに異なる表示内容が必要
- 承諾/破棄ボタンとコンテンツ表示を統合

**方針:**
- Reactコンポーネントとして実装
- コマンドタイプに応じた表示内容を動的生成
- ポップアップ位置を自動計算（画面外に出ないように調整）
- 外側クリックで閉じる機能

**変更内容:**
- `getCommandDisplayInfo()`: コマンドタイプ別の表示情報生成
- REPLACE_PARAGRAPH: 変更前/変更後の比較表示
- INSERT_PARAGRAPH: 挿入内容表示
- DELETE_PARAGRAPH: 削除予定内容表示（取り消し線付き）
- MOVE_PARAGRAPH: 移動元→移動先表示
- SPLIT_PARAGRAPH: 分割結果（前半/後半）表示
- MERGE_PARAGRAPH: 結合前/結合後表示
- 位置計算ロジック（画面右端・下端チェック）
- 承諾/破棄ボタン（緑/赤）
- 外側クリックリスナー

#### 作成ファイル13: `src/v2/components/CommandApprovalBar.tsx`
**分析結果:**
- 画面下部に固定表示される承認バーが必要
- 未処理コマンド数の表示が必要
- 全体承諾/全体破棄ボタンが必要

**方針:**
- 画面下部固定（z-index: 9998）
- グラデーション背景で視覚的に目立たせる
- アニメーション付きスライドイン
- 進捗インジケーター表示

**変更内容:**
- `pendingCount`に基づく動的表示
- グラデーション背景（青→紫）
- アイコン付き情報表示
- 全体承諾ボタン（緑、ホバー時スケール）
- 全体破棄ボタン（赤、ホバー時スケール）
- 閉じるボタン
- 進捗インジケーターバー（白/20%透明度）
- Tailwindアニメーション（slide-in-from-bottom）

#### 作成ファイル14: `src/v2/hooks/useCommandApprovalController.ts`
**分析結果:**
- ポップアップと承認バーの表示タイミングを管理するコントローラーが必要
- ハイライトされた段落のホバーイベントを検知する必要がある
- 承認/破棄アクションとUI更新を統合する必要がある

**方針:**
- カスタムフックとして実装
- エディタのDOMイベントリスナーで段落ホバーを検知
- 500msの遅延後にポップアップ表示（意図しない表示を防ぐ）
- 承認バーは未処理数に応じて自動表示/非表示

**変更内容:**
- `activePopup`: 現在表示中のポップアップ状態
- `showApprovalBar`: 承認バー表示フラグ
- マウスイベントリスナー（mouseenter/mouseleave）
- ホバー検知→ポップアップ表示（500ms遅延）
- `handleApprove()`, `handleReject()`: 個別承認/破棄ハンドラー
- `handleApproveAll()`, `handleRejectAll()`: 全体承認/破棄ハンドラー
- `closePopup()`, `closeApprovalBar()`: UI閉じる処理
- `pendingCount`の自動監視と承認バー表示制御

### 2025-12-30 ファイル監視フロー統合とUIコンポーネント組み込み（完了）

#### 修正ファイル5: `src/v2/hooks/useAutoEdit.ts`
**分析結果:**
- 既存の自動編集フローは旧コマンドシステム専用
- 新コマンドシステムの検出と実行フローを統合する必要がある
- 新コマンドシステムではハイライト登録が必要

**方針:**
- `hasNewCommands()`で新旧コマンドを判定
- 新コマンド検出時は`parseNewCommandsFromHtml()`と`executeNewCommands()`を使用
- 新コマンド実行後は`registerMultipleHighlights()`でハイライト登録
- 旧コマンドの処理は既存のまま維持（後方互換性）

**変更内容:**
- インポート追加: `useCommandHighlight`
- `commandHighlight`変数追加
- `handleFileChange`関数内で新旧コマンドを分岐処理:
  - `hasNewCommands()`で判定
  - 新コマンド時: `parseNewCommandsFromHtml()` → `executeNewCommands()` → `registerMultipleHighlights()`
  - 旧コマンド時: 従来通りの処理フロー
- 新コマンド実行後はエディタを編集可能にする（個別承認UI使用のため）
- 旧コマンド実行後は従来通り承認待ち状態にする
- 依存配列に`commandHighlight`追加

#### 修正ファイル6: `src/v2/app/App.tsx`
**分析結果:**
- メインのEditorV3コンポーネントにUIコンポーネントを組み込む必要がある
- useCommandApprovalControllerでポップアップと承認バーを制御
- 条件付きレンダリングで適切なタイミングで表示

**方針:**
- CommandPopup, CommandApprovalBar, useCommandApprovalControllerをインポート
- EditorV3関数内でuseCommandApprovalController()を呼び出し
- return部分で条件付きレンダリング

**変更内容:**
- インポート追加: `CommandPopup`, `CommandApprovalBar`, `useCommandApprovalController`
- `approvalController`変数追加（コントローラーフック呼び出し）
- レンダリング部分にCommandPopupを追加:
  - `activePopup`が存在する場合のみ表示
  - highlight, targetElement, ハンドラーをpropsとして渡す
- レンダリング部分にCommandApprovalBarを追加:
  - `showApprovalBar`かつ`pendingCount > 0`の場合のみ表示
  - pendingCount, ハンドラーをpropsとして渡す
- EditorLockOverlayの後、Toasterの前に配置

## 3. 分析中に気づいた重要ポイント

### 段落ID管理の課題
- Tiptapエディタの段落ノードに自動的にIDを付与する仕組みが必要
- ID形式はページ番号-段落番号（例：p2-1）とする
- ページ分割時のID再計算ロジックが必要
- 仮ID（INSERT_PARAGRAPH用）と正式IDの区別と昇格ロジックが必要

### コマンドパーサーの設計上の注意点
- HTMLタグ（<b>、<br>、<sup>、<sub>）をテキスト内に直書きする形式を想定
- オプション引数は構造化された形式（JSON風またはキー=値形式）でパース
- ブロック要素4択: p（通常段落）、h1、h2、h3を想定
- 文字揃え3択: left、center、rightを想定
- 段落下余白4択: 具体的な値は既存のスタイル設定を参照
- インデント0～4: 0が左揃え、1～4が段階的なインデント

### コマンド実行時の状態管理
- 各コマンド実行前の状態をスナップショット保存（破棄時の復元用）
- 複数コマンドの連続実行時の依存関係（仮IDの解決など）
- Tiptap Transactionを使った段落操作の実装

### ハイライトとUIの統合
- ハイライトはTiptapのDecorationではなく、段落ノード自体にマーク（data属性）を付与
- React StateとTiptapエディタ状態の同期が重要
- ホバーポップアップの位置計算とZ-index管理

### 既存の自動編集フローとの互換性
- 現在の全体承諾/破棄フローを拡張する形で部分承諾/破棄を追加
- `useCommandExecutor.ts`と`useCommandParser.ts`の大幅な改造が必要
- `commandExecutionService.ts`と`commandParser.ts`の完全な書き換えが必要

### フェーズ1実装時の技術的課題

#### UUID依存関係
- 仮ID生成に`uuid`パッケージ（v4）が必要
- package.jsonへの追加が必要: `npm install uuid @types/uuid`

#### Tiptap段落ノードの属性拡張
- 段落ノードにid属性とdata-temp-id属性を追加する必要がある
- Tiptap Extensionで段落ノードのスキーマを拡張する必要がある
- カスタム属性: `id`, `data-temp-id`, `blockType`, `textAlign`, `spacing`, `indent`

#### HTMLパーサーの制約
- `parseHtmlText()`は簡易的な実装（正規表現ベース）
- ネストされたタグには対応していない（例: `<b><sup>text</sup></b>`）
- より堅牢なパーサーが必要になる可能性がある

#### ProseMirrorのTransaction理解が必要
- 段落操作にはProseMirrorのTransac tionの深い理解が必要
- ノードの挿入・削除・移動は位置計算が複雑
- エディタの状態管理とトランザクションの同期が重要

### 統合作業時の発見事項

#### Tiptap Extension の共存
- 既存のParagraphNumbering拡張がid属性とdata-para属性を管理
- 新しいParagraphCommandAttributes拡張と問題なく共存
- GlobalAttributesを使用することで複数の拡張から同じノードタイプに属性を追加可能

#### keepOnSplitフラグの重要性
- コマンド関連属性（data-command-type等）はkeepOnSplit: false
  → 段落分割時に新しい段落には引き継がれない
- オプション属性（blockType, spacing等）はkeepOnSplit: true
  → 段落分割時に新しい段落にも引き継がれる

#### HTMLパースとTiptapノード変換
- parseHtmlText()は簡易的な正規表現ベース
- Tiptapのcontent配列形式に変換する必要がある
- マークの順序とネストに注意が必要

#### 位置計算の複雑性
- ProseMirrorの位置は文字位置ではなくノード間の位置
- ノードのnodeSizeを考慮する必要がある
- 削除・挿入後は位置が変動するため、複数操作時は注意が必要

#### テスト環境の課題
- 既存のuseCommandExecutor/useCommandParserとの統合はまだ未実装
- 実際のファイル監視フローとの統合が必要
- ハイライトUIと承認/破棄UIはまだ実装されていない

## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成

### コマンド処理関連
- `src/v2/utils/commandParser.ts` - コマンド文字列のパース処理（**要全面改造**）
- `src/v2/utils/commandValidator.ts` - コマンドのバリデーション
- `src/v2/services/commandExecutionService.ts` - コマンド実行サービス（**要全面改造**）

### フック
- `src/v2/hooks/useCommandParser.ts` - コマンドパース用フック（**要大幅修正**）
- `src/v2/hooks/useCommandExecutor.ts` - コマンド実行用フック（**要大幅修正**）

### 新規作成が必要なファイル
- `src/v2/utils/paragraphIdManager.ts` - 段落ID管理ユーティリティ（**新規**）
- `src/v2/utils/paragraphOperations.ts` - 段落操作ユーティリティ（**新規**）
- `src/v2/components/CommandHighlight.tsx` - ハイライト表示コンポーネント（**新規**）
- `src/v2/components/CommandPopup.tsx` - ホバーポップアップコンポーネント（**新規**）
- `src/v2/hooks/useCommandHighlight.ts` - ハイライト管理フック（**新規**）
- `src/v2/hooks/useCommandApproval.ts` - 承認/破棄ロジックフック（**新規**）
- `src/v2/types/command.ts` - 新コマンド型定義（**新規または大幅拡張**）

### 既存ファイルで修正が必要な可能性があるもの
- `src/v2/hooks/useTiptapEditor.ts` - 段落ID自動付与のためのエディタ拡張
- `src/v2/store/useAppStore.ts` - コマンド実行状態管理
- `src/v2/components/Editor.tsx` - ハイライトとポップアップの統合

## 6. 要件に関連する技術スタック

### コア技術
- **Tiptap**: リッチテキストエディタフレームワーク（段落操作、Transaction、Decoration管理）
- **ProseMirror**: Tiptapの基盤（Node、Schema、Transform APIを直接使用する可能性）
- **React**: UIコンポーネント（ハイライト、ポップアップ）
- **TypeScript**: 型安全なコマンド定義とパース処理

### 状態管理
- **Zustand**: グローバル状態管理（`useAppStore.ts`）- コマンド実行状態、ハイライト状態を管理
- **React Hooks**: ローカル状態管理（ポップアップ表示状態など）

### スタイリング
- **Tailwind CSS**: ハイライト色、ポップアップスタイル
- **CSS Variables**: 動的なハイライト色管理

### データ構造
- **段落ID形式**: `p{ページ番号}-{段落番号}` （例: p2-1）または仮ID: `temp-{uuid}`
- **コマンド形式**: 構造化テキスト（詳細フォーマットは設計時に確定）
- **変更履歴**: 各コマンド実行前後のスナップショット保持

### DOM操作
- Tiptap Commandsを使った段落の挿入・削除・移動
- ProseMirror Transactionによる原子的な変更適用
- data属性によるハイライト状態のマーキング

## 7. 要件に関する機能の動作原理

### 全体フロー
1. **ファイル保存検知** → `useFileSystemWatcher.ts`がファイル変更を検知
2. **コマンドエリア抽出** → `htmlCommentParser.ts`が`<!-- AI_COMMAND_START -->`～`<!-- AI_COMMAND_END -->`を抽出
3. **コマンドパース** → `commandParser.ts`がコマンド文字列を解析し、コマンドオブジェクト配列を生成
4. **コマンド実行** → `commandExecutionService.ts`が各コマンドを順次実行
5. **ハイライト適用** → 変更された段落にハイライトマークを付与
6. **ユーザー操作待ち** → ホバーで変更内容確認、個別または全体で承諾/破棄
7. **確定処理** → 承諾された変更を確定、破棄された変更を復元
8. **自動保存** → 確定後のHTML出力と保存

### 段落ID管理の動作原理
- **初期付与**: エディタ起動時、既存段落にIDが無い場合は自動付与
- **新規段落作成時**: ユーザーがEnterで段落作成時にIDを自動付与
- **ページ分割時**: ページ境界を超えた際にID再計算（ページ番号の更新）
- **仮ID**: INSERT_PARAGRAPHで挿入された段落には`temp-{uuid}`形式のIDを付与
- **ID昇格**: 承諾時に仮IDを正式ID（p{page}-{num}）に変換

### コマンド実行の動作原理
#### REPLACE_PARAGRAPH
1. ターゲットIDで段落ノードを検索
2. 実行前の段落内容をスナップショット保存
3. 新テキスト+オプションでノード内容を置換（Tiptap Command使用）
4. 段落に`data-command-type="replace"`と`data-command-id="{uuid}"`を付与
5. ハイライト状態に登録

#### INSERT_PARAGRAPH
1. ターゲットIDで挿入位置を特定
2. 仮ID（temp-{uuid}）を生成
3. 新段落ノードを作成（テキスト+オプション適用）
4. ターゲット段落の直後に挿入（Tiptap Transaction使用）
5. `data-command-type="insert"`と`data-temp-id="{temp-id}"`を付与
6. ハイライト状態に登録

#### DELETE_PARAGRAPH
1. ターゲットIDで段落ノードを検索
2. 段落内容をスナップショット保存（復元用）
3. 段落を削除せず、`data-command-type="delete"`マークのみ付与（視覚的には薄く表示）
4. ハイライト状態に登録（削除予定として）

#### MOVE_PARAGRAPH
1. 移動元IDと移動先IDで両段落を検索
2. 移動元段落のスナップショット保存
3. 移動元段落を削除し、移動先の直後に挿入
4. `data-command-type="move"`と移動元情報を付与
5. ハイライト状態に登録

#### SPLIT_PARAGRAPH
1. ターゲットIDで段落を検索
2. 分割位置文字列で分割ポイントを特定
3. 段落を2つに分割（前半は既存ID、後半は仮ID）
4. 両段落に`data-command-type="split"`を付与
5. ハイライト状態に登録

#### MERGE_PARAGRAPH
1. 結合元IDと結合先IDで両段落を検索
2. 両段落のスナップショット保存
3. 結合元の内容を結合先に追加し、結合元を削除
4. 結合先に`data-command-type="merge"`を付与
5. ハイライト状態に登録

### ハイライトとポップアップの動作原理
- **ハイライト表示**: `data-command-type`属性に基づいてCSS（Tailwind）で色付け
- **ホバー検知**: マウスホバーイベントでポップアップ表示
- **ポップアップ内容**:
  - REPLACE: 変更前テキスト vs 変更後テキスト
  - INSERT: 挿入されたテキスト
  - DELETE: 削除予定のテキスト
  - MOVE: 移動元の位置情報
  - SPLIT: 分割された2つの段落プレビュー
  - MERGE: 結合後のテキストプレビュー
- **承諾**: ハイライトとdata属性を削除、スナップショットを破棄、変更を確定
- **破棄**: スナップショットから段落を復元、ハイライトとdata属性を削除

### 全体承諾/破棄の動作原理
- **全体承諾**: 全てのハイライト段落に対して個別承諾処理を一括実行
- **全体破棄**: 全てのハイライト段落に対して個別破棄処理を一括実行
- **自動保存トリガー**: 全体承諾/破棄後、またはすべての部分承諾/破棄完了後に自動保存を実行

