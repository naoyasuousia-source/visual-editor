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
# 以下、AIが自動的に更新する部分
----------------------------------------
## 1. 未解決要件
・test-commands-comprehensive.txt.のテストセット1をコマンドエリアに入れても、有効コマンドとして処理されず、保護上書きが発動してしまう。（その後コンソールには何も表示されていない）→**同じ状態のまま**

## 2. 未解決要件に関するコード変更履歴

### 重要な技術的発見事項

#### 段落ID管理
- 段落ID形式: Paginatedモードは`p{page}-{paragraph}` (例: p1-2)、Wordモードは`p{number}` (例: p5)
- 仮ID形式: `temp-{uuid}` - INSERT/SPLIT実行時に自動生成
- Tiptap Extensionで`id`と`data-temp-id`属性をサポート

#### HTMLコメントパース
- コマンドエリアマーカー: `<!-- AI_COMMAND_START -->` ~ `<!-- AI_COMMAND_END -->`
- **重要**: 各コマンドは`<!-- COMMAND_NAME(...) -->`の形式で記述必須
- HTMLコメントで囲まないとパーサーが認識しない

#### 引数パースの落とし穴
- `extractArguments()`は当初カッコ内全体を1要素として扱っていた
- **修正**: カンマで分割し、3番目以降をオプションとして再結合
- カンマ区切りの正しい処理が必須

#### Tiptap Extension共存
- ParagraphNumbering (既存) とParagraphCommandAttributes (新規) が共存
- GlobalAttributesを使用して複数拡張から同じノードに属性追加可能
- `keepOnSplit`フラグの設定が重要:
  - コマンド属性 (data-command-type等): `false`
  - オプション属性 (blockType, spacing等): `true`

### 最終修正履歴（デバッグ用）

#### 修正1: HTMLコメントパーサー
**ファイル**: `src/v2/utils/htmlCommentParser.ts`
**問題**: 旧コマンド形式`/^[A-Z_]+\[/`のパターンマッチで新コマンドを除外
**修正**: 新コマンド専用パターン`/^(REPLACE_PARAGRAPH|INSERT_PARAGRAPH|...)\s*\(/`に変更

#### 修正2: newCommandParser引数抽出
**ファイル**: `src/v2/utils/newCommandParser.ts`
**問題**: `extractArguments()`がカッコ内全体を1要素配列として返していた
**修正**:
```typescript
// カッコ内を取得後、カンマで分割
const argsStr = match[1];
const args = argsStr.split(',').map(arg => arg.trim());
```

#### 修正3: オプション引数の再結合
**ファイル**: `src/v2/utils/newCommandParser.ts` (parseReplaceParagraph, parseInsertParagraph)
**問題**: `[targetId, text, optionsStr]`の分割代入で3つ目以降のオプションが失われる
**修正**:
```typescript
const optionsStr = args.length > 2 ? args.slice(2).join(', ') : undefined;
```

#### 修正4: AIガイドの全面書き換え
**ファイル**: `src/v2/utils/aiMetadata.ts`
**追加内容**:
- HTMLコメント形式の強調 (⚠️ マーク付き)
- 正しい例と間違った例の対比
- COMPLETE WORKING EXAMPLE セクション
- FINAL REMINDER

#### 修正5: useAutoEditの簡略化
**ファイル**: `src/v2/hooks/useAutoEdit.ts`
**変更**: 旧コマンド分岐を完全削除、新コマンド専用化
**削除**: `useChangeHighlight`, `highlightChanges`, 旧コマンド判定ロジック

### 重要な実装詳細

#### ハイライトカラー (content.css)
- REPLACE: 青 `rgba(59, 130, 246, 0.2)`
- INSERT: 緑 `rgba(34, 197, 94, 0.2)`
- DELETE: 赤 + opacity:0.5 + 取り消し線
- MOVE: 紫 `rgba(168, 85, 247, 0.2)`
- SPLIT: オレンジ `rgba(249, 115, 22, 0.2)`
- MERGE: 青緑 `rgba(20, 184, 166, 0.2)`

#### UIコンポーネント統合 (App.tsx)
- `useCommandApprovalController()` - ホバー検知とポップアップ制御
- `CommandPopup` - activePopupが存在する場合のみ表示
- `CommandApprovalBar` - showApprovalBar && pendingCount > 0で表示

#### コマンド実行フロー
1. ファイル変更検知 (`useFileSystemWatcher`)
2. HTMLコメントパース (`htmlCommentParser`)
3. 新コマンド検出 (`hasNewCommands`)
4. コマンドパース (`parseNewCommandsFromHtml`)
5. コマンド実行 (`executeNewCommands`)
6. ハイライト登録 (`registerMultipleHighlights`)
7. 個別承認UI待機

## 3. 現在のシステム状態と既知の問題

### 実装済み機能
- ✅ 6種類の新コマンド（REPLACE/INSERT/DELETE/MOVE/SPLIT/MERGE）
- ✅ 段落IDシステム (正式ID + 仮ID)
- ✅ HTMLコメントパーサー
- ✅ コマンド実行エンジン
- ✅ ハイライトシステム (6色)
- ✅ 個別承認UI (ポップアップ + 承認バー)
- ✅ 全体承認/破棄
- ✅ AIガイド (HTMLコメント形式を明記)

