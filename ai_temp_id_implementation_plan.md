# 仮ID仕様変更・実装計画書（AI発行方式）

## 1. 概要
`INSERT_PARAGRAPH` および `SPLIT_PARAGRAPH` コマンドにおいて、システムがUUIDを自動発行するのではなく、AIエージェント側が明示的に仮IDを発行・指定する仕様に変更します。これにより、同一ターン内での連続した段落操作（例：挿入した段落を即座に移動する、等）が可能になります。

## 2. 変更仕様
### INSERT_PARAGRAPH
- **新形式**: `INSERT_PARAGRAPH(targetId, text, [options], [tempId])`
- **内容**: `tempId` が指定された場合、その値を新段落の `data-temp-id` にセットする。指定がない場合は後方互換のため従来通り自動発行するが、AIガイドでは指定を推奨する。

### SPLIT_PARAGRAPH
- **新形式**: `SPLIT_PARAGRAPH(targetId, beforeText, afterText, [tempId])`
- **内容**: 分割後の後半部分の段落に `tempId` をセットする。

### 仮IDのルール
- プレフィックス `temp-` を必須とする（例: `temp-1`, `temp-para-99`）。
- 同一指示（ターン）内で重複しないようにAIが管理する。

---

## 3. 進捗チェックリスト

### フェーズ1: パーサーの修正
- [ ] `src/v2/utils/parsers/newCommandHandlers.ts` の `parseInsertParagraph` を修正
    - 引数から `tempId` を抽出するロジックの追加
    - AI指定の `tempId` がある場合は `generateTempId()` をスキップする
- [ ] `src/v2/utils/parsers/newCommandHandlers.ts` の `parseSplitParagraph` を修正
    - 第4引数を `tempId` として受理するように変更

### フェーズ2: AIガイドの更新
- [ ] `src/v2/utils/aiMetadata.ts` の `generateAiGuide` を更新
    - コマンド説明に `tempId` の引数を追加
    - 仮IDの命名規則（`temp-`）と、連続編集のための再利用ルールを追記
    - 具体的な連続編集の例（INSERTした直後にMOVEするなど）を追加

### フェーズ3: 実行エグゼキューターの確認
- [ ] `src/v2/services/commands/insertHandler.ts` の確認
    - コマンドオブジェクトに含まれる `tempId` が正しく `data-temp-id` にセットされているか再確認
- [ ] `src/v2/services/commands/splitHandler.ts` の修正（必要に応じて）
    - 分割後の新段落に `tempId` が正しく割り当てられるか確認

### フェーズ4: 動作検証
- [ ] `INSERT_PARAGRAPH` で指定した `tempId` がDOMに反映されることを確認
- [ ] 同一ターン内の後続コマンド（例: `MOVE_PARAGRAPH`）で、その `tempId` を `sourceId` として指定して動作することを確認
- [ ] `SPLIT_PARAGRAPH` で発行した `tempId` が後半部分に適用され、操作可能であることを確認

---

## 4. 完了条件
- [ ] AIが `temp-xxx` という形式でIDを指定できる。
- [ ] 指定された `tempId` が実行後のHTML/DOMに `data-temp-id` として刻まれる。
- [ ] 同一プロンプト内の後続コマンドが、その `tempId` を用いて正しく動作する。
