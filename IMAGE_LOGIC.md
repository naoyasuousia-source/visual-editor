# 画像ロジック仕様書

---

## 1. 未解決要件

### 1.1 キャレット位置の微調整
- **要件**: 画像右辺キャレットが画像右辺から離れすぎているので、画像右辺から1.5pt右の位置に配置したい
- **現状**: キャレットは画像コンテナの直後に配置されるが、位置調整の仕組みが未実装

### 1.2 画像上辺と段落番号の位置関係
- **要件**: 画像段落では、段落番号のy座標と画像上辺のy座標を一致させる。
- **現状**: 画像の配置により段落番号より上に画像が突き出る可能性がある

### 1.3 タイトル挿入時の段落高さ調整
- **要件**: タイトル挿入時は、タイトルの高さ分だけ段落高さを増やしたい（タイトル挿入時と未挿入時で画像段落下辺と次段落との距離を一定にしたい）
- **現状**: 現在`margin-bottom: 2em`で固定値の余白を確保しているが、タイトルの実際の高さに応じた動的調整は未実装

---

## 2. 未解決要件に関するコード変更履歴

### 2025-12-28 17:42 - 新規ドキュメント作成
- **分析結果**: 新しいルール形式に従ってドキュメントを再構成。未解決要件を明確化
- **方針**: 解決済み要件と未解決要件を明確に分離し、今後の開発方針を示す
- **変更内容**: ドキュメント全体を新フォーマットに書き直し

---

## 3. 分析中に気づいた重要ポイント

### 3.1 試してダメだったこと

#### ❌ CSS `::after`でゼロ幅スペース（`\u200B`）を挿入
- **目的**: キャレットの高さを確保しようとした
- **問題**: CSSでは`\u200B`がエスケープされず、「u200B」という文字列がそのまま表示された
- **教訓**: CSSの`content`プロパティではユニコードエスケープシーケンスが使えない

#### ❌ タイトルをDOM要素として追加
- **目的**: 画像下にタイトルを表示
- **問題**: キャレットがタイトルの後に配置され、画像とタイトルの間に配置できなかった
- **教訓**: エディタのロジックに影響を与えたくないUI要素はCSS擬似要素で表示すべき

### 3.2 制約条件

#### `selectable: false`の制約
- `editor.getAttributes('image')`が正しく動作しない場合がある
- 画像操作は必ず`$from.nodeBefore`方式で行う必要がある
- NodeSelectionは使用できず、常にTextSelectionを使用

#### ProseMirrorの位置計算の制約
- ドキュメント位置は、ノードの境界とテキストの間に存在する
- 位置計算を1つ間違えるだけで、キャレットが意図しない場所に配置される
- `getPos() + node.nodeSize`で画像の右辺を正確に計算する必要がある

#### CSS擬似要素の制約
- `::before`, `::after`はDOMに存在しないため、JavaScriptから直接操作できない
- 高さや幅の測定が困難
- `data-*`属性経由でのみ内容を制御できる

### 3.3 重要な発見

#### ✅ `font-size: inherit`方式でキャレット高さを確保
- 画像段落全体に`font-size: inherit`を設定することで、キャレットの高さを確保できた
- 画像コンテナ内だけ`font-size: 0`にすることで、余計な空白を削除しつつキャレットを表示

#### ✅ `position: absolute`でタイトルをドキュメントフローから除外
- タイトルを絶対配置にすることで、キャレットが画像コンテナの直後（横）に配置される
- `margin-bottom`で余白を確保し、視覚的なレイアウトを維持

#### ✅ 右クリック時にキャレットを移動
- 右クリック時に`posAtDOM()`と`doc.descendants()`で対象画像を特定
- 画像の右辺にキャレットを移動してから操作を実行することで、どの段落からでも画像操作が可能

---

## 4. 解決済み要件とその解決方法

### 4.1 画像挿入とキャレット制御

#### 要件
- テキスト存在段落で画像挿入選択 → 新段落自動作成しそこに挿入
- 空段落で画像挿入選択 → そのままその段落に挿入
- 画像の左辺へのキャレット移動を禁止し、自動的に右辺に移動させる

