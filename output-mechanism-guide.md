# 出力HTML生成の仕組み - 完全ガイド

## 📋 概要

**両モード（通常/Word）共に、同じ`buildFullHTML()`関数を使用して出力HTMLを生成しています。**

違いは、**モードに応じてCSSから不要なスタイルを削除する**点のみです。

---

## 🔄 出力HTMLの生成フロー

### **全体の流れ**

```
ユーザーが保存ボタンを押す
    ↓
useFileIO.ts の getFullHTML() が呼ばれる
    ↓
buildFullHTML() 関数を呼び出す
    ├─ 引数1: editor.getHTML() → エディタのHTML本文
    ├─ 引数2: isWordMode → true/false
    ├─ 引数3: contentCssText → content.css全体（?rawで読み込み）
    ├─ 引数4: pageMarginText → "17mm"など
    └─ 引数5: aiImageIndexHtml → 画像インデックス
    ↓
buildFullHTML() 内の処理
    ├─ 1. AIガイド文生成（モード別）
    ├─ 2. コマンドエリア生成
    ├─ 3. bodyクラス設定（Wordモード時は "mode-word"）
    ├─ 4. CSSをモード別に最適化 ← ★ここが重要
    └─ 5. HTMLテンプレートに組み込み
    ↓
完成したHTML文字列を返す
    ↓
ファイルに保存
```

---

## 🎯 核心: buildFullHTML() の処理内容

### **ステップ1: AIガイド文を生成**

```typescript
// aiMetadata.ts 行144
const aiGuide = generateAiGuide(isWordMode);
```

**生成されるもの**:
```html
<!--
===============================================================================
AI COMMAND API (v2.0 - Paragraph ID System)
===============================================================================

OVERVIEW:
Visual editor document. Edit via commands targeting paragraph IDs in COMMAND AREA.

STRUCTURE:
- Paginated Mode: A4 sections, IDs like 'p1-1', 'p1-2' (page-paragraph).
  または
- Word Mode: Continuous flow, IDs like 'p1', 'p2'.
...
-->
```

---

### **ステップ2: CSSをモード別に最適化** ⭐

```typescript
// aiMetadata.ts 行155
const optimizedCss = optimizeCssForMode(contentCss, isWordMode);
```

**これが最も重要な処理です！**

#### **optimizeCssForMode() の中身**

```typescript
function optimizeCssForMode(contentCss: string, isWordMode: boolean): string {
    // 1. コメントを削除
    let cleanedCss = contentCss.replace(/\/\*[\s\S]*?\*\//g, '');
    
    if (isWordMode) {
        // Wordモード: Paginated専用スタイルを削除
        // - ページ番号（section.page::after）を削除
        // - 固定高さ（height: 297mm）を削除
        cleanedCss = cleanedCss.replace(/section\.page::after\s*\{[^}]*\}/g, '');
        cleanedCss = cleanedCss.replace(/section\.page\s*\{...\}/g, '...');
    } else {
        // Paginatedモード: Word専用スタイルを削除
        // - body.mode-word で始まるすべてのスタイルを削除
        cleanedCss = cleanedCss.replace(/body\.mode-word[^{]*\{[^}]*\}/g, '');
    }
    
    return cleanedCss;
}
```

---

### **ステップ3: HTMLテンプレートに組み込み**

```typescript
// aiMetadata.ts 行169-188
return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
${aiGuide}              ← ★モード別のAI向けガイド文
<style>
:root { --page-margin: ${pageMarginText}; }
${optimizedCss}         ← ★モード別に最適化されたCSS
</style>
</head>
<body class="${finalClass}">  ← ★Wordモードなら "standalone-html mode-word"
${commandArea}          ← ★コマンドエリア
<div id="pages-container">
${cleanedHtml}          ← ★エディタのHTML本文
</div>
${aiImageIndexHtml}     ← ★画像インデックス
</body>
</html>`;
```

---

## 🔍 モード別の出力HTMLの違い

### **通常モード（Paginated）の出力HTML**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>

<!-- AI COMMAND API (Paginated Mode用のガイド) -->

<style>
:root { --page-margin: 17mm; }

/* 共通スタイル（body.standalone-html, #pages-container, など） */

section.page {
  position: relative;
  width: 210mm;
  min-width: 210mm;
  height: 297mm;        ← ★固定高さ（Paginatedモード用）
  min-height: 297mm;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  overflow: hidden;
  margin: 0 auto;
}

section.page::after {   ← ★ページ番号（Paginatedモード用）
  content: attr(data-page);
  position: absolute;
  left: 50%;
  bottom: 6mm;
  transform: translateX(-50%);
  font-size: 11px;
  color: #666;
}

/* @media print スタイル */

/* body.mode-word スタイルは削除されている ❌ */

</style>
</head>
<body class="standalone-html">   ← ★クラス名に注目

<!-- AI_COMMAND_START -->
<!-- AI_COMMAND_END -->

<div id="pages-container">
  <section data-page="1" class="page">
    <div class="page-inner">
      <!-- 本文 -->
    </div>
  </section>
</div>
</body>
</html>
```

---

### **Wordモードの出力HTML**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>

<!-- AI COMMAND API (Word Mode用のガイド) -->

