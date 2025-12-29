# リアルタイム同期AI編集 実装タスク管理 v2.1

**開始日**: 2025-12-29  
**推定作業時間**: 10-14日  
**現在のフェーズ**: Phase 3 (進行中)  
**バージョン**: 2.1（ハイライトとロック仕様変更）

---

## 📊 全体進捗

- [x] **Phase 1: 基盤構築** (1-2日) ✅ 完了
- [x] **Phase 2: コマンドシステム** (2-3日) ✅ 完了
- [ ] **Phase 3: 自動編集フロー** (2-3日) 🔄 新規追加
- [ ] **Phase 4: UIコンポーネント** (1-2日) 要更新
- [ ] **Phase 5: 変更ハイライト** (1日)
- [ ] **Phase 6: 残りのコマンド実装** (2-3日)
- [ ] **Phase 7: テスト・最適化** (2-3日)
- [ ] **Phase 8: ドキュメント・公開準備** (1日)

---

## 🔄 v2.1 要件変更の概要

### v2.1での変更点 (2025-12-29 12:39)
- ✅ **ハイライト表示の変更**
  - 変更箇所のカラー表示を承認/破棄まで表示し続ける（フェードアウトしない）
- ✅ **承認待ち中のエディタロック**
  - 承認/破棄選択まで`editor.setEditable(false)`を維持（手動編集不可）
  - AutoEditBarが表示されている間はエディタを操作できない
- ✅ **content.cssへのコマンド説明書埋め込み**
  - AIエージェント向けのコマンド仕様をHTMLコメントで埋め込む
  - エージェントがcontent.cssを読めばコマンドの使い方がわかる

### v2.0での変更点 (202

5-12-29 12:23)

### 削除された機能
- ❌ AI同期パネル（手動開始ボタン）
  - 理由: 自動監視のため不要

### 追加された機能
- ✅ 自動ファイル監視（エディタ起動時から0～3秒ごと）
- ✅ AutoEditBar（普段非表示、成功後のみ表示）
- ✅ 承認/破棄機能
- ✅ 承認待ちロック機能

### 変更されたフロー
1. 監視は自動開始（常時）
2. 自動編集成功後にAutoEditBarを表示
3. 承認/破棄選択前は次の編集をブロック
4. 承認時: ファイル保存 → バー非表示
5. 破棄時: 状態復元 → ファイル保存 → バー非表示

---

## Phase 1: 基盤構築 ✅ 完了

### タスク一覧
- [x] フォルダ構造の確認
- [x] 型定義ファイル作成（`ai-sync.types.ts`）
- [x] HTMLコメント解析ユーティリティ作成（`htmlCommentParser.ts`）
- [x] コマンド検証ユーティリティ作成（`commandValidator.ts`）
- [x] コマンドパーサー作成（`commandParser.ts`）

### 作成したファイル
- `src/v2/types/ai-sync.types.ts` - 完全な型定義
- `src/v2/utils/htmlCommentParser.ts` - HTMLコメント解析
- `src/v2/utils/commandValidator.ts` - コマンドバリデーション
- `src/v2/utils/commandParser.ts` - コマンドパーサー

---

## Phase 2: コマンドシステム ✅ 完了

### タスク一覧
- [x] `useFileSystemWatcher` フック実装
  - [x] File System Access API統合
  - [x] ファイル変更検知ロジック
  - [x] ポーリング機構
- [x] `useCommandParser` フック実装
  - [x] HTMLコメント抽出
  - [x] コマンドパース
  - [x] エラーハンドリング
- [x] `useCommandExecutor` フック実装
  - [x] Tiptapエディタとの統合
  - [x] コマンド実行ロジック
  - [x] 変更範囲の追跡
- [x] 基本コマンド実装
  - [x] INSERT_TEXT
  - [x] REPLACE_TEXT

### 作成したファイル
- `src/v2/hooks/useFileSystemWatcher.ts` - ファイル監視フック
- `src/v2/hooks/useCommandParser.ts` - コマンドパーサーフック
- `src/v2/hooks/useCommandExecutor.ts` - コマンド実行フック
- ~`src/v2/hooks/useAiSync.ts`~ - **削除予定**（v1.0仕様のため）
- `src/v2/store/useAppStore.ts` - 状態管理を追加

---

## Phase 3: 自動編集フロー 🆕 新規追加

