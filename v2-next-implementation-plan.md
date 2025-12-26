# AI-Link Editor v2 機能完全引継ぎ実装計画書

## 1. 現状分析

### v2で実装済み（✅）

#### 基盤機能
- ✅ Tiptap Extension ベースのエディタ
- ✅ A4ページレイアウト（`pageExtension.ts`）
- ✅ 段落番号管理（標準/Wordモード対応）（`paragraphNumbering.ts`）
- ✅ AI Image Index（`AIImageIndex.tsx`）
- ✅ IME制御（`useIMEControl.ts`）
- ✅ ペースト制御（`usePasteControl.ts`）

#### UI機能
- ✅ ツールバー（基本フォーマット）
- ✅ 画像挿入（Dropbox、WebURL）
- ✅ 画像メタデータ編集ダイアログ
- ✅ ズーム機能
- ✅ ジャンプ機能

---

### v2で未実装・不完全（❌⚠️）

## 2. 優先度別引継ぎ計画

---

## 【優先度: 最高】ページネーションロジックの完全引継ぎ

### 問題点
v2の`pagination.ts`は基本的なオーバーフロー検知のみ。v1の高度なロジックが未引継ぎ。

### v1の実装（`src/v1/editor/page.ts`）

#### 引継ぎが必要な機能

**1. 精密なオーバーフロー検知** (L120-127)
```typescript
// v1: 1pxバッファを使った正確な検知
if (pageInner.scrollHeight > pageInner.clientHeight + 1) {
    moveOverflowingContent(pageInner);
}
```
- v2状況: ⚠️ 基本実装あり、but精度に課題

**2. 段落単位での移動ロジック** (L129-206)
```typescript
// v1の詳細:
// - offsetTopとoffsetHeightで溢れている子要素を特定
// - selectionを保持しながら次ページに移動
// - カーソル位置を正確に復元
```
- v2状況: ❌ 最後の子要素のみ移動（v1は複数段落を一括移動）

**3. Selection Restoration** (L173-202)
```typescript
// v1: 移動した要素にカーソルがある場合、
// 次ページに移動後もカーソル位置を完全復元
const anchorNode = selection.anchorNode;
const anchorOffset = selection.anchorOffset;
// 移動後に復元
```
- v2状況: ❌ 未実装

**4. 再帰的オーバーフローチェック** (L205)
```typescript
// v1: 移動後に次ページも再チェック（連鎖処理）
checkPageOverflow(nextInner);
```
- v2状況: ❌ 未実装

### 実装計画

**[MODIFY]** `src/v2/lib/pagination.ts`
```typescript
// v1のmoveOverflowingContentロジックを完全移植:
// 1. offsetTopベースの正確な溢れ検知
// 2. 複数段落の一括移動
// 3. Selection state保存・復元
// 4. 再帰的チェック
```

---

## 【優先度: 最高】Selection管理ロジックの引継ぎ

### v1の実装（`src/v1/editor/selection.ts`）

#### 引継ぎが必要な機能

**1. computeSelectionStateFromRange** (L46-79)
```typescript
// 段落IDとオフセットでselectionを保存
// ページ追加/削除時もIDで追跡可能
```
- v2状況: ❌ 未実装（Tiptapに任せているが不十分）

**2. restoreRangeFromSelectionState** (L81-93)
```typescript
// 保存したstateからrangeを復元
```
- v2状況: ❌ 未実装

**3. placeCaretBefore/After** (L95-117)
```typescript
// 画像挿入後のカーソル配置に必須
```
- v2状況: ⚠️ 一部実装あり、but不完全

**4. getEffectiveTextRange** (L141-165)
```typescript
// 最後の有効なtext rangeを記憶・復元
// フォーマット操作時のselection消失を防ぐ
```
- v2状況: ❌ 未実装

### 実装計画

**[NEW]** `src/v2/utils/selectionState.ts`
```typescript
// v1のselection.tsを完全移植
export function computeSelectionStateFromRange(range: Range | null): SelectionState | null
export function restoreRangeFromSelectionState(state: SelectionState): Range | null
export function placeCaretBefore(node: Element): void
export function placeCaretAfter(node: Element): void
export function getEffectiveTextRange(): Range | null
```

**[MODIFY]** `src/v2/hooks/useImageInsert.ts`
- placeCaretBefore/Afterを使用してカーソル配置を改善

---

## 【優先度: 高】フォーマット機能の完全引継ぎ

### v1の実装（`src/v1/editor/formatting.ts`）

#### 引継ぎが必要な機能

