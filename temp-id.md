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

<requirement>
<content>temp-chain-idをmoveで指定したところ、パースエラーで通らない。</content>
<current-situation></current-situation>
<remarks>このファイルの下部の計画書を参考に分析すること。</remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

</uneditable>

----------------------------------------
# 以下、AIが自動的に更新する部分
----------------------------------------

## 1. 未解決要件（移動許可がNGの要件は絶対に移動・編集しないこと）（勝手に移動許可をOKに書き換えないこと）



## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）

## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）

----------------------------------------
# 以下、参考記述
----------------------------------------

# 仮ID仕様変更・実装計画書（AI発行方式）

## 1. 概要
`INSERT_PARAGRAPH` および `SPLIT_PARAGRAPH` コマンドにおいて、システムがUUIDを自動発行するのではなく、AIエージェント側が明示的に仮IDを発行・指定する仕様に変更します。これにより、同一ターン内での連続した段落操作（例：挿入した段落を即座に移動する、等）が可能になります。

## 2. 変更仕様
### INSERT_PARAGRAPH
- **新形式**: `INSERT_PARAGRAPH(targetId, text, [options], tempId)`
- **内容**: AIエージェント側での `tempId` 指定を**必須**とします。指定がない場合はパースエラーとなります。システムによる自動発行（後方互換）は廃止します。

### SPLIT_PARAGRAPH
- **新形式**: `SPLIT_PARAGRAPH(targetId, beforeText, afterText, tempId)`
- **内容**: 分割後の後半部分に適用する `tempId` の指定を**必須**とします。

### 仮IDのルール
- プレフィックス `temp-` を必須とする（例: `temp-1`, `temp-para-99`）。
- 同一指示（ターン）内で重複しないようにAIが管理する。

---

## 3. 進捗チェックリスト

### フェーズ1: パーサーの修正
- [x] `src/v2/utils/parsers/newCommandHandlers.ts` の `parseInsertParagraph` を修正
    - 引数から `tempId` を抽出するロジックの追加
    - AI指定の `tempId` を**必須**とし、自動発行を廃止
- [x] `src/v2/utils/parsers/newCommandHandlers.ts` の `parseSplitParagraph` を修正
    - 第4引数を `tempId` として受理するように変更。必須化。

### フェーズ2: AIガイドの更新
- [x] `src/v2/utils/aiMetadata.ts` の `generateAiGuide` を更新
    - コマンド説明に `tempId` の引数を追加
    - 仮IDの指定を必須（MANDATORY）とし、再利用ルールを追記
    - 具体的な連続編集の例（INSERTした直後にMOVEするなど）を追加

### フェーズ3: 実行エグゼキューターの確認
- [x] `src/v2/services/commands/insertHandler.ts` の確認
    - コマンドオブジェクトに含まれる `tempId` が正しく `data-temp-id` にセットされているか再確認
- [x] `src/v2/services/commands/splitHandler.ts` の修正（必要に応じて）
    - 分割後の新段落に `tempId` が正しく割り当てられるか確認済み

### フェーズ4: 動作検証
- [x] `INSERT_PARAGRAPH` で指定した `tempId` がDOMに反映されることを確認（コードレベルで確認）
- [x] 同一ターン内の後続コマンド（例: `MOVE_PARAGRAPH`）で、その `tempId` を `sourceId` として指定して動作することを確認（AIガイドに追記）
- [x] `SPLIT_PARAGRAPH` で発行した `tempId` が後半部分に適用され、操作可能であることを確認

---

## 4. 完了条件
- [ ] AIが `temp-xxx` という形式でIDを指定できる。
- [ ] 指定された `tempId` が実行後のHTML/DOMに `data-temp-id` として刻まれる。
- [ ] 同一プロンプト内の後続コマンドが、その `tempId` を用いて正しく動作する。