#### 解決方法
- **左辺キャレット禁止プラグイン（imageCaretPlugin）**:
  - `appendTransaction`で選択変更を監視
  - `$from.nodeAfter`に画像がある場合（左辺にいる場合）、右辺に強制移動
- **画像ノード設定**:
  - `selectable: false`: NodeSelectionを無効化し、常にTextSelectionを使用
  - `atom: true`: 画像内部にキャレットが入ることを防止

### 4.2 キーボード操作

#### 要件
- `Enter`キー: キャレットが画像の右辺にある時、新しい段落を作成
- `Backspace`キー: キャレットが画像の右辺にある時、画像段落ごと削除

#### 解決方法
- `addKeyboardShortcuts()`で専用のキーボードショートカットを実装
- キャレットが画像の右辺にあるかを`$from.nodeBefore?.type.name === 'image'`で判定

### 4.3 画像タイトル・メタデータ

#### 要件
- 画像にタイトルを設定でき、画像下に中央揃えで表示される
- タイトルサイズは`本文`と`サブテキスト`（旧`default`と`mini`）の2種類
- キャプション（AIインデックス用）とタグ（カンマ区切り）を設定可能
- タイトルはCSS擬似要素（`::after`）で表示し、DOM要素として存在しない（選択、編集、キャレット挿入不可）

#### 解決方法
- **CSS擬似要素方式**:
  - タイトルを`data-title`属性に格納
  - CSS `::after { content: attr(data-title); }`で表示
  - `position: absolute`で画像の下に配置し、ドキュメントフローから除外
- **キャレット位置の確保**:
  - 画像コンテナを`inline-block`にして、キャレットが横に並ぶようにする
  - `margin-bottom: 2em`でタイトル用の余白を確保

### 4.4 画像操作

#### 要件
- 画像サイズ変更（`xs`, `s`, `m`, `l`, `xl`）
- 画像枠線のトグル
- 画像削除
- 右クリックメニューからメタデータ編集

#### 解決方法
- **`useImageActions`フック**:
  - すべての画像操作ロジックをカスタムフックに集約
  - `$from.nodeBefore`方式で画像を特定
  - `setNodeMarkup()`でノードの属性を直接更新
- **右クリック時のキャレット移動**:
  - `ImageContextMenu.tsx`で右クリック時に対象画像の右辺にキャレットを移動
  - これにより、どの段落にキャレットがあっても対象画像を操作可能

### 4.5 キャレットが視覚的に見えない問題

#### 症状
- Enter/Backspaceは動作するが、キャレットが視覚的に点滅しない

#### 原因
- 画像段落に`line-height: 0`と`font-size: 0`を設定していたため、キャレットの高さが0になっていた

#### 解決方法
```css
/* 画像段落全体に font-size: inherit を設定 */
.page-inner p:has(> .image-container) {
    font-size: inherit;
    caret-color: #000;
}

/* 画像コンテナ内だけ font-size: 0 */
.page-inner p:has(> .image-container) > .image-container {
    font-size: 0;
}
```

### 4.6 新段落生成後に画像操作ができない問題

#### 症状
- 画像挿入直後は操作できるが、Enterで新段落を生成した後は操作が効かない

#### 原因
- キャレットが新段落に移動し、`$from.nodeBefore`が画像を指さなくなる

#### 解決方法
```typescript
// ImageContextMenu.tsx - 右クリック時にキャレットを移動
const pos = editor.view.posAtDOM(targetImg, 0);
editor.state.doc.descendants((node, nodePos) => {
    if (node.type.name === 'image') {
        if (nodePos <= pos && pos <= nodePos + node.nodeSize) {
            const imageEndPos = nodePos + node.nodeSize;
            const tr = editor.state.tr.setSelection(
                TextSelection.create(editor.state.doc, imageEndPos)
            );
            editor.view.dispatch(tr);
            return false; // 探索終了
        }
    }
});
```

### 4.7 キャレットがタイトル下に表示される問題

#### 症状
- キャレットが画像とタイトルの間ではなく、タイトルの下に表示されてしまう

#### 原因
- タイトルをDOM要素として追加していたため、キャレットがタイトルの後に配置された

#### 解決方法
- タイトルをCSS擬似要素（`::after`）に変更
- `position: absolute`で絶対配置し、ドキュメントフローから除外
- 画像コンテナを`inline-block`にしてキャレットを横に並べる