### タスク一覧
- [ ] `useAutoEdit` フック実装（統合フック）
  - [ ] エディタ起動時に自動監視開始
  - [ ] ファイル変更検知
  - [ ] 承認待ちロック機能
  - [ ] エラーハンドリング
- [ ] `useEditApproval` フック実装（承認/破棄管理）
  - [ ] 編集前の状態保存（エディタHTML）
  - [ ] 承認処理（ファイル自動保存）
  - [ ] 破棄処理（状態復元 + ファイル自動保存）
- [ ] ストア更新
  - [ ] `isAutoEditProcessing` フラグ追加
  - [ ] `isEditPendingApproval` フラグ追加
  - [ ] `lastAutoEditTime` 追加
  - [ ] ~`isAiSyncEnabled`~ 削除
  - [ ] ~`isEditorLocked`~ を `isAutoEditProcessing` に統合
- [ ] エディタロックメッセージを「自動編集中」に変更

### 予定ファイル
- `src/v2/hooks/useAutoEdit.ts` - 自動編集統合フック
- `src/v2/hooks/useEditApproval.ts` - 承認/破棄管理フック

### 既存ファイルの更新
- `src/v2/store/useAppStore.ts` - 状態管理の更新
- `src/v2/components/features/EditorLockOverlay.tsx` - メッセージ変更

### 削除予定ファイル
- `src/v2/hooks/useAiSync.ts` - v1.0の統合フック（不要）
- `src/v2/components/features/AiSyncPanel.tsx` - 手動開始パネル（不要）

---

## Phase 4: UIコンポーネント 🔄 要更新

### タスク一覧
- [x] `EditorLockOverlay` コンポーネント作成
  - [ ] メッセージを「自動編集中」に変更
- [ ] `AutoEditBar` コンポーネント作成（新規）
  - [ ] 最終自動編集時刻の表示（「〇分前」形式）
  - [ ] 変更承認ボタン
  - [ ] 変更を破棄ボタン
  - [ ] 普段非表示、成功後のみ表示
- [x] 既存エディタUIへの統合
  - [ ] ~AI同期パネルの削除~
  - [ ] AutoEditBarの配置（ツールバー直下）

### 作成したファイル
- `src/v2/components/features/EditorLockOverlay.tsx` - エディタロック用オーバーレイ

### 予定ファイル
- `src/v2/components/features/AutoEditBar.tsx` - 自動編集バー

### 削除予定ファイル
- ~`src/v2/components/features/AiSyncPanel.tsx`~ - 手動パネル（不要）

---

## Phase 5: 変更ハイライト

### タスク一覧
- [ ] 変更範囲の追跡機能
- [ ] ハイライト表示ロジック（黄色背景）
- [ ] **v2.1: フェードアウトアニメーション削除**
  - [ ] 承認/破棄まで表示を維持
  - [ ] 承認/破棄時のハイライトクリア処理

### 予定ファイル
- `src/v2/hooks/useChangeHighlight.ts` - ハイライト管理フック
- `src/v2/utils/highlightManager.ts` - ハイライトユーティリティ

---

## Phase 6: 残りのコマンド実装

### タスク一覧
- [ ] DELETE_TEXT コマンド実装
- [ ] FORMAT_TEXT コマンド実装
- [ ] INSERT_PARAGRAPH コマンド実装
- [ ] DELETE_PARAGRAPH コマンド実装

---

## Phase 7: テスト・最適化

### タスク一覧
- [ ] 単体テスト作成
  - [ ] コマンドパーサーのテスト
  - [ ] コマンド実行ロジックのテスト
  - [ ] 検証ロジックのテスト
  - [ ] 承認/破棄処理のテスト
- [ ] 統合テスト
  - [ ] 自動編集フローの動作確認
  - [ ] 承認待ちロックの動作確認
  - [ ] エラーケースのハンドリング
- [ ] E2Eテスト（実際のAntigravity連携）
  - [ ] 単一コマンドの実行テスト
  - [ ] 複数コマンドの連続実行テスト
  - [ ] 承認/破棄の動作テスト
  - [ ] 承認待ち中のブロックテスト
  - [ ] ブラウザ互換性テスト（Chrome, Edge）
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング強化

---

## Phase 8: ドキュメント・公開準備

