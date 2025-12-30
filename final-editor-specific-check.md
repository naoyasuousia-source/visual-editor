# 出力HTMLに残っているエディタ専用記述の最終チェック

**分析日**: 2025-12-31  
**対象**: test-reset.html  

---

## 🔍 発見されたエディタ専用記述

### **1. `caret-color`（エディタ専用）** ❌

**場所**: 行219
```css
.page-inner p:has(> .image-container) {
  display: block;
  text-align: center;
  padding: 0;
  line-height: 1;
  font-size: inherit;
  caret-color: #000;  /* ← エディタ専用！カーソル色 */
}
```

**理由**: `caret-color`はテキスト入力カーソルの色を指定するプロパティ。  
**出力HTMLでは不要**: 出力HTMLは`contenteditable`ではないため、カーソルは表示されない。

**削除可能**: ✅ YES

---

### **2. `.ProseMirror-separator` セレクタ（エディタ専用）** ❌

**場所**: 行273-276
```css
.page-inner p:has(> img:not(.ProseMirror-separator)) .ProseMirror-trailingBreak,
.page-inner p:has(> .image-container) .ProseMirror-trailingBreak {
  display: none;
}
```

**理由**: `.ProseMirror-separator`と`.ProseMirror-trailingBreak`はTipTap/ProseMirrorが生成するエディタ専用クラス。

**出力HTMLに存在するか**: 
- ❌ `.ProseMirror-separator`: 存在しない（エディタでのみ使用）
- ❌ `.ProseMirror-trailingBreak`: 存在しない（`cleanedHtml`で削除される）

**削除可能**: ✅ YES（このルール全体）

---

### **3. `transition`（エディタ専用アニメーション）** ⚠️

**場所**: 行232
```css
.page-inner .image-container {
  /* ... */
  transition: margin-bottom 0.2s;  /* ← エディタでのアニメーション */
}
```

**理由**: エディタでタイトル追加時のアニメーション効果。  
**出力HTMLでは不要**: 静的HTMLなのでアニメーション不要。

**削除可能**: ✅ YES（ただし削減効果は小さい）

---

### **4. `overflow-y: auto`（エディタ専用スクロール）** ❌

**場所**: 行144
```css
.page-inner {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: var(--page-margin);
  position: relative;
  overflow-y: auto;  /* ← エディタでのスクロール */
  outline: none;     /* ← エディタのフォーカス枠削除 */
  /* ... */
}
```

**理由**: 
- `overflow-y: auto`: エディタ内でのスクロールを有効化
- `outline: none`: エディタ要素のフォーカス枠を非表示

**出力HTMLでは不要**: 
- スクロールは不要（静的表示）
- フォーカスは発生しない

**削除可能**: ✅ YES

---

### **5. `overflow: hidden`（Paginated専用）** ⚠️

**場所**: 行113
```css
section.page {
  position: relative;
  width: 210mm;
  min-width: 210mm;
  height: 297mm;
  min-height: 297mm;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  overflow: hidden;  /* ← ページ境界を超える内容を隠す */
  margin: 0 auto;
}
```

**理由**: ページの高さを超える内容を隠す（Paginatedモードでのページ分割）

**出力HTMLで必要か**: 
- ✅ 必要: ページレイアウトを維持するため
- ただし、Wordモードでは不要（`overflow: visible`に上書きされる）

**削除可能**: ❌ NO（Paginatedモードで必要）

---

### **6. `@media print`内の`.flex`クラス（エディタ専用）** ❌

**場所**: 行408-437
```css
@media print {
  /* ... */
  
  .flex.flex-col.h-screen {  /* ← エディタのReactコンポーネント */
    display: block !important;
    /* ... */
  }
  
  .flex.flex-1.overflow-hidden {  /* ← エディタのReactコンポーネント */
    display: block !important;
    /* ... */
  }
}
```

**理由**: これらはエディタのReactコンポーネント（Tailwindクラス）に適用されるスタイル。

**出力HTMLに存在するか**: ❌ 存在しない（Reactコンポーネントは出力されない）

**削除可能**: ✅ YES

---

## 📊 削減可能な項目まとめ

| 項目 | 場所 | 削減行数 | 優先度 |
|------|------|---------|--------|
| 1. `caret-color` プロパティ | 行219 | 1行 | HIGH |
| 2. `.ProseMirror-*` セレクタ | 行273-276 | 4行 | HIGH |
| 3. `overflow-y: auto` | 行144 | 1行 | HIGH |
| 4. `outline: none` | 行145 | 1行 | HIGH |
| 5. `transition` プロパティ | 行232 | 1行 | LOW |
| 6. `.flex.*` in @media print | 行408-437 | 18行 | MEDIUM |

**合計削減可能**: 約26行

---

## 💡 実装案

### **optimizeCssForMode() に追加処理を実装**

```typescript
function optimizeCssForMode(contentCss: string, isWordMode: boolean): string {
    // 既存の処理...
    
    // 8. エディタ専用プロパティの削除
    // caret-color の削除
    cleanedCss = cleanedCss.replace(/\s*caret-color:\s*[^;]+;/g, '');
    
    // outline: none の削除（.page-inner内のみ）
    cleanedCss = cleanedCss.replace(
        /(\.page-inner\s*\{[^}]*?)outline:\s*none;([^}]*\})/g,
        '$1$2'
    );
    
    // overflow-y: auto の削除（.page-inner内のみ）
    cleanedCss = cleanedCss.replace(
        /(\.page-inner\s*\{[^}]*?)overflow-y:\s*auto;([^}]*\})/g,
        '$1$2'
    );
    
    // transition プロパティの削除（オプション）
    cleanedCss = cleanedCss.replace(/\s*transition:\s*[^;]+;/g, '');
    
    // 9. ProseMirror関連セレクタの削除
    // .ProseMirror-separator, .ProseMirror-trailingBreak を含むルール
    cleanedCss = cleanedCss.replace(
        /\.page-inner[^{]*\.ProseMirror-[^{]*\{[^}]*\}/g,
        ''
    );
    
    // 既存の空行削除処理...
    
    return cleanedCss;
}
```

---

## 🎯 最適化の注意点

### **削除してOK**
1. ✅ `caret-color` - カーソル色
2. ✅ `outline: none` - フォーカス枠
3. ✅ `overflow-y: auto` - スクロール
4. ✅ `.ProseMirror-*` セレクタ - TipTap専用クラス
5. ✅ `.flex.*` in @media print - Reactコンポーネント専用

### **削除しないで**
1. ❌ `overflow: hidden` on `section.page` - ページレイアウトに必要
2. ❌ `user-select: none` on キャプション - 意図的な選択不可設定
3. ❌ `pointer-events: none` on キャプション - 同上

---

## 📈 期待される追加削減効果

```
現在のCSS行数: 約420行

追加削減:
  - caret-color: 1行
  - overflow-y, outline: 2行
  - .ProseMirror-* セレクタ: 4行
  - transition: 1行（複数箇所で2-3行）
  - 合計: 約8-10行

最終CSS行数: 約410-412行
追加削減率: 約2%
累積削減率: 36-37%
```

---

## 🚀 推奨アクション

**即座に実装すべき項目**:
1. ✅ `caret-color` 削除
2. ✅ `overflow-y: auto` 削除
3. ✅ `outline: none` 削除
4. ✅ `.ProseMirror-*` セレクタ削除

**オプション**:
- `transition` 削除（削減効果は小さいが、不要）

**実装しますか？**

---

**作成日**: 2025-12-31  
**次のアクション**: フェーズ3の追加最適化実装
