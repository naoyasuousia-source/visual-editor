# 画像ロジック仕様書

## 概要

このドキュメントは、Tiptap + React環境における画像関連ロジック（キャレット制御・メタデータ編集）の仕様を記述します。
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
│   └── customImage.ts              ← 【中心】キャレット・タイトル表示ロジック
│
├── hooks/
│   └── useImageActions.ts          ← 画像操作（サイズ、枠線、削除等）
│
├── components/common/
│   ├── editor-menus/
│   │   └── ImageContextMenu.tsx    ← 右クリックメニュー（キャレット移動処理含む）
│   │
│   └── dialogs/
│       ├── ImageTitleDialog.tsx    ← タイトル編集ダイアログ
│       ├── ImageCaptionDialog.tsx  ← キャプション編集ダイアログ
│       └── ImageTagDialog.tsx      ← タグ編集ダイアログ
│
└── styles/
    └── content.css                 ← 画像関連スタイル定義
```

---

## 第1章: 画像キャレットロジック

### 1.1 基本ルール

| 操作 | 動作 |
|-----|------|
| 画像クリック | 画像の**右辺（直後）**にテキストキャレットを配置 |
| 画像左辺へのキャレット移動 | **禁止** - 自動的に右辺に移動 |

### 1.2 キーボード操作

| キー | 条件 | 動作 |
|-----|------|------|
| `Enter` | キャレットが画像の右辺にある時 | 新しい段落を作成 |
| `Backspace` | キャレットが画像の右辺にある時 | 画像を削除（段落が画像のみの場合は段落ごと削除） |

### 1.3 customImage.ts の設定値

```typescript
export const CustomImage = TiptapImage.extend({
    inline: true,           // 段落(p)内にインラインで配置
    group: 'inline',        // インラインノードグループ
    atom: true,             // アトムノード（内部にキャレットを置かない）
    selectable: false,      // NodeSelectionを無効化
    draggable: false,       // ドラッグ無効
});
```

**重要**: `selectable: false`により、画像はNodeSelectionで選択されず、**常にテキストキャレットを使用**します。

### 1.4 実装箇所

| メソッド | 役割 |
|---------|------|
| `addKeyboardShortcuts()` | Enter/Backspaceのキーボードショートカット処理 |
| `addProseMirrorPlugins()` | 左辺キャレット禁止プラグイン（`imageCaretPlugin`） |
| `addNodeView()` | 画像クリック時のキャレット配置＋タイトル表示 |

### 1.5 左辺キャレット禁止プラグイン（imageCaretPlugin）

```typescript
addProseMirrorPlugins() {
    return [
        new Plugin({
            key: new PluginKey('imageCaretPlugin'),
            
            appendTransaction: (transactions, oldState, newState) => {
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

### 1.6 画像クリック時のキャレット配置

```typescript
const handleMouseDown = (event: MouseEvent) => {
    if (event.button === 2) return; // 右クリックはスルー
    
    event.preventDefault();
    event.stopPropagation();
    
    const pos = getPos();
    if (typeof pos === 'number') {
        const imageEndPos = pos + node.nodeSize;
        const tr = editor.state.tr.setSelection(
            TextSelection.create(editor.state.doc, imageEndPos)
        );
        editor.view.dispatch(tr);
        editor.view.focus();
    }
};
```

---

## 第2章: 画像タイトル・メタデータ

### 2.1 画像属性一覧

| 属性名 | 説明 | データ属性 |
|--------|------|-----------|
| `title` | 画像タイトル（画像下に表示） | `data-title` |
| `titleSize` | タイトルサイズ（`default` / `mini`） | `data-title-size` |
| `caption` | キャプション（AIインデックス用） | `data-caption` |
| `tag` | タグ（カンマ区切り） | `data-tag` |
| `size` | 画像サイズ（`xs`, `s`, `m`, `l`, `xl`） | CSSクラス `img-{size}` |
| `hasBorder` | 枠線有無 | CSSクラス `has-border` |

### 2.2 タイトル表示の仕組み

タイトルは`customImage.ts`の`addNodeView()`内で、画像コンテナ内に`<span class="image-title">`として挿入されます。

```typescript
// タイトル要素（タイトルがある場合のみ表示）
if (node.attrs.title) {
    titleEl = document.createElement('span');
    titleEl.classList.add('image-title');
    if (node.attrs.titleSize === 'mini') {
        titleEl.classList.add('image-title-mini');
    }
    titleEl.textContent = node.attrs.title;
    titleEl.setAttribute('contenteditable', 'false');
    container.appendChild(titleEl);
}
```

### 2.3 タイトルの仕様

| 項目 | 仕様 |
|-----|------|
| 表示位置 | 画像の直下、中央揃え |
| 編集可否 | 不可（`contenteditable="false"`） |
| 選択可否 | 不可（`user-select: none`） |
| キャレット挿入 | 不可 |

### 2.4 メタデータ編集ダイアログ

#### 【重要】`selectable: false` への対応

`selectable: false`に設定しているため、通常の`editor.getAttributes('image')`が正しく動作しない場合があります。

**解決策**: キャレットの直前のノード（`$from.nodeBefore`）から画像を特定します。

```typescript
// 画像属性の取得
const { state } = editor;
const { $from } = state.selection;
const nodeBefore = $from.nodeBefore;

if (nodeBefore?.type.name === 'image') {
    // nodeBefore.attrs から属性を取得
    setTitle(nodeBefore.attrs.title || '');
}

// 画像属性の更新
if (empty && $from.nodeBefore?.type.name === 'image') {
    const imagePos = $from.pos - $from.nodeBefore.nodeSize;
    const tr = state.tr.setNodeMarkup(imagePos, undefined, {
        ...$from.nodeBefore.attrs,
        title: title.trim(),
        titleSize: fontSize
    });
    view.dispatch(tr);
}
```

### 2.5 各ダイアログの役割

| ダイアログ | ファイル | 編集対象 |
|-----------|---------|---------|
| タイトル編集 | `ImageTitleDialog.tsx` | `title`, `titleSize` |
| キャプション編集 | `ImageCaptionDialog.tsx` | `caption` |
| タグ編集 | `ImageTagDialog.tsx` | `tag` |

---

## 第3章: 画像操作（useImageActions）

### 3.1 提供機能

| 関数名 | 役割 |
|--------|------|
| `setImageSize` | 画像サイズ変更 |
| `toggleImageBorder` | 枠線トグル |
| `deleteImage` | 画像削除（段落ごと削除対応） |
| `editTitle` | タイトル編集ダイアログを開く |
| `editCaption` | キャプション編集ダイアログを開く |
| `editTags` | タグ編集ダイアログを開く |
| `getCurrentImageAttrs` | 現在の画像属性を取得 |

### 3.2 画像の特定方法

```typescript
const { state } = editor;
const { selection } = state;
const { $from, empty } = selection;

// キャレットの直前のノードが画像かチェック
if (empty && $from.nodeBefore?.type.name === 'image') {
    const imagePos = $from.pos - $from.nodeBefore.nodeSize;
    // setNodeMarkup で属性を更新
}
```

---

## 第4章: CSS構造

### 4.1 画像コンテナ

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

### 4.2 画像タイトル

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

.page-inner .image-title-mini {
    font-size: 9pt;
    color: #666;
}
```

### 4.3 余計な行の削除

```css
.page-inner p:has(> img:not(.ProseMirror-separator)),
.page-inner p:has(> .image-container) {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 0;
    font-size: 0;
    padding: 0;
}

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

### 問題: タイトル・メタデータが編集できない

1. **確認箇所**: 各ダイアログ（`ImageTitleDialog.tsx`等）
2. **チェックポイント**:
   - `$from.nodeBefore`で画像が正しく特定されているか
   - `state.tr.setNodeMarkup()`で正しく更新されているか
   - 画像の右辺にキャレットがあるか

### 問題: タイトルが画像下に表示されない

1. **確認箇所**: `customImage.ts` の `addNodeView()` 内のタイトル生成ロジック
2. **チェックポイント**:
   - `node.attrs.title`に値が入っているか
   - `container.appendChild(titleEl)`が呼ばれているか
   - CSSの`.image-title`が正しく適用されているか

### 問題: コンテキストメニューが動作しない

1. **確認箇所**: `useImageActions.ts`
2. **チェックポイント**:
   - `$from.nodeBefore`で画像が正しく特定されているか
   - 操作後に`view.dispatch(tr)`が呼ばれているか

### 問題: 新段落生成後に画像操作ができない（修正済み）

**症状**: 画像挿入直後は操作できるが、Enterで新段落を生成した後は操作が効かない

**原因**: キャレットが新段落に移動し、`$from.nodeBefore`が画像を指さなくなる

**解決策**: `ImageContextMenu.tsx`で右クリック時に対象画像の右辺にキャレットを移動させるロジックを追加

```typescript
// ImageContextMenu.tsx の handleContextMenu 内
const pos = editor.view.posAtDOM(targetImg, 0);
// ドキュメント内の画像ノードを探し、その右辺にキャレットを移動
editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === 'image') {
        if (nodePos <= pos && pos <= nodePos + node.nodeSize) {
            const imageEndPos = nodePos + node.nodeSize;
            const tr = editor.state.tr.setSelection(
                TextSelection.create(editor.state.doc, imageEndPos)
            );
            editor.view.dispatch(tr);
        }
    }
});
```

---

## 変更履歴

| 日付 | 変更内容 |
|-----|---------|
| 2025-12-28 | 画像キャレットロジックを完全に再構築。NodeSelectionからTextSelectionに移行 |
| 2025-12-28 | 左辺キャレット禁止プラグイン（imageCaretPlugin）を追加 |
| 2025-12-28 | 画像タイトル表示機能を追加 |
| 2025-12-28 | 古いDOM操作ベースのコード（selectionState.ts）を削除 |
| 2025-12-28 | メタデータ編集ダイアログを`$from.nodeBefore`方式に修正 |
| 2025-12-28 | 新段落生成後の画像操作バグを修正（右クリック時にキャレット移動） |

---

## 注意事項

1. **直接DOM操作は禁止**: すべてのキャレット操作はTiptap/ProseMirrorのAPIを使用すること
2. **選択は常にTextSelection**: `selectable: false`のため、NodeSelectionは使用しない
3. **画像の特定は`$from.nodeBefore`**: キャレットは常に画像の右辺にあるため
4. **属性更新は`setNodeMarkup`**: `updateAttributes`ではなく直接トランザクションを使用

