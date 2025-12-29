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

（なし）

## 2. 未解決要件に関するコード変更履歴

### 2024/12/29 - パースエラー問題の根本原因特定と修正

**問題の特定:**

1. **コマンドパースエラー問題**: 
   - **根本原因特定**: `content.css` の1-100行目にAIエージェント向けコマンドAPI仕様書がHTMLコメントとして含まれており、その中にサンプルコードとして `<!-- AI_COMMAND_START -->` と `<!-- AI_COMMAND_END -->` が記載されていた。
   - `extractCommandArea` は最初に見つかった `AI_COMMAND_START` と `AI_COMMAND_END` を使用するため、仕様書内のサンプルコードがコマンドエリアとして誤認識され、その間の `<!-- コマンド1 -->` と `<!-- コマンド2 -->` がパースされていた。
   - これらは正しいコマンド形式ではないため、「コマンドタイプが識別できません」エラーが発生していた。

**変更内容:**

- `content.css`: 仕様書内のマーカー例を `[AI_COMMAND_START]` 形式に変更し、実際のHTMLコメントマーカーと混同されないようにした。
2. **内部保存時の自動編集ダイアログ問題**:
   - **追加の原因特定**: `useFileIO.ts` で `useFileSystemWatcher` を呼び出していたが、これは新しいフックインスタンスを作成するため、`syncLastModified` が正しいファイルハンドルを参照していなかった。
   - `useFileIO` 内の `useFileSystemWatcher` インスタンスの `fileHandleRef` は `null` のため、`syncLastModified` は何も行わない状態だった。

**変更内容:**

#### 問題2の根本原因修正
- `useFileIO.ts`: 
  - `useFileSystemWatcher` のインポートを削除
  - `syncLastModifiedForHandle(handle)` 関数を新規作成し、直接ファイルから時刻を取得して `setLastModified` を呼び出すように変更
  - `saveAsFile` と `saveFile` で `syncLastModifiedForHandle(handle)` を使用

- `useAutoEdit.ts`:
  - `handleFileChange` 内で `isInternalSaving` をクロージャから参照せず、`useAppStore.getState().isInternalSaving` で最新値を取得

#### 問題1のデバッグログ追加
- `htmlCommentParser.ts`:
  - `extractCommands`: 改行コードをCRLF/LF両対応に修正、行数と処理中の行をログ出力
  - `extractCommandFromComment`: 各ステップ（HTMLコメント判定、内容抽出、除外判定）でログ出力
- `useCommandParser.ts`:
  - `hasCommands`: コマンドエリアの内容と抽出されたコマンド数をログ出力
  - `parseFromHtml`: コマンドエリア抽出結果とコマンド文字列をログ出力
- `commandParser.ts`:
  - `parseSingleCommand`: コマンドタイプと抽出された引数をログ出力

## 3. 分析中に気づいた重要ポイント

1. **クロージャ問題**: Reactフックのコールバック関数内で状態を参照する場合、依存配列に含めても、非同期イベント（ポーリングなど）で呼び出される際に古い値が参照される可能性がある。`useAppStore.getState()` を使用することで、常に最新の状態を取得できる。

2. **カスタムフックのインスタンス**: `useFileSystemWatcher` のようなカスタムフックは、異なるコンポーネント/フックで呼び出すと**別々のインスタンス**（別々の状態）を持つ。状態を共有するには、Zustandのようなグローバルストアを使用するか、同じインスタンスを共有する必要がある。

3. **ファイル監視のタイミング**: `useFileSystemWatcher` は1秒間隔でポーリングしている。保存処理が完了する前に次のポーリングが発生すると、`isInternalSaving` がまだ `true` に設定されていない可能性がある。

4. **改行コードの違い**: WindowsはCRLF (`\r\n`)、UnixはLF (`\n`) を使用。`split('\n')` では `\r` が残る可能性があるため、`split(/\r?\n/)` を使用する。

## 4. 解決済み要件とその解決方法

### コマンドパースエラー問題（解決済み）

