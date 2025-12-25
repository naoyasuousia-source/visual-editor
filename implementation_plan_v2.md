# 実装計画書 v2 (AI-Link Editor ver.2.0)

本計画書は、PRD（要件定義書）と現状の `src/v2` コードベースの差異を埋め、AI-Link Editor ver.2.0 を完成させるためのものです。
**重要:** `src/v1` ディレクトリには一切変更を加えません。

## 実装状況 (Gap Analysis)

### 1. [完了] 画像右クリックメニュー (ImageContextMenu)
- **要件**: サイズ変更、枠線トグル、メタデータ編集への導線。
- **状況**: `src/v2/components/ImageContextMenu.tsx` を実装し、App.tsx に統合済み。

### 2. [完了] Word互換モードのツールバー UI
- **要件**: Wordモード時の段落番号チェックボックス、およびスタイル選択プルダウン。
- **状況**: `src/v2/components/Toolbar.tsx` に実装済み。

### 3. [完了] 自動ページネーション (Pagination)
- **要件**:
  - A4比率 (210mm x 297mm) の維持。
  - テキストがページ下端に達した場合の自動ページ生成とキャレット移動。
- **状況**: `src/v2/extensions/Pagination.ts` のコードを更新し、次ページの自動生成・コンテンツ移動ロジックを強化完了。

### 4. [完了] HTML保存とメタデータ (File I/O)
- **要件**:
  - 保存されたHTML内に `ai-image-index` (画像メタデータ) が正しく埋め込まれること。
  - Worddoc読み込み (`mammoth.js`) の動作確認。
- **状況**: `src/v2/utils/io.ts` を更新し、HTML保存処理にて DOM から `ai-image-index` 要素を取得・注入する処理を実装完了。

## 次のステップ

1. **[完了]** `src/v2/extensions/Pagination.ts` の内容確認と修正。
2. **[完了]** `src/v2/utils/io.ts` の内容確認と修正。
3. **[完了]** 最終ビルド確認 (`npm run build`).

**すべてのGap解析項目への対応が完了しました。**
