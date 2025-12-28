# 画像ロジック仕様書

---

## 1. 未解決要件
・現状、右辺キャレットは縦幅は期待通りだが、画像右辺キャレットが画像右辺から離れすぎているので、画像右辺から1.5pt右の位置に配置するようにしたい。
・画像段落では、段落番号のy座標より画像上辺のy座標が上に来ないようにしたい。
・タイトル挿入時は、タイトルの高さ分だけ段落高さを増やしたい。（タイトル挿入時と未挿入時で画像段落下辺と次段落との距離を一定にしたい。）


### ✅ 解決済みの問題

### 画像挿入とキャレット制御
- テキスト存在段落で画像挿入選択→新段落自動作成しそこに挿入。空段落で画像挿入選択→そのままその段落に挿入。
- 画像の左辺へのキャレット移動を禁止し、自動的に右辺に移動させる。

### キーボード操作
- `Enter`キー: キャレットが画像の右辺にある時、新しい段落を作成
- `Backspace`キー: キャレットが画像の右辺にある時、画像段落ごと削除

### 画像タイトル・メタデータ
- 画像にタイトルを設定でき、画像下に中央揃えで表示される
- タイトルサイズは`本文`と`サブテキスト`の2種類
- キャプション（AIインデックス用）とタグ（カンマ区切り）を設定可能
- タイトルはCSS擬似要素（`::after`）で表示し、DOM要素として存在しない。（選択、編集、キャレット挿入不可）

### 画像操作
- 画像サイズ変更（`xs`, `s`, `m`, `l`, `xl`）
- 画像枠線のトグル
- 画像削除
- 右クリックメニューからメタデータ編集

#### 2.1 キャレットが視覚的に見えない問題（解決済み）
- **症状**: Enter/Backspaceは動作するが、キャレットが視覚的に点滅しない
- **原因**: 画像段落に`line-height: 0`と`font-size: 0`を設定していたため、キャレットの高さが0になっていた
- **解決策**: 段落に`font-size: inherit`を設定し、画像コンテナ内だけ`font-size: 0`にする方式に変更

#### 2.2 u200B文字列が表示されるバグ（解決済み）
- **症状**: CSSの`::after`でゼロ幅スペース（`\u200B`）を追加しようとしたが、「u200B」という文字列がそのまま表示された
- **原因**: CSSでは`\u200B`がエスケープされない
- **解決策**: `font-size: inherit`方式に変更し、`::after`を使用しない

#### 2.3 新段落生成後に画像操作ができない問題（解決済み）
- **症状**: 画像挿入直後は操作できるが、Enterで新段落を生成した後は操作が効かない
- **原因**: キャレットが新段落に移動し、`$from.nodeBefore`が画像を指さなくなる
- **解決策**: `ImageContextMenu.tsx`で右クリック時に対象画像の右辺にキャレットを移動させるロジックを追加

#### 2.4 キャレットがタイトル下に表示される問題（解決済み）
- **症状**: キャレットが画像とタイトルの間ではなく、タイトルの下に表示されてしまう
- **原因**: タイトルをDOM要素として追加していたため、キャレットがタイトルの後に配置された
- **解決策**: タイトルをCSS擬似要素（`::after`）に変更し、`position: absolute`で絶対配置。画像コンテナは`inline-block`にしてキャレットを横に並べる

## 3. 要件に関連する全ファイルのファイル構成

