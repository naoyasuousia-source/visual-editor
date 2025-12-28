# 画像キャレットロジック仕様書

## 概要

このドキュメントは、Tiptap + React環境における画像キャレット（カーソル）制御ロジックの仕様を記述します。
他のAIモデルやエンジニアがこのロジックを理解・修正できるように設計されています。

---

## 技術スタック

- **フレームワーク**: React 18 + TypeScript
- **エディタ**: Tiptap (ProseMirrorベース)
- **状態管理**: Zustand
- **スタイル**: Tailwind CSS + Vanilla CSS

---

## ファイル構成

```
src/v2/
├── lib/
│   └── customImage.ts          ← 【中心】キャレットロジックの全実装
│
├── hooks/
│   └── useImageActions.ts      ← 画像操作（サイズ、枠線、削除等）
│
└── styles/
    └── content.css             ← 画像関連スタイル定義
```

---

## 画像キャレットの基本ルール

### 1. キャレット配置ルール

| 操作 | 動作 |
|-----|------|
| 画像クリック | 画像の**右辺（直後）**にテキストキャレットを配置 |
| 画像左辺へのキャレット移動 | **禁止** - 自動的に右辺に移動 |

### 2. キーボード操作

| キー | 条件 | 動作 |
|-----|------|------|
| `Enter` | キャレットが画像の右辺にある時 | 新しい段落を作成 |
| `Backspace` | キャレットが画像の右辺にある時 | 画像を削除（段落が画像のみの場合は段落ごと削除） |

### 3. 画像タイトル

| 項目 | 仕様 |
|-----|------|
| 表示位置 | 画像の直下、中央揃え |
| 編集可否 | 不可（`contenteditable="false"`） |
| 選択可否 | 不可（`user-select: none`） |
| キャレット挿入 | 不可 |

---

## 実装詳細

### customImage.ts（中心ファイル）

このファイルはTiptapの`Image`拡張を継承し、画像キャレットロジックをすべて実装しています。

#### 設定値

```typescript
export const CustomImage = TiptapImage.extend({
    inline: true,           // 段落(p)内にインラインで配置
    group: 'inline',        // インラインノードグループ
    atom: true,             // アトムノード（内部にキャレットを置かない）
    selectable: false,      // NodeSelectionを無効化
    draggable: false,       // ドラッグ無効
});
```

**重要**: `selectable: false`により、画像はNodeSelectionで選択されず、常にテキストキャレットを使用します。

#### 実装箇所

| メソッド | 役割 |
|---------|------|
| `addKeyboardShortcuts()` | Enter/Backspaceのキーボードショートカット処理 |
| `addProseMirrorPlugins()` | 左辺キャレット禁止プラグイン（`imageCaretPlugin`） |
| `addNodeView()` | 画像クリック時のキャレット配置＋タイトル表示 |

---

### キャレット禁止プラグイン（imageCaretPlugin）

```typescript
addProseMirrorPlugins() {
    return [
        new Plugin({
            key: new PluginKey('imageCaretPlugin'),
            
            appendTransaction: (transactions, oldState, newState) => {
                // 選択が変更されていない場合はスキップ
                const selectionChanged = transactions.some(tr => tr.selectionSet);
                if (!selectionChanged) return null;
                
                const { selection } = newState;
                if (!(selection instanceof TextSelection)) return null;
                
                const { $from, empty } = selection;
                if (!empty) return null;
                
                // 画像の直前（左辺）にキャレットがある場合
                const nodeAfter = $from.nodeAfter;
                if (nodeAfter?.type.name === 'image') {
                    // 画像の直後（右辺）に移動
                    const newPos = $from.pos + nodeAfter.nodeSize;
                    return newState.tr.setSelection(
                        TextSelection.create(newState.doc, newPos)
                    );
                }
                
                return null;
            },
        }),
    ];
}
```

**動作原理**:
1. トランザクションごとに選択変更を監視
2. キャレットの直後（`$from.nodeAfter`）に画像があれば「左辺にいる」と判定
3. 画像の直後（右辺）に強制移動

---

### 画像クリック時のキャレット配置

```typescript
const handleMouseDown = (event: MouseEvent) => {
    // 右クリックはスルー（コンテキストメニュー用）
    if (event.button === 2) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const pos = getPos();
    if (typeof pos === 'number') {
        // 画像の直後（右辺）にテキストキャレットを配置
        const imageEndPos = pos + node.nodeSize;
        const tr = editor.state.tr.setSelection(
            TextSelection.create(editor.state.doc, imageEndPos)
        );
        editor.view.dispatch(tr);
        editor.view.focus();
    }
};
```