---

## 5. 要件に関連する全ファイルのファイル構成

```
project-root/
├── src/v2/
│   ├── lib/
│   │   └── customImage.ts                    ← 【中核】CustomImage拡張・キャレット制御・タイトル表示ロジック
│   │
│   ├── hooks/
│   │   └── useImageActions.ts                ← 画像操作フック（サイズ、枠線、削除、メタデータ編集）
│   │
│   ├── components/common/
│   │   ├── editor-menus/
│   │   │   └── ImageContextMenu.tsx          ← 右クリックメニュー（キャレット移動処理含む）
│   │   │
│   │   └── dialogs/
│   │       ├── ImageTitleDialog.tsx          ← タイトル編集ダイアログ
│   │       ├── ImageCaptionDialog.tsx        ← キャプション編集ダイアログ
│   │       └── ImageTagDialog.tsx            ← タグ編集ダイアログ
│   │
│   └── styles/
│       └── content.css                       ← 画像関連スタイル定義（擬似要素タイトル、キャレット表示）
│
└── IMAGE_LOGIC.md                            ← 本ドキュメント
```

### ファイル間の依存関係

```
customImage.ts
├─ 使用: Tiptap, ProseMirror
└─ 提供: CustomImage拡張（画像ノード定義、キャレット制御、タイトル表示）

useImageActions.ts
├─ 依存: customImage.ts（画像ノード）
├─ 依存: Zustand（ダイアログ状態管理）
└─ 提供: 画像操作関数（サイズ変更、枠線トグル、削除、メタデータ編集）

ImageContextMenu.tsx
├─ 依存: useImageActions.ts
├─ 依存: customImage.ts
└─ 提供: 右クリックメニューUI、キャレット移動ロジック

各ダイアログ (ImageTitleDialog.tsx, ImageCaptionDialog.tsx, ImageTagDialog.tsx)
├─ 依存: customImage.ts
├─ 依存: Zustand（ダイアログ開閉状態）
└─ 提供: メタデータ編集UI

content.css
└─ 提供: 画像段落スタイル、タイトル擬似要素スタイル、キャレット表示スタイル
```

---

## 6. 要件に関連する技術スタック

| 技術 | バージョン/説明 | 役割 |
|------|----------------|------|
| **React** | 18.x | UIフレームワーク |
| **TypeScript** | 5.x | 型安全性の確保 |
| **Tiptap** | 最新版 | リッチテキストエディタフレームワーク（ProseMirrorベース） |
| **ProseMirror** | - | Tiptapの基盤となるエディタライブラリ |
| **Zustand** | - | 状態管理（ダイアログの開閉状態など） |
| **Tailwind CSS** | 3.x | ユーティリティCSSフレームワーク |
| **Vanilla CSS** | - | カスタムスタイル（content.css） |

### 重要な技術概念

#### ProseMirrorの基本概念
- **ノード (Node)**: ドキュメントの構成要素（段落、画像など）
- **トランザクション (Transaction)**: エディタの状態変更を管理
- **選択 (Selection)**: 
  - `TextSelection`: テキストキャレットの位置を表す
  - `NodeSelection`: ノード全体の選択を表す（本プロジェクトでは画像には使用しない）
- **プラグイン (Plugin)**: エディタの動作をカスタマイズ
- **位置 (Position)**: ノードの境界とテキストの間に存在する数値

#### Tiptap拡張の主要設定
- `inline`: ノードをインラインで配置するか
- `group`: ノードのグループ（`inline`, `block`など）
- `atom`: 内部にキャレットを置かないノード
- `selectable`: NodeSelectionを有効にするか
- `draggable`: ドラッグ可能にするか

#### ProseMirror APIの主要メソッド
| API | 説明 |
|-----|------|
| `TextSelection.create(doc, pos)` | 指定位置にテキストキャレットを作成 |
| `selection.$from` | 選択の開始位置の詳細情報 |
| `$from.nodeBefore` | キャレットの直前のノード |
| `$from.nodeAfter` | キャレットの直後のノード |
| `state.tr.setSelection(selection)` | 選択を設定 |
| `state.tr.setNodeMarkup(pos, type, attrs)` | ノードの属性を更新 |
| `view.dispatch(tr)` | トランザクションを適用 |
| `view.posAtDOM(dom, offset)` | DOM要素からドキュメント位置を取得 |

