# React + Tiptap 移行・UI完全再現計画

## 概要
UI/機能をLegacyエディタ (`index.html`) と **100%一致** させます。
現時点で確認された構造的差異、クラス名の不一致、属性の欠落を全て解消します。

## 構造・機能 差異分析結果 (GAP Analysis)

### 1. ツールバー (`Toolbar.tsx` vs `index.html`)
- **File Menu**: React版はフラットなリストですが、Legacy版は「ハイパーリンク」「画像挿入」「余白」が **ネストされたドロップダウン** (`.nested-dropdown`) になっています。この構造を完全に再現する必要があります。
- **View Menu**: React版のチェックボックス構造 (`label.menu-item-label`) の厳密な一致が必要です。
- **Right Group**: 「標準モード」「Word互換モード」の切り替え表示用SPAMタグ (`.mode-text-std`, `.mode-text-word`) が不足しています。
- **Zoom Controls**: `data-action="zoom-in"`, `data-action="zoom-out"` 属性が欠落。

### 2. フォントメニュー (`FontMenu.tsx`)
- **クラス名不一致**: 
    - 誤: `className="color-swatch"`
    - 正: `className="color-swatch-button"` (`ui.css` のスタイル適用に必須)
- **コンテンツ不足**: フォントファミリーのリストが「実装予定」のまま空になっています。Legacyの全フォントリスト（游ゴシック, Meiryo, BIZ UD等）を移植する必要があります。
- **属性不足**: `data-action`, `data-family` 属性がありません。

### 3. 段落メニュー (`ParagraphMenu.tsx`)
- **属性不足**: `data-action`, `data-size` 等の属性がありません。
- **UI挙動**: 「ぶら下げ」チェックボックスの初期状態やdisable制御のロジックを確認・再現する必要があります。

### 4. 機能・属性
- **Data Attributes**: `ui.css` や将来的な拡張のため、全てのボタンに `index.html` と同一の `data-action` 属性を付与します。
- **Active State**: ボタンの押下状態（太字等）において、Legacyの挙動（あるいはTiptapとしての正解）を `ui.css` に `.active` クラスとして定義し、React側で適用します。

## 実行フェーズ

### Phase 1: 基盤整備と安全対策 [完了]
- [x] `ErrorBoundary` の導入

### Phase 2: メニューバー構造の完全再現
- [ ] **共通**: `Toolbar.tsx` 内のボタンに `data-action` 属性を網羅的に追加
- [ ] **File Menu**: ネスト構造 (`.nested-dropdown`) の実装と `FileMenu` コンポーネント化推奨
- [ ] **Font Menu**: 
    - [ ] `color-swatch` → `color-swatch-button` クラス修正
    - [ ] フォントファミリーリストの完全移植
- [ ] **Word Mode**: `ui_word_mode.css` との連動確認、「Word互換モード」切替UIのDOM完全再現（`.mode-text-std` 等の復活）

### Phase 3: ダイアログとサブ機能の移植
- [ ] **Dialogs**: 
    - [ ] `ImageTitleDialog` (画像タイトル)
    - [ ] `ImageCaptionDialog` (キャプション)
    - [ ] `ParagraphJumpDialog` (ジャンプ機能)
- [ ] **Bubble Menu**: 
    - [ ] 画像選択時のコンテキストメニュー (`.image-context-menu`) の再現（現在はBubbleMenuとして実装中だが、DOM構造とクラス名をLegacyに寄せるかどうか要検討。Tiptap流儀とLegacy CSSの折衷案を作成）

### Phase 4: 最終UI/UX検証
- [ ] LegacyエディタとReactエディタを並べて比較
- [ ] 全ボタンの挙動、ツールチップ、ホバー効果の一致確認
- [ ] コンソールエラー 0 件の達成

## Phase 6: Professional Refactoring (Modern Stack & Best Practices)
Refactor the codebase to leverage modern React patterns and the installed libraries ("Right tool for the right job").

### Dependencies
- **State Management**: `zustand` (Avoid prop drilling, cleaner store).
- **Notifications**: `sonner` (Replace `alert`, professional toasts).
- **UI Components**: Fully leverage `@mui/material` & `framer-motion`.

### Architecture Changes
- **Global Store**: Create `useAppStore` to manage:
    - `zoomLevel`
    - `pageMargin`
    - `isWordMode`
    - `activeDialog` (manage dialog visibility centrally)
- **Component Cleanup**: Remove massive prop passing in `App.tsx` and `Toolbar.tsx`.

## Verification Plan