**ポイント**:
- `getPos()`: 画像ノードの開始位置を取得
- `node.nodeSize`: 画像ノードのサイズ（通常1）
- `imageEndPos = pos + node.nodeSize`: 画像の直後の位置

---

### useImageActions.ts（画像操作フック）

このフックは画像操作（サイズ変更、枠線、削除等）を提供します。

#### 画像の特定方法

```typescript
const { state } = editor;
const { selection } = state;
const { $from, empty } = selection;

// キャレットの直前のノードが画像かチェック
if (empty && $from.nodeBefore?.type.name === 'image') {
    // この画像を操作対象とする
    const imagePos = $from.pos - $from.nodeBefore.nodeSize;
    // ...
}
```

**重要**: `$from.nodeBefore`を使用する理由
- `selectable: false`のため、Tiptapの`getAttributes('image')`が正しく動作しない場合がある
- キャレットは常に画像の右辺にあるため、`nodeBefore`で画像を特定可能

---

## CSS構造

### 画像コンテナ

```css
.page-inner .image-container {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    line-height: 0;      /* 余計な行を削除 */
    font-size: 0;        /* 余計な行を削除 */
    vertical-align: top;
}
```

### 画像タイトル

```css
.page-inner .image-title {
    display: block;
    width: 100%;
    text-align: center;
    font-size: 11pt;
    line-height: 1.4;
    color: #333;
    margin-top: 4px;
    user-select: none;       /* 選択不可 */
    pointer-events: none;    /* クリック不可 */
}
```

### 余計な行の削除

```css
/* 画像を含む段落の余計なスペースを削除 */
.page-inner p:has(> img:not(.ProseMirror-separator)),
.page-inner p:has(> .image-container) {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 0;
    font-size: 0;
    padding: 0;
}

/* ProseMirrorの自動挿入brを非表示 */
.page-inner p:has(> img:not(.ProseMirror-separator)) .ProseMirror-trailingBreak,
.page-inner p:has(> .image-container) .ProseMirror-trailingBreak {
    display: none;
}
```

---

## デバッグガイド

### 問題: キャレットが画像右辺に表示されない

1. **確認箇所**: `customImage.ts` の `addNodeView()` 内の `handleMouseDown`
2. **チェックポイント**:
   - `getPos()`が正しい数値を返しているか
   - `TextSelection.create()`が正しく呼ばれているか
   - `editor.view.focus()`が呼ばれているか

### 問題: 左辺にキャレットが入ってしまう

1. **確認箇所**: `customImage.ts` の `addProseMirrorPlugins()`
2. **チェックポイント**:
   - プラグインが正しく登録されているか
   - `$from.nodeAfter?.type.name === 'image'`の判定が正しいか

### 問題: Backspace/Enterが動作しない

1. **確認箇所**: `customImage.ts` の `addKeyboardShortcuts()`
2. **チェックポイント**:
   - `$from.nodeBefore?.type.name === 'image'`の判定が正しいか
   - 段落削除ロジック（`parentNode.content.size === 1`）が正しいか

### 問題: コンテキストメニューが動作しない

1. **確認箇所**: `useImageActions.ts`
2. **チェックポイント**:
   - `$from.nodeBefore`で画像が正しく特定されているか
   - 操作後に`view.dispatch(tr)`が呼ばれているか

---

## 変更履歴

| 日付 | 変更内容 |
|-----|---------|
| 2025-12-28 | 画像キャレットロジックを完全に再構築。NodeSelectionからTextSelectionに移行。 |
| 2025-12-28 | 左辺キャレット禁止プラグイン（imageCaretPlugin）を追加 |
| 2025-12-28 | 画像タイトル表示機能を追加 |
| 2025-12-28 | 古いDOM操作ベースのコード（selectionState.ts）を削除 |

---

## 注意事項

1. **直接DOM操作は禁止**: すべてのキャレット操作はTiptap/ProseMirrorのAPIを使用すること
2. **選択は常にTextSelection**: `selectable: false`のため、NodeSelectionは使用しない
3. **画像の特定は`$from.nodeBefore`**: キャレットは常に画像の右辺にあるため