---

## 7. 要件に関する機能の動作原理（依存関係含む）

### 7.1 画像ノードの設定

```typescript
// src/v2/lib/customImage.ts
export const CustomImage = TiptapImage.extend({
    inline: true,           // 段落(p)内にインラインで配置
    group: 'inline',        // インラインノードグループ
    atom: true,             // アトムノード（内部にキャレットを置かない）
    selectable: false,      // NodeSelectionを無効化（常にTextSelectionを使用）
    draggable: false,       // ドラッグ無効
});
```

**依存関係**: Tiptap Image拡張を継承

**動作原理**:
- `selectable: false`により、画像はNodeSelectionで選択されず、常にTextSelectionを使用
- `atom: true`により、画像内部にキャレットが入ることを防止
- `inline: true`により、段落内にインラインで配置（ブロック要素として扱わない）

### 7.2 左辺キャレット禁止プラグイン（imageCaretPlugin）

```typescript
// src/v2/lib/customImage.ts - addProseMirrorPlugins()
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
                if (!empty) return null; // 範囲選択は無視
                
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

**依存関係**: ProseMirror Plugin API

**動作原理**:
1. すべてのトランザクションを監視し、選択変更があるものだけ処理
2. キャレットの直後（`$from.nodeAfter`）に画像があれば「左辺にいる」と判定
3. 画像の直後（右辺）の位置（`$from.pos + nodeAfter.nodeSize`）を計算
4. 新しいトランザクションを返してキャレットを右辺に強制移動

### 7.3 画像クリック時のキャレット配置

```typescript
// src/v2/lib/customImage.ts - addNodeView()
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

**依存関係**: ProseMirror NodeView API、Tiptap Editor API

**動作原理**:
1. 画像の開始位置（`getPos()`）を取得
2. 画像のサイズ（`node.nodeSize`）を加算し、終了位置を計算
3. `TextSelection.create()`で画像の直後にキャレットを作成
4. トランザクションをディスパッチしてエディタにフォーカス

### 7.4 画像タイトル表示（CSS擬似要素）

#### DOM構造の生成
```typescript
// src/v2/lib/customImage.ts - addNodeView()
const container = document.createElement('span');
container.className = 'image-container';

const img = document.createElement('img');
img.src = node.attrs.src;
container.appendChild(img);

// タイトルはDOM要素として追加しない（data-title属性に格納）
if (node.attrs.title) {
    container.dataset.title = node.attrs.title;
    container.classList.add('has-title');
    if (node.attrs.titleSize === 'mini') {
        container.classList.add('title-mini');
    }
}
```

#### CSSによるタイトル表示
```css
/* src/v2/styles/content.css */
.page-inner .image-container {
    display: inline-block;
    position: relative;
    vertical-align: bottom;
    width: auto;
}

.page-inner .image-container.has-title {
    margin-bottom: 2em; /* タイトル高さ分の余白確保 */
}

.page-inner .image-container.has-title::after {
    content: attr(data-title);
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    display: block;
    width: max-content;
    max-width: 200%;
    text-align: center;
    font-size: 11pt;
    color: #333;
    user-select: none;
    pointer-events: none;
}
```

**依存関係**: HTML data-*属性、CSS擬似要素

**動作原理**:
1. タイトルを`data-title`属性に格納（DOM要素として追加しない）
2. CSS `::after { content: attr(data-title); }`でタイトルを表示
3. `position: absolute`で画像の下に配置し、ドキュメントフローから除外
4. キャレットは画像コンテナ（`inline-block`）の右隣に配置される
5. `margin-bottom: 2em`でタイトル用の余白を確保

### 7.5 キャレットの視覚的表示

```css
/* src/v2/styles/content.css */
.page-inner p:has(> .image-container) {
    display: block;
    text-align: center; /* 画像コンテナを中央揃え */
    line-height: 1.2;
    font-size: inherit; /* キャレットの高さを確保 */
    caret-color: #000;  /* キャレットを黒色で表示 */
}

.page-inner p:has(> .image-container) > .image-container {
    font-size: 0; /* 画像コンテナ内だけ font-size: 0 */
}
```

