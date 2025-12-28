# リアルタイム同期AI編集 実装タスク管理

**開始日**: 2025-12-29  
**推定作業時間**: 9-14日  
**現在のフェーズ**: Phase 1 (完了) → Phase 2 (進行中)

---

## 📊 全体進捗

- [x] **Phase 1: 基盤構築** (1-2日) ✅ 完了
- [ ] **Phase 2: コマンドシステム** (2-3日) 🔄 進行中
- [ ] **Phase 3: 変更ハイライト** (1日)
- [ ] **Phase 4: UIコンポーネント** (1-2日)
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

## Phase 2: コマンドシステム 🔄 進行中

### タスク一覧
- [ ] `useFileSystemWatcher` フック実装
  - [ ] File System Access API統合
  - [ ] ファイル変更検知ロジック
  - [ ] ポーリング機構
- [ ] `useCommandParser` フック実装
  - [ ] HTMLコメント抽出
  - [ ] コマンドパース
  - [ ] エラーハンドリング
- [ ] `useCommandExecutor` フック実装
  - [ ] Tiptapエディタとの統合
  - [ ] コマンド実行ロジック
  - [ ] 変更範囲の追跡
- [ ] 基本コマンド実装
  - [ ] INSERT_TEXT
  - [ ] REPLACE_TEXT

### 予定ファイル
- `src/v2/hooks/useFileSystemWatcher.ts`
- `src/v2/hooks/useCommandParser.ts`
- `src/v2/hooks/useCommandExecutor.ts`

---

## Phase 3: 変更ハイライト

### タスク一覧
- [ ] 変更ハイライト機能実装
- [ ] ハイライトのフェードアウトアニメーション実装

### 予定ファイル
- `src/v2/hooks/useChangeHighlight.ts`
- `src/v2/utils/highlightManager.ts`

---

## Phase 4: UIコンポーネント

### タスク一覧
- [ ] `EditorLockOverlay` コンポーネント作成（エディタロック用オーバーレイ）
- [ ] `AiSyncPanel` コンポーネント作成
- [ ] `ChangeHighlight` コンポーネント作成
- [ ] 既存エディタUIへの統合
- [ ] エディタロック状態管理の実装

### 予定ファイル
- `src/v2/components/features/ai-sync/EditorLockOverlay.tsx`
- `src/v2/components/features/ai-sync/AiSyncPanel.tsx`
- `src/v2/components/features/ai-sync/ChangeHighlight.tsx`

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
（なし）

---

## 📝 実装メモ

### Phase 1完了時のメモ
- 型定義は全コマンドタイプに対応
- ホワイトリスト方式でセキュリティを確保
- パーサーは引数の入れ子括弧に対応
- バリデーションでXSS対策を実装

### 次のステップ
1. File System Access APIを使用したファイル監視フックの実装
2. Tiptapエディタとの統合準備
3. エディタロック機能の実装（Phase 4と並行検討）

---

## ⚠️ 注意事項

- **rules.md厳守**: 4層アーキテクチャ、Tailwind CSS、`@/`エイリアス使用
- **ブラウザ対応**: Chrome, Edgeのみ
- **エディタロック**: ファイル変更検知～コマンド反映完了まで操作不可
- **自動保存タイミング**: コマンド実行**直前**にコマンドエリアをクリアして保存

---

**最終更新**: 2025-12-29 03:57