<style>
:root { --page-margin: 17mm; }

/* 共通スタイル（body.standalone-html, #pages-container, など） */

section.page {
  position: relative;
  width: 210mm;
  min-width: 210mm;
  background: #fff;
  box-shadow: 10px 0 10px -5px rgba(0, 0, 0, 0.1), -10px 0 10px -5px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  overflow: visible;    ← ★Wordモード用に調整
  margin: 0 auto;
  height: auto;         ← ★自動高さ（Wordモード用）
  min-height: 297mm;
}

/* section.page::after は削除されている ❌ */

/* @media print スタイル */

body.mode-word #pages-container {   ← ★Word専用スタイル
  background-color: #e0e0e0;
}

body.mode-word section.page {
  height: auto !important;
  min-height: 297mm !important;
  box-shadow: 10px 0 10px -5px rgba(0, 0, 0, 0.1), -10px 0 10px -5px rgba(0, 0, 0, 0.1) !important;
  overflow: visible !important;
}

body.mode-word .page-inner {
  height: auto !important;
  min-height: 297mm !important;
  padding-bottom: calc(297mm - var(--page-margin)) !important;
  overflow: visible !important;
}

body.mode-word section.page::after {
  display: none !important;
}

/* ... その他のbody.mode-wordスタイル ... */

</style>
</head>
<body class="standalone-html mode-word">   ← ★クラス名に注目（mode-wordが追加）

<!-- AI_COMMAND_START -->
<!-- AI_COMMAND_END -->

<div id="pages-container">
  <section data-page="1" class="page">
    <div class="page-inner">
      <!-- 本文 -->
    </div>
  </section>
</div>
</body>
</html>
```

---

## 📊 まとめ: モード別の違い

| 項目 | 通常モード（Paginated） | Wordモード |
|------|----------------------|-----------|
| **AIガイド文** | "Paginated Mode: A4 sections..." | "Word Mode: Continuous flow..." |
| **bodyクラス** | `standalone-html` | `standalone-html mode-word` |
| **ページ番号スタイル** | ✅ 含まれる（`section.page::after`） | ❌ 削除される |
| **固定高さスタイル** | ✅ 含まれる（`height: 297mm`） | ❌ 削除される→`height: auto`に置換 |
| **Word専用スタイル** | ❌ 削除される（`body.mode-word`） | ✅ 含まれる |
| **content.css** | ✅ 挿入される（最適化済み） | ✅ 挿入される（最適化済み） |

---

## 🔧 実際のコードの場所

### **1. content.cssの読み込み**
```typescript
// src/v2/hooks/useFileIO.ts 行6
import contentCssText from '@/styles/content.css?raw';
```

**`?raw`**: ViteのRaw Import機能

- content.cssの**文字列全体**をインポート
- コンパイルされたCSSではなく、**元のテキスト**として読み込む

### **2. buildFullHTML()の呼び出し**
```typescript
// src/v2/hooks/useFileIO.ts 行85
return buildFullHTML(
    editor.getHTML(),      // エディタのHTML本文
    isWordMode,            // true or false
    contentCssText,        // content.cssの文字列全体
    pageMarginText,        // "17mm"など
    aiImageIndexHtml       // 画像インデックス
);
```

### **3. CSS最適化処理**
```typescript
// src/v2/utils/aiMetadata.ts 行100-124
function optimizeCssForMode(contentCss: string, isWordMode: boolean): string {
    // モード別に不要なスタイルを削除
}
```

---

## ❓ よくある質問

### **Q1: content.cssはどちらのモードでも挿入されるの？**
**A**: はい、**両モード共に挿入されます**。ただし、モードに応じて不要なスタイルが削除された状態で挿入されます。

### **Q2: Wordモードでもページ番号のスタイルは残ってるの？**
**A**: いいえ、**`section.page::after`は完全に削除されます**。`body.mode-word`の`display: none`だけでなく、スタイル自体が出力HTMLに含まれません。

### **Q3: content.cssのファイルサイズは？**
**A**: 
- **元のサイズ**: 約14KB（592行）
- **エディタ専用削除後**: 約11KB（474行）
- **モード別最適化後**:
  - 通常モード: 約10.7KB（約444行）
  - Wordモード: 約10.5KB（約442行）

### **Q4: エディタ内では両モードのスタイルが必要？**
**A**: はい、**エディタ内では`content.css`の全スタイルが読み込まれます**。モード切り替え時にスタイルが適用されるためです。最適化は**出力HTMLのみ**に適用されます。

---

## 🎯 結論

```
【通常モード】
content.css全体
  ↓
optimizeCssForMode(contentCss, false)
  ↓
Word専用スタイルを削除  ← body.mode-word { ... } を削除
  ↓
出力HTML（通常モード用に最適化）

【Wordモード】
content.css全体
  ↓
optimizeCssForMode(contentCss, true)
  ↓
Paginated専用スタイルを削除  ← section.page::after { ... } など削除
  ↓
出力HTML（Wordモード用に最適化）
```

**両モード共に、content.cssを挿入していますが、モードに応じて最適化されています。**

---

**作成日**: 2025-12-31  
**バージョン**: 1.0