**問題**: 外部のAIエージェントが正しいコマンドを書き込んでも「コマンドタイプが識別できません」エラーが発生していた

**原因**:
- `content.css` の1-100行目にAIエージェント向けコマンドAPI仕様書がHTMLコメントとして含まれており、その中にサンプルコードとして `<!-- AI_COMMAND_START -->` と `<!-- AI_COMMAND_END -->` が記載されていた
- `extractCommandArea` は最初に見つかったマーカーを使用するため、仕様書内のサンプルコードがコマンドエリアとして誤認識され、その間の `<!-- コマンド1 -->` と `<!-- コマンド2 -->` がパースされていた

**解決策**:
- `content.css`: 仕様書内のマーカー例を `[AI_COMMAND_START]` 形式に変更し、実際のHTMLコメントマーカーと混同されないようにした

---

### 内部保存時の自動編集ダイアログ問題（解決済み）

**問題**: エディタ上で保存した場合でも自動編集許可ダイアログが表示されていた

**原因**:
1. `useFileIO.ts` で `useFileSystemWatcher` を呼び出していたが、これは新しいフックインスタンスを作成するため、`syncLastModified` が正しいファイルハンドル（`null`）を参照していた
2. `useAutoEdit.ts` の `handleFileChange` で `isInternalSaving` がクロージャにより古い値を参照していた

**解決策**:
1. `useFileIO.ts`: `syncLastModifiedForHandle(handle)` 関数を新規作成し、直接ファイルから時刻を取得して `setLastModified` を呼び出す
2. `useAutoEdit.ts`: `useAppStore.getState().isInternalSaving` で最新値を取得

## 5. 要件に関連する全ファイルのファイル構成

```
src/v2/
├── hooks/
│   ├── useAutoEdit.ts          # 自動編集フローの統合管理
│   ├── useFileSystemWatcher.ts # ファイル監視（ポーリング）
│   ├── useFileIO.ts            # ファイル入出力（保存時にisInternalSavingを設定）
│   ├── useCommandParser.ts     # HTMLからコマンドを抽出
│   └── useCommandExecutor.ts   # コマンドの実行
├── utils/
│   ├── htmlCommentParser.ts    # HTMLコメントからコマンド文字列を抽出
│   ├── commandParser.ts        # コマンド文字列をパース
│   └── commandValidator.ts     # コマンドのバリデーション
├── store/
│   └── useAppStore.ts          # グローバル状態（isInternalSaving等）
└── types/
    └── ai-sync.types.ts        # 型定義
```

## 6. 要件に関連する技術スタック

- **React 18**: フック（useState, useCallback, useEffect）
- **Zustand**: グローバル状態管理（useAppStore）
- **File System Access API**: ファイルの読み書き・監視
- **Tiptap**: リッチテキストエディタ

## 7. 要件に関する機能の動作原理

### 自動編集フローの依存関係

```
[外部AIエージェント] 
    ↓ ファイルに書き込み
[useFileSystemWatcher] 
    ↓ ポーリング（1秒間隔）で変更検知
    ↓ FileChangeEvent発火
[useAutoEdit.handleFileChange]
    ↓ isInternalSavingチェック ← ★問題箇所：クロージャにより古い値を参照
    ↓ hasCommands()でコマンド有無チェック
    ↓ window.confirm()でユーザー確認
    ↓ parseFromHtml()でコマンドパース
    ↓ executeCommands()で実行
```

### 内部保存フロー

```
[ユーザーがCtrl+S]
    ↓
[useFileIO.saveFile()]
    ↓ setInternalSaving(true)
    ↓ ファイル書き込み
    ↓ syncLastModified() ← ファイル時刻を同期
    ↓ setInternalSaving(false)
```

**ポイント**: `syncLastModified()` 後に次のポーリングが発生すると、ファイル時刻が既知時刻と一致するため変更として検知されない。しかし、タイミングによっては `setInternalSaving(true)` が設定される前にポーリングが発生する可能性がある。