```
project-root/
├── src/v2/
│   ├── lib/
│   │   └── customImage.ts                    ← 【中心】CustomImage拡張・キャレット制御・タイトル表示ロジック
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

---

## 4. 要件に関連する技術スタック

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

#### Tiptap拡張の主要設定
- `inline`: ノードをインラインで配置
- `group`: ノードのグループ（`inline`, `block`など）
- `atom`: 内部にキャレットを置かないノード
- `selectable`: NodeSelectionを有効にするか
- `draggable`: ドラッグ可能にするか

---

## 5. 動作原理

### 5.1 画像ノードの設定

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

**重要ポイント**:
- `selectable: false`により、画像はNodeSelectionで選択されず、**常にテキストキャレットを使用**
- `atom: true`により、画像内部にキャレットが入ることを防ぐ

### 5.2 左辺キャレット禁止プラグイン（imageCaretPlugin）

```typescript
// src/v2/lib/customImage.ts - addProseMirrorPlugins()
addProseMirrorPlugins() {
    return [
        new Plugin({
            key: new PluginKey('imageCaretPlugin'),
            
            appendTransaction: (transactions, oldState, newState) => {
                // 選択変更があるトランザクションのみ処理
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

**動作原理**:
1. すべてのトランザクションを監視し、選択変更があるものだけ処理
2. キャレットの直後（`$from.nodeAfter`）に画像があれば「左辺にいる」と判定
3. 画像の直後（右辺）の位置を計算し、キャレットを強制移動

### 5.3 画像クリック時のキャレット配置

```typescript
// src/v2/lib/customImage.ts - addNodeView()
const handleMouseDown = (event: MouseEvent) => {
    if (event.button === 2) return; // 右クリックはスルー
    
    event.preventDefault();
    event.stopPropagation();
    
    const pos = getPos();
    if (typeof pos === 'number') {
        // 画像の直後にキャレットを配置
        const imageEndPos = pos + node.nodeSize;
        const tr = editor.state.tr.setSelection(
            TextSelection.create(editor.state.doc, imageEndPos)
        );
        editor.view.dispatch(tr);
        editor.view.focus();
    }
};
```

**動作原理**:
1. 画像の開始位置（`getPos()`）を取得
2. 画像のサイズ（`node.nodeSize`）を加算し、終了位置を計算
3. `TextSelection.create()`で画像の直後にキャレットを作成
4. トランザクションをディスパッチしてエディタにフォーカス

### 5.4 画像タイトル表示（CSS擬似要素）

#### DOM構造
```typescript
// src/v2/lib/customImage.ts - addNodeView()
const container = document.createElement('span');
container.className = 'image-container';

const img = document.createElement('img');
img.src = node.attrs.src;
// ... 画像サイズ・枠線の設定 ...

container.appendChild(img);

// タイトルはDOM要素として追加しない
// data-title属性に格納し、CSSの::afterで表示
if (node.attrs.title) {
    container.dataset.title = node.attrs.title;
    container.classList.add('has-title');
    if (node.attrs.titleSize === 'mini') {
        container.classList.add('title-mini');
    }
}
```

#### CSS擬似要素で表示
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

/* タイトルを絶対配置で画像の下に表示 */
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

**動作原理**:
1. タイトルはDOM要素として追加せず、`data-title`属性に格納
2. CSSの`::after`擬似要素で`attr(data-title)`を使用してタイトルを表示
3. `position: absolute`で画像の下に配置し、通常のドキュメントフローから除外
4. これにより、キャレットは画像コンテナ（`inline-block`）の右隣に正しく配置される
5. `margin-bottom: 2em`でタイトル用の余白を確保

### 5.5 キャレットの視覚的表示

```css
/* src/v2/styles/content.css */
/* 画像段落のスタイル */
.page-inner p:has(> .image-container) {
    display: block;
    text-align: center; /* 画像コンテナを中央揃え */
    line-height: 1.2;
    font-size: inherit; /* キャレットの高さを確保 */
    caret-color: #000;  /* キャレットを黒色で表示 */
}

/* 画像コンテナ内だけfont-size: 0 */
.page-inner p:has(> .image-container) > .image-container {
    font-size: 0;
}
```

**動作原理**:
1. 画像段落全体は`font-size: inherit`でテキストサイズを維持
2. これによりキャレットの高さが確保される
3. 画像コンテナ内だけ`font-size: 0`にして余計な空白を削除
4. `caret-color: #000`でキャレットを視覚的に表示

### 5.6 画像属性の取得と更新（`selectable: false`対応）

#### 画像属性の取得
```typescript
// src/v2/hooks/useImageActions.ts または各ダイアログ
const { state } = editor;
const { $from } = state.selection;
const nodeBefore = $from.nodeBefore;

// キャレットの直前のノードが画像かチェック
if (nodeBefore?.type.name === 'image') {
    // nodeBefore.attrs から属性を取得
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
    // 画像の開始位置を計算
    const imagePos = $from.pos - $from.nodeBefore.nodeSize;
    
    // setNodeMarkup で属性を更新
    const tr = state.tr.setNodeMarkup(imagePos, undefined, {
        ...$from.nodeBefore.attrs,
        title: newTitle,
        titleSize: newSize,
    });
    
    view.dispatch(tr);
}
```

**動作原理**:
1. `selectable: false`のため、`editor.getAttributes('image')`が使えない場合がある
2. キャレットは常に画像の右辺にあるため、`$from.nodeBefore`で画像ノードを取得
3. `$from.pos - $from.nodeBefore.nodeSize`で画像の開始位置を計算
4. `setNodeMarkup()`でノードの属性を更新（`updateAttributes()`は使わない）

### 5.7 右クリックメニューからの画像操作

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
    
    // メニュー表示位置を設定
    setMenuPosition({ x: event.clientX, y: event.clientY });
};
```

**動作原理**:
1. 右クリックされた画像のDOM要素から、ドキュメント内の位置（`posAtDOM`）を取得
2. `doc.descendants()`でドキュメント内のすべてのノードを走査
3. 右クリックされた位置に該当する画像ノードを見つける
4. 画像の直後（右辺）にキャレットを移動
5. これにより、メタデータ編集ダイアログが`$from.nodeBefore`で正しく画像を特定できる

---

## 6. コードの変更履歴

### 2025-12-28: 画像キャレットロジックの完全再構築
- **変更目的**: NodeSelectionからTextSelectionへの移行、キャレット制御の一貫性確保
- **変更内容**:
  - `customImage.ts`に`selectable: false`を設定
  - `addKeyboardShortcuts()`でEnter/Backspaceの処理を追加
  - `addNodeView()`で画像クリック時のキャレット配置ロジックを実装
- **影響**: すべてのキャレット操作がTextSelectionで統一された

### 2025-12-28: 左辺キャレット禁止プラグイン（imageCaretPlugin）の追加
- **変更目的**: 画像の左辺にキャレットが入ることを防ぐ
- **変更内容**:
  - `addProseMirrorPlugins()`に`imageCaretPlugin`を実装
  - `appendTransaction`で選択変更を監視し、左辺にいる場合は右辺に強制移動
- **影響**: 画像の左辺にキャレットが入ることがなくなった

### 2025-12-28: 画像タイトル表示機能の追加
- **変更目的**: 画像にタイトルを表示する機能の実装
- **変更内容**:
  - `customImage.ts`の`addNodeView()`でタイトルDOM要素を作成（初期実装）
  - `content.css`にタイトルスタイルを追加
- **影響**: 画像下にタイトルが表示されるようになったが、キャレット配置に問題が発生

### 2025-12-28: 古いDOM操作ベースのコード（selectionState.ts）の削除
- **変更目的**: 不要なコードの削除、コードベースの整理
- **変更内容**:
  - `selectionState.ts`ファイルを削除
  - Tiptap/ProseMirrorのAPIに完全移行
- **影響**: コードの保守性が向上

### 2025-12-28: メタデータ編集ダイアログを`$from.nodeBefore`方式に修正
- **変更目的**: `selectable: false`に対応した画像属性の取得・更新
- **変更内容**:
  - `ImageTitleDialog.tsx`、`ImageCaptionDialog.tsx`、`ImageTagDialog.tsx`を修正
  - `editor.getAttributes('image')`から`$from.nodeBefore.attrs`方式に変更
  - `updateAttributes()`から`setNodeMarkup()`方式に変更
- **影響**: ダイアログから画像のメタデータを正しく編集できるようになった

### 2025-12-28: 新段落生成後の画像操作バグの修正
- **変更目的**: Enterキーで新段落を作成した後も画像操作を可能にする
- **変更内容**:
  - `ImageContextMenu.tsx`に右クリック時のキャレット移動ロジックを追加
  - `posAtDOM()`と`doc.descendants()`で対象画像を特定
  - 画像の右辺にキャレットを移動してから操作を実行
- **影響**: どの段落にキャレットがあっても、右クリックした画像を正しく操作できるようになった

### 2025-12-28: キャレット非表示問題の修正
- **変更目的**: キャレットが視覚的に見えない問題の解決
- **変更内容**:
  - `content.css`の画像段落スタイルを修正
  - `line-height: 0`と`font-size: 0`を段落から削除
  - 段落に`font-size: inherit`、画像コンテナ内だけ`font-size: 0`に設定
  - `caret-color: #000`でキャレットを明示的に表示
- **影響**: キャレットが視覚的に表示されるようになった

### 2025-12-28: u200B文字列が表示されるバグの修正
- **変更目的**: CSSの`::after`で`\u200B`を使おうとした失敗の修正
- **変更内容**:
  - `::after { content: "\u200B"; }`を削除
  - `font-size: inherit`方式に統一
- **影響**: 不要な文字列が表示されなくなった

### 2025-12-28: タイトル表示をDOM要素からCSS擬似要素（::after）に変更
- **変更目的**: キャレットが画像とタイトルの間に正しく配置されるようにする
- **変更内容**:
  - `customImage.ts`のタイトルDOM要素作成コードを削除
  - タイトルを`data-title`属性に格納
  - `content.css`で`::after { content: attr(data-title); }`を使用
- **影響**: タイトルがCSS擬似要素として表示され、DOM要素として存在しなくなった

### 2025-12-28: キャレットが画像とタイトルの間に配置されるように構造変更
- **変更目的**: タイトルをCSS擬似要素にしたが、キャレット位置の最終調整
- **変更内容**:
  - 画像コンテナを`inline-block`に変更
  - タイトル擬似要素を`position: absolute`で絶対配置
  - `margin-bottom: 2em`でタイトル用の余白を確保
  - 画像段落で`text-align: center`して画像を中央配置
- **影響**: キャレットが画像の直後（横）に正しく配置され、タイトルはその下に表示されるようになった

---

## 7. デバッグ中に気づいた重要ポイント

### 7.1 ProseMirrorのノード位置計算
- **ポイント**: ProseMirrorのドキュメント位置は、ノードの境界とテキストの間に存在する
- **詳細**:
  - `getPos()`は画像ノードの開始位置を返す
  - `node.nodeSize`は画像ノードのサイズ（通常は1）
  - 画像の直後（右辺）の位置は`getPos() + node.nodeSize`
  - キャレットの直前のノードは`$from.nodeBefore`、直後のノードは`$from.nodeAfter`
- **教訓**: 位置計算を正確に行わないと、キャレットが意図しない場所に配置される

### 7.2 CSS擬似要素とキャレット配置
- **ポイント**: CSS擬似要素（`::before`, `::after`）はDOMに存在しないため、キャレットが入らない
- **詳細**:
  - タイトルをDOM要素として追加すると、キャレットがタイトルの後に配置される
  - CSS擬似要素として表示すると、キャレットは画像コンテナの直後（横）に配置される
  - 擬似要素を`position: absolute`にすることで、ドキュメントフローから除外できる
- **教訓**: UIに表示したいが、エディタのロジックには含めたくない要素は、CSS擬似要素を活用すべき

### 7.3 `font-size: 0`とキャレットの高さ
- **ポイント**: `font-size: 0`を設定すると、キャレットの高さも0になり見えなくなる
- **詳細**:
  - 画像段落に`font-size: 0`を設定すると、余計な空白は消えるがキャレットも消える
  - 段落全体には`font-size: inherit`を設定し、画像コンテナ内だけ`font-size: 0`にする
  - `caret-color`でキャレットの色を明示的に指定する
- **教訓**: キャレットの表示には親要素の`font-size`が影響する

### 7.4 `selectable: false`とNodeSelection
- **ポイント**: `selectable: false`にすると、NodeSelectionが無効になり、常にTextSelectionが使われる
- **詳細**:
  - `editor.getAttributes('image')`はNodeSelectionが必要な場合がある
  - `$from.nodeBefore`方式を使えば、TextSelectionでも画像ノードを特定できる
  - 画像操作は常に「キャレットの直前のノード」を前提にする
- **教訓**: ノードの選択方式を統一することで、ロジックがシンプルになる

### 7.5 右クリックメニューとキャレット移動
- **ポイント**: 右クリック時にキャレットを移動させないと、別の段落から画像操作ができない
- **詳細**:
  - 画像挿入直後はキャレットが画像の右辺にあるため操作可能
  - Enterで新段落を作成すると、キャレットが新段落に移動し、`$from.nodeBefore`が画像を指さない
  - 右クリック時に`posAtDOM()`で画像の位置を取得し、キャレットを移動する必要がある
- **教訓**: ユーザーの操作（右クリック）とエディタの内部状態（キャレット位置）を同期させる必要がある

### 7.6 `inline-block`とキャレット配置
- **ポイント**: 画像コンテナを`inline-block`にすると、キャレットが横に並ぶ
- **詳細**:
  - `display: flex`や`inline-flex`では、キャレットが下に配置される場合がある
  - `inline-block`にすることで、キャレット（テキストノード扱い）がコンテナの右隣に配置される
  - 親段落で`text-align: center`すれば、画像コンテナとキャレットが中央揃えになる
- **教訓**: レイアウトの`display`プロパティはキャレット配置に大きく影響する

### 7.7 `appendTransaction`の利用
- **ポイント**: `appendTransaction`を使えば、トランザクション後の状態を修正できる
- **詳細**:
  - 左辺キャレット禁止プラグインでは、選択変更後にキャレット位置をチェック
  - 左辺にいる場合は、新しいトランザクションを返して右辺に移動
  - `return null`の場合は何も変更しない
- **教訓**: エディタの動作を後から修正するには、`appendTransaction`が有効

### 7.8 `setNodeMarkup()`の使用
- **ポイント**: `updateAttributes()`ではなく`setNodeMarkup()`を使うべき場合がある
- **詳細**:
  - `updateAttributes()`は選択されたノードに対して動作する
  - `selectable: false`の場合、`updateAttributes()`が機能しない場合がある
  - `setNodeMarkup(imagePos, undefined, newAttrs)`で直接ノードを更新する
- **教訓**: APIの動作を理解し、状況に応じて適切なメソッドを選ぶ

### 7.9 CSSの`:has()`セレクタの活用
- **ポイント**: `:has()`セレクタで子要素に応じた親要素のスタイルを設定できる
- **詳細**:
  - `.page-inner p:has(> .image-container)`で画像を含む段落を特定
  - 画像段落にのみ特別なスタイルを適用できる
- **教訓**: モダンCSSセレクタを活用すれば、クラス名を追加せずに柔軟なスタイリングが可能

### 7.10 エディタのフォーカス管理
- **ポイント**: キャレット移動後は`editor.view.focus()`を呼ぶ必要がある
- **詳細**:
  - トランザクションをディスパッチしただけでは、エディタがフォーカスを失う場合がある
  - `editor.view.focus()`を明示的に呼ぶことで、キャレットが点滅する
- **教訓**: エディタの状態変更後は、フォーカス管理を忘れずに

---

## 付録: 主要なAPI一覧

### ProseMirror Selection API

| API | 説明 |
|-----|------|
| `TextSelection.create(doc, pos)` | 指定位置にテキストキャレットを作成 |
| `selection.$from` | 選択の開始位置の詳細情報 |
| `selection.$from.pos` | 選択の開始位置（数値） |
| `selection.$from.nodeBefore` | キャレットの直前のノード |
| `selection.$from.nodeAfter` | キャレットの直後のノード |
| `selection.empty` | 選択が空（キャレットのみ）かどうか |

### ProseMirror Transaction API

| API | 説明 |
|-----|------|
| `state.tr` | 新しいトランザクションを作成 |
| `tr.setSelection(selection)` | 選択を設定 |
| `tr.setNodeMarkup(pos, type, attrs)` | ノードの属性を更新 |
| `view.dispatch(tr)` | トランザクションを適用 |

### ProseMirror Node API

| API | 説明 |
|-----|------|
| `node.type.name` | ノードのタイプ名（例: `'image'`, `'paragraph'`） |
| `node.nodeSize` | ノードのサイズ |
| `node.attrs` | ノードの属性オブジェクト |

### Tiptap Editor API

| API | 説明 |
|-----|------|
| `editor.state` | エディタの現在の状態 |
| `editor.view` | エディタのビュー |
| `editor.view.focus()` | エディタにフォーカスを設定 |
| `editor.view.posAtDOM(dom, offset)` | DOM要素からドキュメント位置を取得 |

---

## 注意事項

1. **直接DOM操作は禁止**: すべてのキャレット操作はTiptap/ProseMirrorのAPIを使用すること
2. **選択は常にTextSelection**: `selectable: false`のため、NodeSelectionは使用しない
3. **画像の特定は`$from.nodeBefore`**: キャレットは常に画像の右辺にあるため
4. **属性更新は`setNodeMarkup`**: `updateAttributes`ではなく直接トランザクションを使用
5. **位置計算は慎重に**: ProseMirrorの位置計算は1つ間違えるだけで動作が変わる
6. **フォーカス管理を忘れない**: トランザクション後は`editor.view.focus()`を呼ぶ
7. **CSS擬似要素を活用**: エディタのロジックに含めたくないUI要素は擬似要素で表示
8. **右クリック時はキャレット移動**: 右クリックメニューから操作する前に、対象画像の右辺にキャレットを移動

