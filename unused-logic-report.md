# 未使用・ゴミロジック検出レポート

## 実行日時
2025-12-26 23:09

## 検出結果

### ❌ 問題のあるファイル

#### 1. **`hooks/useFormattingActions.ts`** - 部分的に未使用
**状態**: 作成済みだが、componentsから使われていない
**使用箇所**: `useToolbarState.ts`からのみ参照
**問題**: ParagraphMenuが直接ロジックを書いており、このhookを使っていない

**影響**: 
- インデント、段落間隔、ぶら下げインデント、行間の機能が使えない
- ParagraphMenuに重複ロジックあり

#### 2. **`hooks/useToolbarState.ts`** - 完全未使用 ❌
**状態**: 作成済み
**使用箇所**: なし
**問題**: どのcomponentからも使われていない

**内容**:
```typescript
export const useToolbarState = (editor: Editor | null) => {
    const formattingActions = useFormattingActions(editor);
    
    const updateToolbarState = () => {
        // ツールバー状態更新ロジック
    };
    
    return { updateToolbarState };
};
```

#### 3. **`utils/figureDom.ts`** - 完全未使用 ❌
**状態**: 作成済み
**使用箇所**: なし
**問題**: どのhookからも使われていない

**内容**:
```typescript
export function ensureFigureWrapper(paragraph): HTMLElement | null
export function createCaretSlot(): HTMLSpanElement
export function removeExistingImageTitle(img): void
```

### ✅ 使用されているファイル

#### hooks/
- ✅ `useBrowserCheck.ts` - App.tsxで使用
- ✅ `useDialogs.ts` - App.tsxで使用
- ✅ `useFileIO.ts` - FileMenuで使用
- ✅ `useIMEControl.ts` - App.tsxで使用
- ✅ `useImageActions.ts` - ImageBubbleMenu等で使用
- ✅ `useImageIndex.ts` - App.tsxで使用
- ✅ `useImageInsert.ts` - FileMenuで使用
- ✅ `useJumpNavigation.ts` - Toolbarで使用
- ✅ `usePageOperations.ts` - App.tsxで使用
- ✅ `useParagraphNumberToggle.ts` - Toolbarで使用
- ✅ `usePasteControl.ts` - App.tsxで使用

#### utils/
- ✅ `aiMetadata.ts` - useFileIOで使用
- ✅ `io.ts` - useFileIOで使用
- ✅ `searchHighlight.ts` - useJumpNavigationで使用
- ✅ `selectionState.ts` - paginationで使用

#### lib/
- ✅ `customImage.ts` - App.tsx extensionsで使用
- ✅ `pageExtension.ts` - App.tsx extensionsで使用
- ✅ `pagination.ts` - App.tsx extensionsで使用
- ✅ `paragraphNumbering.ts` - App.tsx extensionsで使用
- ✅ `styleAttributes.ts` - App.tsx extensionsで使用

## 修正が必要な箇所

### 1. ParagraphMenu.tsx
**現状**: 直接ロジックを記述
```tsx
// ❌ 現在
<MenuItem onSelect={() => {
    const currentIndent = editor.getAttributes('paragraph').indent || 0;
    editor.chain().focus().updateAttributes('paragraph', {
        indent: Math.min(currentIndent + 1, 5)
    }).run();
}}>
```

**修正後**: useFormattingActionsを使用
```tsx
// ✅ 修正後
const { changeIndent } = useFormattingActions(editor);

<MenuItem onSelect={() => changeIndent(1)}>
```

### 2. useToolbarState.ts
**選択肢**:
- A) Toolbarで使用するように修正
- B) 不要なら削除

### 3. figureDom.ts
**選択肢**:
- A) useImageActionsで使用するように修正
- B) 不要なら削除

## まとめ

### ゴミロジック判定

❌ **ゴミロジックあり（3ファイル）**:
1. `useFormattingActions.ts` - 作成済みだが未使用
2. `useToolbarState.ts` - 完全未使用
3. `figureDom.ts` - 完全未使用

### 問題の原因
- hooksを作成したが、componentsで使用していない
- componentsが直接ロジックを書いている（rules.md違反）

### 修正方針
1. ParagraphMenuを修正してuseFormattingActionsを使用
2. useToolbarStateとfigureDomは削除または統合