### タスク一覧
- [ ] ユーザー向けガイド作成
- [ ] AIエージェント向けコマンドAPI仕様書作成
- [ ] コマンド記述例の作成
- [ ] **v2.1: content.cssへのコマンド取扱説明書埋め込み**
  - [ ] HTML形式のコマンド仕様書作成
  - [ ] content.cssの先頭にHTMLコメントとして埋め込み
  - [ ] コマンド形式、引数、使用例を含める

---

## 🐛 発見した問題・課題

### 未解決
1. **ファイル監視の自動開始方法**
   - SecurityError: ファイル選択ダイアログはユーザー操作が必要
   - 対策: currentFileHandle経由で監視開始に変更必要

### 解決済み
1. **pagination.tsのthisコンテキストエラー** (2025-12-29 04:09)
   - 問題: `this.options.isWordMode`にアクセスできない
   - 原因: プラグインのview関数内でthisコンテキストが正しくない
   - 解決: `addProseMirrorPlugins()`の開始時に`const options = this.options;`でキャプチャし、クロージャ内で参照

2. **インポートパスエラー** (2025-12-29 04:15)
   - 問題: `@/v2/`というパスでモジュールが見つからない
   - 原因: 新規作成したファイルで誤って`@/v2/`を使用
   - 解決: 全ファイルで`@/v2/`を`@/`に統一（9ファイル修正）

3. **Buttonコンポーネント不在** (2025-12-29 04:17)
   - 問題: `@/components/ui/button`が存在しない
   - 原因: Shadcn/uiのButtonが未導入
   - 解決: Tailwind CSSでスタイリングした通常のbuttonタグに置き換え

4. **v1.0コードの削除** (2025-12-29 12:30)
   - `useAiSync.ts` と `AiSyncPanel.tsx` を削除
   - App.tsxからの参照も削除済み
   - useAppStoreを v2.1 仕様に更新済み

---

## 📝 実装メモ

### Phase 1完了時のメモ
- 型定義は全コマンドタイプに対応
- ホワイトリスト方式でセキュリティを確保
- パーサーは引数の入れ子括弧に対応
- バリデーションでXSS対策を実装

### Phase 2完了時のメモ
- File System Access APIでポーリング方式を採用（1秒間隔）
- ~useAiSyncフックで8ステップの安全な実行フローを実装~ → v2.0で再設計
- エディタロック中はTiptapの`editable`をfalseに設定
- コマンド実行前に自動保存してロールバック可能に

### v2.1要件変更時のメモ (2025-12-29 12:39)
- **ハイライト表示**: 承認/破棄まで表示し続ける（フェードアウトしない）
- **エディタロック**: 承認待ち中は`setEditable(false)`を維持（手動編集不可）
- **コマンド説明書**: content.cssにHTMLコメント形式で埋め込み

### v2.0要件変更時のメモ (2025-12-29 12:23)
- **自動監視**: エディタ起動時から0～3秒ごとに常時監視
- **AutoEditBar**: 普段非表示、成功後のみ表示（3項目のみ）
- **承認/破棄**: 明確なフローと状態管理
- **承認待ちロック**: 次の自動編集をブロック
- **AI同期パネル削除**: 手動開始が不要になったため

### 次のステップ
1. **Phase 3**: useAutoEdit の currentFileHandle ベース実装
2. **Phase 4**: AutoEditBarの統合（完了）
3. **Phase 5**: 変更ハイライト機能の実装（v2.1仕様）

---

## ⚠️ 注意事項

- **rules.md厳守**: 4層アーキテクチャ、Tailwind CSS、`@/`エイリアス使用
- **ブラウザ対応**: Chrome, Edgeのみ
- **自動監視**: ファイルを開いたら自動的に監視開始（currentFileHandle経由）
- **承認待ちロック**: 承認/破棄選択前は次の自動編集を完全にブロック + エディタロック
- **ハイライト表示**: 承認/破棄まで維持（フェードアウトしない）
- **エディタロックメッセージ**: 「自動編集中」に変更済み
- **AutoEditBar**: ツールバー直下に配置、普段は非表示
- **content.css**: AIエージェント向けコマンド仕様をHTMLコメントで埋め込み
- **HMR問題**: 新規ファイル追加後は開発サーバー再起動またはハードリロード推奨

---

**最終更新**: 2025-12-29 12:39
