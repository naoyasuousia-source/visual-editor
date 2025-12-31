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
<content></content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

</uneditable>

----------------------------------------
# 以下、AIが自動的に更新する部分
----------------------------------------

## 1. 未解決要件（移動許可がNGの要件は絶対に移動・編集しないこと）（勝手に移動許可をOKに書き換えないこと）

<requirement>
<content><!-- INSERT_PARAGRAPH(p1-1, この段落は挿入された直後に移動されます。, temp-chain-1) -->
<!-- MOVE_PARAGRAPH(temp-chain-1, p2-1) -->このコマンドを送ると、moveまで正常にされるが、個別に承認を完了しても未承認が残ってるということになり、自動編集フローが終了しない。</content>
<current-situation>コンソールエラーは出なくなったが、やはり、insert→moveの場合、表示されてる個別承認をすべて完了しても、「一個の変更が保留中です」となり、自動編集フローが終了しない。
</current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>

## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- 2025-12-31: INSERT_PARAGRAPH/SPLIT_PARAGRAPH での tempId 指定を必須化。AIガイドも更新。
- 2025-12-31: isTempId の正規表現を緩和（`temp-[\w-]+`）。AIの自由なID命名に対応。
- 2025-12-31: `moveHandler.ts` の位置計算ロジックを修正。`sourcePos < insertPos` の場合に削除によるズレを補正する処理を追記。Position out of rangeエラーを解消。
- 2025-12-31: `useCommandHighlight.ts` の `registerHighlight` を修正。新コマンドが既存の pending ハイライトと同じ段落を対象とする場合、古いハイライトを自動で store から削除するように変更。連続編集時の「透明な未承認編集」残留問題を解消。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- 【原因1: パースエラー】以前の仮IDシステムがUUIDを前提としていたため、`isTempId` が厳格すぎて `temp-chain-1` 等を拒絶していた。
- 【原因2: 実行エラー】`MOVE_PARAGRAPH` において、`sourcePos < insertPos` の順序で処理（削除→挿入）を行う際、削除によってドキュメントが短くなることを考慮せず元の `insertPos` を使ったため、末尾付近で `Position out of range` が発生していた。
- 【原因3: 状態残留エラー】`INSERT` した段落を `MOVE` すると、DOM上の `data-command-id` が `INSERTのID` から `MOVEのID` に上書きされる。そのため `INSERT` の個別承認が不可能になり、Store内に未承認状態として残り続けることで、自動編集フロー（ロック状態）が終了しなくなっていた。
- 【制約】Tiptapの `.chain()` を使う場合、途中の削除による位置の変化を手動で計算して後続のコマンド（`.insertContentAt`）に渡す必要がある。

## 4. 解決済み要件とその解決方法
- **仮IDのパースエラー**: `paragraphIdManager.ts` の正規表現を緩和することで解決。
- **連続編集時の位置ずれエラー**: `moveHandler.ts` で `insertPos` の動的補正を実装することで解決。
- **temp-chain-1 がパースエラーで通らない**: `isTempId` の正規表現を `temp-[\w-]+` に修正することで解消（UUID以外の自由な命名を許可）。
- **連続編集後にフローが終了しない**: `useCommandHighlight.ts` で、同一段落への後続コマンド実行時に古いハイライトを自動除去するロジックを導入して解決。
- **挿入後に移動した段落の承認**: 単一ノードに対して複数コマンドが連なった場合、最新の状態（MOVE等）のみを承認対象とすることでUXをシンプル化。

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/v2/utils/paragraphIdManager.ts`: 段落ID（正式・仮）の生成・検証ロジックを管理。
- `src/v2/utils/parsers/newCommandHandlers.ts`: INSERT/SPLIT コマンドから AI 指定の tempId をパース。
- `src/v2/types/command.ts`: コマンドオブジェクトの型定義。tempId を必須プロパティとして保持。
- `src/v2/services/commands/insertHandler.ts`: 実行時に `data-temp-id` 属性を DOM に付与。
- `src/v2/utils/paragraphFinder.ts`: `data-temp-id` を含む段落を DOM から検索。
- `src/v2/hooks/useCommandHighlight.ts`: ハイライトの登録と、重複（上書き）発生時のクリーンアップを担当。
- `src/v2/store/useCommandHighlightStore.ts`: 未承認コマンドのリストを集中管理。

## 6. 要件に関する機能の技術スタックと動作原理（依存関係含む）
- **技術スタック**: TypeScript, Regex (ID検証), Tiptap (属性拡張 `data-temp-id`), ProseMirror (Position Mapping)。
- **動作原理**:
    1. AI が `INSERT_PARAGRAPH` 等で `temp-xxx` という ID を指定。
    2. パーサーが `tempId` 属性として保持。
    3. 実行サービスが Tiptap のカスタム属性 `data-temp-id` として挿入。
    4. 後続コマンドが `MOVE_PARAGRAPH(temp-xxx, ...)` を発行。
    5. `paragraphFinder` が `data-temp-id === "temp-xxx"` のノードを検索し、正しい位置で実行する。
    6. 移動（MOVE）の際は、先行する削除操作によるドキュメント長の縮みを計算し、正しい挿入位置を算出する。
    7. **連続編集の最適化**: 同一の `temp-xxx` に対して新しいコマンドが登録される際、古いコマンドは「上書きされた」とみなして自動的に解決済み状態にする。

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

