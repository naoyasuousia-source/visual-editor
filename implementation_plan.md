# 実装計画書：AI-Link Editor ver2.0 刷新プロジェクト

本プロジェクトは、既存の「AI-Link Editor」を最新のモダンな技術スタック（React, Tailwind CSS, shadcn/ui, Tiptap）で再構築し、生成AIとの連携精度とユーザー体験を大幅に向上させることを目的とします。

## ユーザーレビューが必要な事項
> [!IMPORTANT]
> **A4ページネーションの挙動について**
> Tiptap上での厳密なA4ページングは、ブラウザのレンダリングエンジンに依存するため、文字数や行間によって微妙なズレが生じる可能性があります。PDF出力時はブラウザの印刷機能（@media print）を使用して最適化しますが、編集画面との完全一致には微調整が必要になる場合があります。

> [!NOTE]
> **Word互換モードの制限**
> Word互換モードでは、docxへの変換精度を優先するため、画像挿入や複雑な装飾機能を一部制限します。これは `mammoth.js` や `docx` ライブラリの仕様に準拠するためです。

## 提案される変更点

### 1. プロジェクト構成の整理
現在の `src/v3` ディレクトリを AI-Link Editor ver2.0 のメインディレクトリとして使用します。既存の TS エラーを解消しつつ、設計思想に基づいたディレクトリ構成に再編します。

---

### 2. 編集エンジン (Tiptap)
Tiptapの拡張機能（Extension）として、独自機能を実装します。

#### [NEW] [Pagination.ts](file:///c:/Users/user/Desktop/ビジネス/project-root/src/v3/extensions/Pagination.ts)
- 文書の高さを監視し、A4サイズ（210mm x 297mm）を超えた場合に自動でページ分割を行うロジック。
#### [NEW] [ParagraphNumbering.ts](file:///c:/Users/user/Desktop/ビジネス/project-root/src/v3/extensions/ParagraphNumbering.ts)
- `renumberParagraphs` 関数を実装し、標準モード（p1-1形式）とWordモード（p1形式）を動的に切り替える仕組み。
#### [MODIFY] [Editor.tsx](file:///c:/Users/user/Desktop/ビジネス/project-root/src/v3/Editor.tsx)
- 日本語IME入力中のEnterキー制御。`compositionstart` / `compositionend` イベントを利用し、変換確定時のEnterで改行されないように制御。

---

### 3. UI コンポーネント (shadcn/ui)
モダンでプレミアムなUIを提供します。

#### [NEW] [Menubar.tsx](file:///c:/Users/user/Desktop/ビジネス/project-root/src/v3/components/Menubar.tsx)
- 要件定義に基づいた、多機能メニューバー。標準/Wordモードでの動的なボタン表示切り替えを実装。
#### [NEW] [Sidebar.tsx](file:///c:/Users/user/Desktop/ビジネス/project-root/src/v3/components/Sidebar.tsx)
- ページのリアルタイムサムネイル表示。スクロール同期ジャンプ機能。
#### [NEW] [ImageContextMenu.tsx](file:///c:/Users/user/Desktop/ビジネス/project-root/src/v3/components/ImageContextMenu.tsx)
- 画像右クリック時のサイズ変更、枠線トグル、メタデータ編集UI。

---

### 4. AI連携・特殊ロジック
AIが文書構造を完全に理解するための仕組み。

#### [MODIFY] [useAppStore.ts](file:///c:/Users/user/Desktop/ビジネス/project-root/src/v3/store/useAppStore.ts)
- モードステート、ズーム倍率、ai-image-index のキャッシュ管理。
#### [NEW] [AIImageIndex.tsx](file:///c:/Users/user/Desktop/ビジネス/project-root/src/v3/components/AIImageIndex.tsx)
- 不可視の `#ai-image-index` 領域のレンダリング。エディタ内の画像とメタデータの完全な同期。

---

### 5. ファイル I/O
#### [MODIFY] [io.ts](file:///c:/Users/user/Desktop/ビジネス/project-root/src/v3/utils/io.ts)
- HTML保存時の `ai-image-index` 埋め込み。
- `mammoth.js` を用いた Word 読み込み（Word互換モード用）。

## 検証プラン

### 自動テスト
- `renumberParagraphs` のロジックテスト（ページ跨ぎ時のIDが正しいか）。
- 異なる画面サイズでの A4 レイアウト維持テスト。

### 手動検証
- **日本語入力テスト**: IME変換確定時の改行バグが発生しないことの確認。
- **PDF出力**: Chromeの印刷ダイアログで、レイアウトが崩れずPDF化できることの確認。
- **AI解析テスト**: 出力されたHTMLを生成AI（Claude 3.5 Sonnet等）に読み込ませ、段落IDを指定した指示が通るか確認。