**1. execWithSelectionRestore** (L33-53)
```typescript
// フォーマット操作時にselectionを自動保存・復元
// v1ではすべてのフォーマット関数がこれを使用
```
- v2状況: ❌ 未実装（Tiptap commandに依存、but不十分）

**2. removeHighlightsInRange** (L278-297)
```typescript
// ハイライト削除のきめ細かい制御
```
- v2状況: ⚠️ 基本実装あり、but詳細ロジック未移植

**3. applyParagraphSpacing** (L458-481)
```typescript
// 段落間隔の調整（xs, s, m, l, xl）
```
- v2状況: ❌ 未実装

**4. changeIndent** (L374-386)
```typescript
// インデントの増減（0-5レベル）
// クラス名ベースで管理
```
- v2状況: ⚠️ Tiptapの基本機能のみ（v1の詳細制御なし）

**5. toggleHangingIndent** (L363-372)
```typescript
// ぶら下げインデント
```
- v2状況: ❌ 未実装

### 実装計画

**[NEW]** `src/v2/hooks/useFormattingActions.ts`
```typescript
// v1 formatting.tsの主要ロジックを移植
export const useFormattingActions = (editor: Editor | null) => {
  return {
    applyParagraphSpacing: (size: string) => { /* v1ロジック */ },
    changeIndent: (delta: number) => { /* v1ロジック */ },
    toggleHangingIndent: (enabled: boolean) => { /* v1ロジック */ },
    // ...
  }
}
```

**[MODIFY]** `src/v2/components/features/Toolbar.tsx`
- 段落間隔、ぶら下げインデントボタンを追加

---

## 【優先度: 高】検索・ジャンプ機能の引継ぎ

### v1の実装（`src/v1/utils/search.ts`、`src/v1/ui/navigator.ts`）

#### 引継ぎが必要な機能

**1. highlightSearchMatches** (L55-83)
```typescript
// テキスト検索でマッチ箇所をハイライト
// 1件のみの場合は自動スクロール
// 複数件の場合はエラーメッセージ
```
- v2状況: ❌ 未実装

**2. countSearchMatches** (L22-49)
```typescript
// マッチ数をカウント（重複判定に使用）
```
- v2状況: ❌ 未実装

**3. jumpToParagraph** (L258-326)
```typescript
// 段落ID or テキスト検索でジャンプ
// - 標準モード: "1-5" → "p1-5"
// - Wordモード: "5" → "p5"
// - テキスト: ハイライト表示
```
- v2状況: ⚠️ 段落IDジャンプのみ（テキスト検索未実装）

### 実装計画

**[NEW]** `src/v2/utils/searchHighlight.ts`
```typescript
// v1 search.tsを移植
export function highlightSearchMatches(query: string, containers: Element[]): HTMLElement | null
export function countSearchMatches(query: string, containers: Element[]): number
export function clearSearchHighlights(): void
```

**[MODIFY]** `src/v2/hooks/useJumpNavigation.ts`
- テキスト検索機能を統合

---

## 【優先度: 高】画像挿入・管理の完全引継ぎ

### v1の実装（`src/v1/editor/image.ts`）

#### 引継ぎが必要な機能

**1. caret-slot挿入** (L254-263)
```typescript
// 画像挿入後、編集可能なスロットを配置
const caretSlot = document.createElement('span');
caretSlot.className = 'caret-slot';
caretSlot.contentEditable = 'false';
caretSlot.innerHTML = '&#8203;'; // Zero-width space
```
- v2状況: ❌ 未実装

**2. figure-title処理** (L329-473)
```typescript
// 画像タイトルの追加・削除
// フォントサイズ（default/mini）の切替
// 段落タグ変換（p ⇔ h6）
```
- v2状況: ⚠️ タイトル入力のみ（詳細ロジック未移植）

**3. removeExistingImageTitle** (L392-415)
```typescript
// 既存タイトルの正確な削除（br、caret-slot含む）
```
- v2状況: ❌ 未実装

**4. ensureFigureWrapper** (DOM util)
```typescript
// figure要素でラップ（インライン配置制御）
```
- v2状況: ❌ 未実装

### 実装計画

**[MODIFY]** `src/v2/hooks/useImageInsert.ts`
- caret-slot挿入ロジックを追加

**[MODIFY]** `src/v2/hooks/useImageActions.ts`
- figure-title詳細処理を移植

**[NEW]** `src/v2/utils/figureDom.ts`
```typescript
// figure wrapper関連のDOM操作
export function ensureFigureWrapper(paragraph: HTMLElement): HTMLElement | null
```

---

## 【優先度: 中】ツールバー状態管理の引継ぎ

###v1の実装（`src/v1/ui/toolbar.ts`）

#### 引継ぎが必要な機能

