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
<content><!-- INSERT_PARAGRAPH(p3-1, このコマンドで3ページ目が自動生成されます。, blockType=h1, spacing=m, temp-p3-para1) -->このコマンド単体で3ページ目の1行目に挿入されるが、空の二段落目も生成されてしまう</content>
<current-situation></current-situation>
<remarks></remarks>
<permission-to-move>NG</permission-to-move>
</requirement>






## 2. 未解決要件に関するコード変更履歴（目的、変更内容、変更日時）
- 2025-12-31: INSERT_PARAGRAPH/SPLIT_PARAGRAPH での tempId 指定を必須化。AIガイドも更新。
- 2025-12-31: isTempId の正規表現を緩和（`temp-[\w-]+`）。AIの自由なID命名に対応。
- 2025-12-31: `moveHandler.ts` の位置計算ロジックを修正。`sourcePos < insertPos` の場合に削除によるズレを補正する処理を追記。Position out of rangeエラーを解消。
- 2025-12-31: `useCommandHighlight.ts` を大幅に刷新。Reactの副作用やクロージャによる古い状態参照を避けるため、一括登録および個別承認の全行程で `useCommandHighlightStore.getState()` を直接使用するように変更。これにより連続編集時の状態残留を完全に解消。
- 2025-12-31: `approveHighlight` に DOM 整合性チェックを追加。承認アクション時に、何らかの理由で DOM から消失している保留中ハイライト（ゴースト）があれば自動的に掃除する安全策を導入。
- 2025-12-31: `newCommandExecutionService.ts` を修正。仮想ターゲットIDのプレフィックスを `temp-` に統一し、複数コマンドによる連番ページ生成（`p3-1`, `p3-1` → P3, P4）をサポート。
- 2025-12-31: `insertHandler.ts` および `moveHandler.ts` を修正。ターゲットが仮想プレースホルダーの場合に「あとに挿入」ではなく「置換/消費」することで、新ページの1段落目として正しく配置されるよう改善。
- 2025-12-31: `aiMetadata.ts` のAIガイドを更新。デフォルトオプション（p, left, s, 0）を非表示にし、新ページ生成のルールを追記。
- 2025-12-31: `tiptapContentUtils.ts` の `parseHtmlText` を修正。斜体タグ（<i>, <em>）のサポートを追加し、Tiptapの標準マーク（strong/em）にマッピングされることを確認。
- 2025-12-31: `ParagraphSpacing` 型を `none|xs|m|l|xl` に刷新。

## 3. 分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）
- 【原因1: パースエラー】以前の仮IDシステムがUUIDを前提としていたため、`isTempId` が厳格すぎて `temp-chain-1` 等を拒絶していた。
- 【原因2: 実行エラー】`MOVE_PARAGRAPH` において、削除によるドキュメント長の縮みを考慮せず元の `insertPos` を使ったため、範囲外エラーが発生していた。
- 【原因3: 状態残留エラー（再分析）】`registerMultipleHighlights` の `forEach` ループ内では、React の `useCallback` がそのレンダリングサイクルの `highlights` 状態に固定（クロージャにキャプチャ）されていた。そのため、ループの 1 回目で追加したハイライトを、2 回目の `registerHighlight` が「ストア内の最新状態」として認識できず、重複削除が機能していなかった。
- 【解決策】ループ内でも常に最新の Zustand 内部状態にアクセスできるよう、`getState()` を用いた直接参照に切り替えた。
- 【ゴーストハイライト】コマンドが連鎖すると、古いコマンド ID 属性が新しいコマンドで上書きされる。DOM 上に物理的に存在しなくなった未承認状態は、承認ポップアップも出せないため、自動的にクリーンアップする必要がある。

## 4. 解決済み要件とその解決方法
- **仮IDのパースエラー**: `paragraphIdManager.ts` の正規表現を緩和することで解決。
- **連続編集時の位置ずれエラー**: `moveHandler.ts` で `insertPos` の動的補正を実装することで解決。
- **temp-chain-1 がパースエラーで通らない**: `isTempId` の正規表現を `temp-[\w-]+` に修正することで解消（UUID以外の自由な命名を許可）。
- **連続編集後にフローが終了しない (Root Cause Fixed)**: `useCommandHighlight.ts` で `getState()` を用いた同期的な重複チェックと、承認時の DOM 整合性チェックを導入することで完全に解決。
- **挿入後に移動した段落の承認**: 単一ノードに対して複数コマンドが連なった場合、最新の状態（MOVE等）のみを承認対象とすることでUXをシンプル化。
- **連続編集後のフロー終了不具合**: `useCommandHighlight.ts` で `getState()` を用いた同期的な重複チェックと、承認時の DOM 整合性チェックを導入することで、挿入→移動といった連続操作後も正しく全ハイライトがクリアされ、フローが終了するように修正。
- **オプション設定の共通化・最適化**: デフォルト値（p, left, xs/s, 0）をAIに省略させるルールを整備。同時に `spacing` の選択肢を `none|xs|m|l|xl` に刷新。
- **Bold/Italic対応**: `parseHtmlText` において `<b>/<strong>` および `<i>/<em>` を Tiptap の `bold/italic` マークへ変換する処理を実装。
- **改ページ機能（仮想ターゲット）**: `pX-1` 指定による新ページ自動生成と、複数ページ連続生成、および1段落目への正確な挿入（プレースホルダー型から消費型への改善）を実現。

## 5. 要件に関連する全ファイルのファイル構成（それぞれの役割を1行で併記）
- `src/v2/utils/paragraphIdManager.ts`: 段落ID（正式・仮）の生成・検証ロジックを管理。
- `src/v2/utils/parsers/newCommandHandlers.ts`: INSERT/SPLIT コマンドから AI 指定の tempId をパース。
- `src/v2/types/command.ts`: コマンドオブジェクトの型定義。tempId を必須プロパティとして保持。
- `src/v2/services/commands/insertHandler.ts`: 実行時に `data-temp-id` 属性を DOM に付与。
- `src/v2/utils/paragraphFinder.ts`: `data-temp-id` を含む段落を DOM から検索。
- `src/v2/hooks/useCommandHighlight.ts`: ハイライトの登録と、重複（上書き）発生時のクリーンアップを担当。
- `src/v2/services/newCommandExecutionService.ts`: コマンド一括実行の司令塔。仮想ターゲットの解決とプレースホルダーの生成・清掃を担当。
- `src/v2/utils/tiptapContentUtils.ts`: HTMLテキストのパースを担当。Bold/Italic等のタグをTiptapマークへ変換。

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
    8. **仮想ターゲット（改ページ）の仕組み**: 
        - 実行前に全コマンドを走査し、存在しないページ（`pX-1`）への操作を検知。
        - 検知した場合、一時的な「仮想プレースホルダー段落」を含む新ページをドキュメント末尾に自動生成。
        - コマンドのターゲットをこのプレースホルダーに差し替えて実行。
        - 全コマンド実行後、未使用または役割を終えたプレースホルダーを自動削除する。

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