**依存関係**: CSS `:has()`擬似クラス

**動作原理**:
1. 画像段落全体に`font-size: inherit`を設定してテキストサイズを維持
2. これによりキャレットの高さが確保される
3. 画像コンテナ内だけ`font-size: 0`にして余計な空白を削除
4. `caret-color: #000`でキャレットを視覚的に表示

### 7.6 画像属性の取得と更新（`selectable: false`対応）

#### 画像属性の取得
```typescript
// src/v2/hooks/useImageActions.ts または各ダイアログ
const { state } = editor;
const { $from } = state.selection;
const nodeBefore = $from.nodeBefore;

if (nodeBefore?.type.name === 'image') {
    const title = nodeBefore.attrs.title || '';
    const titleSize = nodeBefore.attrs.titleSize || 'default';
    // ...
}
```

#### 画像属性の更新
```typescript
// src/v2/hooks/useImageActions.ts または各ダイアログ
const { state, view } = editor;
const { selection } = state;
const { $from, empty } = selection;

if (empty && $from.nodeBefore?.type.name === 'image') {
    const imagePos = $from.pos - $from.nodeBefore.nodeSize;
    
    const tr = state.tr.setNodeMarkup(imagePos, undefined, {
        ...$from.nodeBefore.attrs,
        title: newTitle,
        titleSize: newSize,
    });
    
    view.dispatch(tr);
}
```

**依存関係**: ProseMirror Transaction API、Tiptap Editor API

**動作原理**:
1. `selectable: false`のため、`editor.getAttributes('image')`が使えない
2. キャレットは常に画像の右辺にあるため、`$from.nodeBefore`で画像ノードを取得
3. `$from.pos - $from.nodeBefore.nodeSize`で画像の開始位置を計算
4. `setNodeMarkup()`でノードの属性を直接更新（`updateAttributes()`は使わない）

### 7.7 右クリックメニューからの画像操作

```typescript
// src/v2/components/common/editor-menus/ImageContextMenu.tsx
const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    
    const targetImg = (event.target as HTMLElement).closest('.image-container img');
    if (!targetImg || !editor) return;
    
    // 右クリックされた画像の右辺にキャレットを移動
    const pos = editor.view.posAtDOM(targetImg, 0);
    editor.state.doc.descendants((node, nodePos) => {
        if (node.type.name === 'image') {
            if (nodePos <= pos && pos <= nodePos + node.nodeSize) {
                const imageEndPos = nodePos + node.nodeSize;
                const tr = editor.state.tr.setSelection(
                    TextSelection.create(editor.state.doc, imageEndPos)
                );
                editor.view.dispatch(tr);
                return false; // 探索終了
            }
        }
    });
    
    setMenuPosition({ x: event.clientX, y: event.clientY });
};
```

**依存関係**: 
- `useImageActions`フック（画像操作関数を提供）
- ProseMirror Document API
- Tiptap Editor API

**動作原理**:
1. 右クリックされた画像のDOM要素から、ドキュメント内の位置（`posAtDOM`）を取得
2. `doc.descendants()`でドキュメント内のすべてのノードを走査
3. 右クリックされた位置に該当する画像ノードを見つける
4. 画像の直後（右辺）にキャレットを移動
5. これにより、メタデータ編集ダイアログが`$from.nodeBefore`で正しく画像を特定できる

---

## 付録: 開発時の注意事項

1. **直接DOM操作は禁止**: すべてのキャレット操作はTiptap/ProseMirrorのAPIを使用すること
2. **選択は常にTextSelection**: `selectable: false`のため、NodeSelectionは使用しない
3. **画像の特定は`$from.nodeBefore`**: キャレットは常に画像の右辺にあるため
4. **属性更新は`setNodeMarkup`**: `updateAttributes`ではなく直接トランザクションを使用
5. **位置計算は慎重に**: ProseMirrorの位置計算は1つ間違えるだけで動作が変わる
6. **フォーカス管理を忘れない**: トランザクション後は`editor.view.focus()`を呼ぶ
7. **CSS擬似要素を活用**: エディタのロジックに含めたくないUI要素は擬似要素で表示
8. **右クリック時はキャレット移動**: 右クリックメニューから操作する前に、対象画像の右辺にキャレットを移動
