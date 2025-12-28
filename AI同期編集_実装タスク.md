# リアルタイム同期AI編集 実装タスク管理

**開始日**: 2025-12-29  
**推定作業時間**: 9-14日  
**現在のフェーズ**: Phase 1 (完了) → Phase 2 (進行中)

---

## 📊 全体進捗

- [x] **Phase 1: 基盤構築** (1-2日) ✅ 完了
- [x] **Phase 2: コマンドシステム** (2-3日) ✅ 完了
- [ ] **Phase 3: 変更ハイライト** (1日)
- [ ] **Phase 4: UIコンポーネント** (1-2日) 🔄 進行中（70%完了）
- [ ] **Phase 5: 残りのコマンド実装** (2-3日)
- [ ] **Phase 6: テスト・最適化** (2-3日)
- [ ] **Phase 7: ドキュメント・公開準備** (1日)

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
- `src/v2/hooks/useAiSync.ts` - 統合AI同期フック
- `src/v2/store/useAppStore.ts` - AI同期状態管理を追加

---

## Phase 3: 変更ハイライト

### タスク一覧
- [ ] 変更ハイライト機能実装
- [ ] ハイライトのフェードアウトアニメーション実装

### 予定ファイル
- `src/v2/hooks/useChangeHighlight.ts`
- `src/v2/utils/highlightManager.ts`

---

## Phase 4: UIコンポーネント 🔄 進行中（70%完了）

### タスク一覧
- [x] `EditorLockOverlay` コンポーネント作成（エディタロック用オーバーレイ）
- [x] `AiSyncPanel` コンポーネント作成
- [ ] `ChangeHighlight` コンポーネント作成
- [ ] 既存エディタUIへの統合
- [x] エディタロック状態管理の実装

### 作成したファイル
- `src/v2/components/features/EditorLockOverlay.tsx` - エディタロック用オーバーレイ
- `src/v2/components/features/AiSyncPanel.tsx` - AI同期制御パネル

### 予定ファイル
- `src/v2/components/features/ChangeHighlight.tsx`

---

## Phase 5: 残りのコマンド実装

### タスク一覧
- [ ] DELETE_TEXT コマンド実装
- [ ] FORMAT_TEXT コマンド実装
- [ ] INSERT_PARAGRAPH コマンド実装
- [ ] DELETE_PARAGRAPH コマンド実装
- [ ] MOVE_PARAGRAPH コマンド実装（オプション）

---

## Phase 6: テスト・最適化

### タスク一覧
- [ ] 単体テスト作成
  - [ ] コマンドパーサーのテスト
  - [ ] コマンド実行ロジックのテスト
  - [ ] 検証ロジックのテスト
- [ ] 統合テスト
  - [ ] ファイル変更検知からコマンド実行までのフロー
  - [ ] 自動保存とリロードによる復元
  - [ ] エラーケースのハンドリング
- [ ] E2Eテスト（実際のAntigravity連携）
  - [ ] 複数コマンドの連続実行テスト
  - [ ] ブラウザ互換性テスト（Chrome, Edge）
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング強化

---

## Phase 7: ドキュメント・公開準備

### タスク一覧
- [ ] ユーザー向けガイド作成
- [ ] AIエージェント向けAPI仕様書作成
- [ ] デモ動画作成（オプション）

---

## 🐛 発見した問題・課題

### 未解決
（なし）

### 解決済み
1. **pagination.tsのthisコンテキストエラー** (2025-12-29 04:09)
   - 問題: `this.options.isWordMode`にアクセスできない
   - 原因: プラグインのview関数内でthisコンテキストが正しくない
   - 解決: `addProseMirrorPlugins()`の開始時に`const options = this.options;`でキャプチャし、クロージャ内で参照

---

## 📝 実装メモ

### Phase 1完了時のメモ
- 型定義は全コマンドタイプに対応
- ホワイトリスト方式でセキュリティを確保
- パーサーは引数の入れ子括弧に対応
- バリデーションでXSS対策を実装

### Phase 2完了時のメモ
- File System Access APIでポーリング方式を採用（1秒間隔）
- useAiSyncフックで8ステップの安全な実行フローを実装
- エディタロック中はTiptapの`editable`をfalseに設定
- コマンド実行前に自動保存してロールバック可能に

### Phase 4進行中のメモ
- EditorLockOverlayはz-index 9999で最前面に表示
- AiSyncPanelは状態インジケーター付き
- Zustandストアにエディタロック状態を追加

### 次のステップ
1. 既存エディタ（App.tsx）への統合
2. ChangeHighlightコンポーネント作成（Phase 3と並行）
3. 残りのコマンド（DELETE_TEXT, FORMAT_TEXT等）の実装

---

## ⚠️ 注意事項

- **rules.md厳守**: 4層アーキテクチャ、Tailwind CSS、`@/`エイリアス使用
- **ブラウザ対応**: Chrome, Edgeのみ
- **エディタロック**: ファイル変更検知～コマンド反映完了まで操作不可
- **自動保存タイミング**: コマンド実行**直前**にコマンドエリアをクリアして保存

---

**最終更新**: 2025-12-29 03:57