**1. updateToolbarState** (L56-98)
```typescript
// 現在の段落に応じてツールバーボタンの状態更新
// - ぶら下げインデントチェックボックス有効/無効
// - ブロック要素ラベル表示
```
- v2状況: ❌ 未実装

**2. updateMarginButtonState** (L38-45)
```typescript
// ページ余白ボタンのaria-pressed状態管理
```
- v2状況: ❌ 未実装

**3. zoom機能** (L299-311)
```typescript
// CSS zoom propertyを使用したズーム
// 50%〜200%（10%刻み）
```
- v2状況: ⚠️ transformベース（v1はzoomプロパティ）

### 実装計画

**[NEW]** `src/v2/hooks/useToolbarState.ts`
```typescript
// v1の状態管理ロジックを移植
export const useToolbarState = (editor: Editor | null) => {
  // updateToolbarState相当の処理
}
```

---

## 【優先度: 中】サムネイルナビゲーターの完全実装

### v1の実装（`src/v1/ui/navigator.ts`）

#### v2で未実装の機能

**1. MutationObserverによるリアルタイム更新** (L102-156)
```typescript
// ページ構造変化を監視し、サムネイルを自動更新
```
- v2状況: ❌ 未実装

**2. updateThumbnailContent** (L70-93)
```typescript
// 特定ページのサムネイルのみ更新（効率化）
```
- v2状況: ❌ 未実装

**3. miniature-pageのクローン処理** (L32-47)
```typescript
// IDを削除してクローン（DOM重複回避）
// contentEditableをfalseに設定
```
- v2状況: ❌ 未実装（PageNavigatorは番号リストのみ）

### 実装計画

**[NEW]** `src/v2/components/features/Sidebar.tsx`
```typescript
// v1 navigator.tsの機能を完全実装
// - サムネイル画像生成
// - MutationObserver
// - クリックでジャンプ
```

---

## 【優先度: 低】その他の細かい機能

### 1. ページ余白調整（`src/v1/ui/settings.ts`）
- v2状況: ❌ 未実装
- 計画: CSS変数で実装可能

### 2. リンク管理（`src/v1/editor/links.ts`）
- v2状況: ⚠️ Tiptap Linkのみ（v1のadd-link-destination等は未移植）
- 計画: Tiptap Link拡張で対応

### 3. AI Meta Guideの動的生成（`src/v1/editor/ai-meta.ts`）
- v2状況: ❌ 未実装（静的HTML埋め込みのみ）
- 計画: `buildFullHTML`改修

---

## 3. 実装順序（推奨）

### フェーズ1: 基盤強化（1-2週間）
1. ✅ Selection管理ロジック移植
2. ✅ ページネーション精密化
3. ✅ フォーマット機能完全化

### フェーズ2: UI/UX向上（1週間）
4. ✅ 検索・ジャンプ機能
5. ✅ 画像挿入詳細ロジック
6. ✅ ツールバー状態管理

### フェーズ3: 追加機能（1週間）
7. ✅ サムネイルナビゲーター
8. ✅ その他細かい機能

---

## 4. 技術的制約とアプローチ

### Tiptap vs v1（vanilla TS + contentEditable）

| 項目 | v1アプローチ | v2アプローチ | 移植方法 |
|------|-------------|-------------|---------|
| Selection管理 | DOM Range直接操作 | Tiptap Transaction | utilsに分離、Tiptapと併用 |
| ページネーション | DOM操作 | Tiptap Plugin | Plugin内でDOM参照 |
| フォーマット | execCommand | Tiptap Commands | hooksでラップ |

### rules.md準拠の方針

- ✅ 全て`src/v2/`配下に配置
- ✅ hooks（`use*.ts`）、utils（`*.ts`）でロジック分離
- ✅ コンポーネントは300行以内
- ✅ `@/`エイリアス使用

---

## 5. 検証計画

### 機能テスト
- [ ] ページオーバーフロー（長文入力）
- [ ] 画像挿入後のカーソル位置
- [ ] フォーマット操作後のselection保持
- [ ] テキスト検索ジャンプ
- [ ] サムネイル自動更新

### パフォーマンステスト
- [ ] 100ページ以上のドキュメント
- [ ] リアルタイムサムネイル更新負荷

---

## 6. リスクと対策

### リスク1: TiptapとDOMの二重管理
**対策**: Pluginの`view.dom`経由でDOM操作、状態はTiptapに集約

### リスク2: v1ロジックのReact化の複雑さ
**対策**: utilsに純粋関数で実装、hooksは薄いラッパーに

### リスク3: パフォーマンス劣化
**対策**: debounce、仮想化、段階的レンダリング