### 既知の制約
- HTMLパーサーはネストタグ未対応 (`<b><sup>text</sup></b>`等)
- カンマを含むテキストは引数パースで問題になる可能性
- ProseMirror位置計算はノード単位（文字単位ではない）

### デバッグ時の確認ポイント
1. コマンドが`<!-- -->`で囲まれているか
2. `hasNewCommands()`が正しく検出しているか
3. `extractArguments()`がカンマ分割しているか
4. 段落IDが実際のHTML要素と一致しているか
5. コンソールにパースエラーが出ていないか

## 4. 解決済み要件とその解決方法
（ユーザーの指示待ち - このセクションはユーザーが更新）

## 5. 新コマンドシステム関連ファイル構成

### 型定義
- `src/v2/types/command.ts` - 新コマンド型、オプション、実行結果

### ユーティリティ
- `src/v2/utils/paragraphIdManager.ts` - ID生成・検証
- `src/v2/utils/paragraphOperations.ts` - 段落検索・スナップショット
- `src/v2/utils/newCommandParser.ts` - コマンドパース
- `src/v2/utils/htmlCommentParser.ts` - HTMLコメント抽出
- `src/v2/utils/aiMetadata.ts` - AIガイド生成

### サービス
- `src/v2/services/newCommandExecutionService.ts` - コマンド実行

### フック
- `src/v2/hooks/useCommandParser.ts` - パーサーフック (新旧両対応)
- `src/v2/hooks/useCommandExecutor.ts` - 実行フック (新旧両対応)
- `src/v2/hooks/useCommandHighlight.ts` - ハイライト管理
- `src/v2/hooks/useCommandApprovalController.ts` - UI制御
- `src/v2/hooks/useAutoEdit.ts` - 自動編集フロー統合

### UI コンポーネント
- `src/v2/components/CommandPopup.tsx` - ホバーポップアップ
- `src/v2/components/CommandApprovalBar.tsx` - 承認バー

### ストア
- `src/v2/store/useCommandHighlightStore.ts` - ハイライト状態管理

### Tiptap拡張
- `src/v2/lib/paragraphCommandAttributes.ts` - カスタム属性

### スタイル
- `src/v2/styles/content.css` - ハイライトCSS

## 6. 技術スタック詳細

### フロントエンド
- **React 18** - UIコンポーネント
- **TypeScript** - 型安全性
- **Tiptap** - リッチテキストエディタ
- **ProseMirror** - エディタ基盤（Transform API）
- **Tailwind CSS** - スタイリング

### 状態管理
- **Zustand** - グローバル状態 (ハイライトストア)
- **React Hooks** - ローカル状態

### ユーティリティ
- **uuid (v4)** - 仮ID生成
- **正規表現** - HTMLパース・コマンドマッチング

### データフロー
```
HTMLファイル保存
  ↓ (useFileSystemWatcher)
コマンドエリア抽出
  ↓ (htmlCommentParser)
コマンドパース
  ↓ (newCommandParser)
コマンド実行
  ↓ (newCommandExecutionService)
ハイライト登録
  ↓ (useCommandHighlight)
UI表示・承認待ち
  ↓ (CommandPopup, CommandApprovalBar)
承認/破棄
  ↓
自動保存
```

## 7. 新コマンドシステム動作原理

### コマンド検出フロー
1. `useFileSystemWatcher` - ファイル変更を1秒ごとにポーリング
2. `hasNewCommands()` - 新コマンドパターン正規表現でチェック
3. `extractCommandArea()` - `<!-- AI_COMMAND_START/END -->` 間を抽出
4. `extractCommands()` - 各行からHTMLコメント内のコマンド文字列を抽出
5. `parseNewCommands()` - コマンド文字列配列をCommandオブジェクトに変換

### コマンド実行原理
- **REPLACE**: 段落検索 → スナップショット保存 → テキスト置換 → data属性付与
- **INSERT**: 段落検索 → 仮ID生成 → 新段落挿入 → data属性付与
- **DELETE**: 段落検索 → スナップショット保存 → data属性付与 (実削除は承認時)
- **MOVE**: 両段落検索 → スナップショット保存 → 削除＆挿入 → data属性付与
- **SPLIT**: 段落検索 → 分割位置特定 → 2段落に分割 → 仮ID付与 → data属性付与
- **MERGE**: 両段落検索 → スナップショット保存 → 結合 → data属性付与

### ハイライトシステム
- **ハイライト登録**: `registerMultipleHighlights()` - 実行結果からHighlightStateを生成
- **表示**: `data-command-type`属性に基づくCSS（content.css）
- **ホバー検知**: `useCommandApprovalController` - mouseenterイベント (500ms遅延)
- **ポップアップ**: 段落位置に応じた座標計算（画面外回避）

### 承認/破棄処理
- **個別承認**: data属性削除 → ハイライトストアから削除
- **個別破棄**: スナップショットから段落復元 → data属性削除 → ハイライトストアから削除
- **全体承認**: 全ハイライトに対して個別承認を実行
- **全体破棄**: 全ハイライトに対して個別破棄を実行

### 段落ID昇格
- INSERT/SPLITで生成される`temp-{uuid}`
- 承認時に`p{page}-{paragraph}`形式に変換（実装予定）

