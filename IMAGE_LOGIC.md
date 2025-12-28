# 画像ロジック仕様書

---

## 1. 未解決要件

### 1.1 キャレット位置の微調整
- **要件**: 画像右辺キャレットが画像右辺から離れすぎているので、画像右辺から1.5pt右の位置に配置したい
- **現状**: CSSでの解決は困難と判明 → **要件見直し or ProseMirrorレベルでの対応検討**

### 1.2 サブテキストタイトルのスタイル
- **要件**: タイトルでサブテキストを選択したとき、h6相当のスタイル（小さいフォント、グレー文字）を適用したい
- **現状**: `.title-mini::after`にh6相当のスタイルを追加 → **動作確認待ち**

---

## 2. 未解決要件に関するコード変更履歴

### 2025-12-28 18:30 - サブテキストタイトルスタイルの追加
- **分析結果**:
  - サブテキストタイトル（`.title-mini::after`）のfont-sizeが定義されていなかった
  - h6（サブテキスト）はfont-size: 0.67em相当
- **方針**:
  - `.title-mini::after`にh6相当のスタイルを追加
- **変更内容**:
  ```css
  /* content.css */
  .page-inner .image-container.has-title.title-mini::after {
    font-size: 0.67em; /* h6相当（約8pt） */
    color: #666;
  }
  ```

### 2025-12-28 18:25 - タイトル挿入ボタン問題への対応 ✅
- **分析結果**:
  - ダイアログが開いたときにエディタのフォーカスが外れ、`$from.nodeBefore`が画像を指さなくなる
- **方針**:
  - ダイアログが開いたときに画像の位置を`useRef`で保存
  - 適用時は保存した位置を使用して確実に画像を更新
- **結果**: ✅ 正常動作確認

### 2025-12-28 18:10 - 要件1.1, 1.3への再チャレンジ
- **結果**:
  - 1.1: ❌ 効果なし
  - 1.3: ✅ 正常動作確認

---

## 3. 分析中に気づいた重要ポイント

### ❌ キャレット位置調整はCSSでは困難
- `margin-right`: キャレットはコンテナ外側に描画されるため効果なし
- `padding-right`: コンテナが太くなるだけでキャレット位置は変わらない
- `letter-spacing`: 段落全体に影響するため副作用あり
- **結論**: キャレット位置の微調整はCSSでは不可能。ProseMirror/Tiptapレベルでの対応が必要か、要件自体の見直しが必要

### ✅ サブテキストはh6相当
- ブロック要素選択のサブテキスト = h6 = font-size: 0.67em
- 画像タイトルのサブテキストも同じスタイルを適用すべき

---

## 4. 解決済み要件とその解決方法

### 4.1 画像上辺と段落番号の位置関係

#### 要件
- 画像段落では、段落番号のy座標と画像上辺のy座標を一致させる

#### 解決方法
```css
.page-inner .image-container {
  vertical-align: top;
}
```

### 4.2 タイトル挿入時の段落高さ調整

#### 要件
- タイトル挿入時は、タイトルの高さ分だけ段落高さを増やしたい

#### 解決方法
```css
.page-inner .image-container.has-title {
  margin-bottom: 24px;
}
.page-inner .image-container.has-title.title-mini {
  margin-bottom: 20px;
}
```

### 4.3 タイトル挿入メニューの適用ボタン問題

#### 要件
- タイトル挿入メニューを初めて開いたとき、適用ボタンが押せない

#### 原因
- ダイアログが開いたときにエディタのフォーカスが外れ、`$from.nodeBefore`が画像を指さなくなる

#### 解決方法
```typescript
// ImageTitleDialog.tsx
const imagePosRef = useRef<number | null>(null);

useEffect(() => {
    if (open) {
        // 画像の位置を保存
        imagePosRef.current = $from.pos - nodeBefore.nodeSize;
    }
}, [editor, open]);

const handleApply = () => {
    // 保存した位置を使用して画像を更新
    if (imagePosRef.current !== null) {
        const node = state.doc.nodeAt(imagePosRef.current);
        if (node?.type.name === 'image') {
            const tr = state.tr.setNodeMarkup(imagePosRef.current, ...);
            view.dispatch(tr);
        }
    }
};
```

---

## 5. 要件に関連する全ファイルのファイル構成

```
project-root/src/v2/
├── lib/
│   └── customImage.ts              ← 画像ノード定義・キャレット制御
│
├── components/common/
│   ├── dialogs/
│   │   └── ImageTitleDialog.tsx    ← タイトル編集ダイアログ
│   │
│   └── editor-menus/
│       └── ImageContextMenu.tsx    ← 右クリックメニュー
│
└── styles/
    └── content.css                 ← 画像スタイル・タイトル擬似要素
```

---

## 6. 要件に関連する技術スタック

| 技術 | 役割 |
|------|------|
| **React** | UIフレームワーク |
| **Tiptap/ProseMirror** | エディタ・キャレット制御 |
| **CSS** | 画像段落スタイル・擬似要素タイトル |

---

## 7. 要件に関する機能の動作原理（依存関係含む）

### 7.1 画像タイトル表示の仕組み

```
customImage.ts (addNodeView)
  ↓
container.classList.add('has-title', 'title-mini')  // クラス付与
container.dataset.title = node.attrs.title          // data属性にタイトル格納
  ↓
content.css
  ↓
.image-container.has-title::after { content: attr(data-title); }  // 擬似要素で表示
.image-container.has-title.title-mini::after { font-size: 0.67em; } // サブテキストスタイル
```

### 7.2 タイトルサイズの値

| ImageTitleDialog | customImage.ts | CSS クラス | スタイル |
|------------------|----------------|------------|----------|
| `'default'` | `titleSize: 'default'` | `.has-title` | font-size: 11pt |
| `'mini'` | `titleSize: 'mini'` | `.has-title.title-mini` | font-size: 0.67em, color: #666 |

### 7.3 キャレット描画の原理

- キャレットはProseMirrorがテキストノードの位置に描画
- 画像コンテナ（`inline-block`）の直後にテキスト位置が存在
- CSSでキャレット位置を細かく調整することは困難
- `margin-right`、`padding-right`、`letter-spacing`いずれも効果なし

