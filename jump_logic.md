## 概要
これは、解決困難な要件を効率的に解決するためのファイルである。要件に関する重要事項を随時追記修正することで、AIが状況を動的に把握しやすくするとともに、他のモデルも即座に状況を把握できるようにする。

内容は以下の通りとする。
1.未解決要件、2.未解決要件に関するコード変更履歴（毎回、分析結果・方針・変更内容を詳細に記述する）3.分析中に気づいた重要ポイント（試してだめだったこと、仮設、制約条件等...）、4.解決済み要件とその解決方法、5.要件に関連する全ファイルのファイル構成、6.要件に関連する技術スタック、7.要件に関する機能の動作原理（依存関係含む）

## ワークフロー

### 現状把握と分析
まず、1を確認して未解決要件を把握する。
その後、2～7を参考にしつつ、コードベースを分析して、現状の問題点を考える。
同時に、3を更新する。

### 5～7の更新
分析を踏まえて、5～7を更新する。
***常に、最新の要件に関連する記述を行い、最新の要件に関係のない記述は削除すること。***

### コード編集作業
次に、実際に要件を満たすためにコーディングを行う。途中、適宜3を更新する。

### 作業終了後
作業後は、ユーザーから、フィードバックを受けたのち、ユーザーの指示に従って、1,4を更新する。
***勝手に1,4を編集しないこと。***

----------------------------------------
# 以下、AIが自動的に更新する部分
----------------------------------------

## 1. 未解決要件
・ジャンプ用入力ボックスに文字列を入力してエンターキーを押すと、エディタ上で、その文字列を含む段落にジャンプする。（ジャンプ箇所で、その文字列をハイライトする）（ハイライトはオレンジ系の色でマーカーのように表示する）

**これらの機能はすべて、v1で実装済みなので、積極的に参考にすること。**
**また、rules.mdを厳守すること。**


## 2. 未解決要件に関するコード変更履歴

### 変更1: 検索ハイライトCSSの追加（2025-12-28）

**分析結果:**
- v1では`.search-match`と`.search-match.current`クラスでハイライト表示
- v2のindex.cssには未実装

**方針:**
- v1のui.cssから該当スタイルをv2/styles/index.cssに移植

**変更内容:**
- ファイル: `src/v2/styles/index.css`
- 追加: `.search-match`クラス（黄色ハイライト）
- 追加: `.search-match.current`クラス（オレンジハイライト、拡大表示）

---

### 変更2: useJumpNavigation.tsの強化（2025-12-28）

**分析結果:**
- 既存実装では段落IDジャンプのみ動作
- テキスト検索時のハイライト表示、複数該当エラー、スクロール処理が未実装
- v1のjumpToParagraph関数を参考にする必要がある

**方針:**
- searchHighlight.tsのユーティリティ関数を活用
- テキスト検索フォールバック処理を完全実装
- v1と同じフロー: カウント → 0件/複数件はエラー → 1件のみハイライト+スクロール
- 自動クリア機能の実装（次のマウス/キーボード操作で解除）

**変更内容:**
- ファイル: `src/v2/hooks/useJumpNavigation.ts`
- インポート追加: `clearSearchHighlights`, `countSearchMatches`, `highlightSearchMatches`
- 処理開始時に`clearSearchHighlights()`を呼び出し
- 段落ID検索失敗時のフォールバック処理を完全実装:
  - エディタDOMから検索コンテナを取得
  - `countSearchMatches`で該当数をカウント
  - 0件 → エラートースト
  - 2件以上 → エラートースト（「検索条件を詳しくしてください」）
  - 1件のみ → `highlightSearchMatches`でハイライト → スクロール → 成功トースト
  - 自動クリア: 1秒後に`mousedown`/`keydown`イベントリスナーを登録

---

### 変更3: Ctrl+Jショートカットの実装（2025-12-28）

**分析結果:**
- v1ではdocument.getElementById().focus()で直接フォーカス
- v2ではReactの宣言的UI原則に従い、状態管理が必要

**方針:**
- Zustandストアに`shouldFocusJumpInput`状態を追加
- useKeyboardShortcutsでCtrl+Jを検知 → `triggerJumpInputFocus()`
- Toolbar.tsxでuseEffectで状態を監視 → input要素にref経由でフォーカス

**変更内容:**

#### 3-1: Zustandストアの拡張
- ファイル: `src/v2/store/useAppStore.ts`
- インターフェース追加: `shouldFocusJumpInput`, `triggerJumpInputFocus()`, `resetJumpInputFocus()`
- 状態初期値: `shouldFocusJumpInput: false`
- 実装: `triggerJumpInputFocus`でtrueに、`resetJumpInputFocus`でfalseに

#### 3-2: useKeyboardShortcuts.tsの拡張
- ファイル: `src/v2/hooks/useKeyboardShortcuts.ts`
- 引数追加: `triggerJumpInputFocus: () => void`
- Ctrl+Jハンドラ追加: `e.preventDefault()` → `triggerJumpInputFocus()`
- dependenciesに`triggerJumpInputFocus`を追加

#### 3-3: App.tsxの更新
- ファイル: `src/v2/app/App.tsx`
- useAppStoreから`triggerJumpInputFocus`を取得
- useKeyboardShortcuts呼び出しに`triggerJumpInputFocus`を渡す

#### 3-4: Toolbar.tsxの更新
- ファイル: `src/v2/components/features/Toolbar.tsx`
- インポート追加: `useRef`, `useEffect`
- useAppStoreから`shouldFocusJumpInput`, `resetJumpInputFocus`を取得
- `jumpInputRef = useRef<HTMLInputElement>(null)`を作成
- useEffectで`shouldFocusJumpInput`を監視 → trueの時に`jumpInputRef.current.focus()` + `select()` → `resetJumpInputFocus()`
- input要素に`ref={jumpInputRef}`を設定

---

### 変更4: テキスト検索ハイライト修正 & 段落IDジャンプスクロール改善（2025-12-28）

**分析結果:**
- **文字列ハイライトが表示されない**: `[data-type="page-content"]`セレクタがTiptapのDOM構造に存在せず、検索コンテナが空になっていた
- **段落IDジャンプのスクロール位置**: `domAtPos`で取得したノードが段落要素ではなく、その子ノードの可能性があり、確実に段落要素までclosestで遡る必要がある

**方針:**
- テキスト検索時の検索コンテナを`editor.view.dom`（エディタ全体）に変更
- 段落IDジャンプ時は`closest('p, h1, h2, h3, h4, h5, h6')`で段落要素を確実に取得
- スクロールを50ms遅延させてレンダリング後に実行

**変更内容:**
- ファイル: `src/v2/hooks/useJumpNavigation.ts`
- **テキスト検索部分（72-76行目）**:
  - `querySelectorAll('[data-type="page-content"]')`を削除
  - `searchContainers = [editorElement]`に単純化（エディタDOM全体を検索）
- **段落IDジャンプ部分（54-79行目）**:
  - `domAtPos`で取得したノードから`targetElement`を取得
  - `targetElement.closest('p, h1, h2, h3, h4, h5, h6')`で段落要素まで遡る
  - `setTimeout(() => paragraphOrHeading.scrollIntoView({...}), 50)`で確実にスクロール実行

---

### 変更5: テキストハイライト完全修正（2025-12-28）

**分析結果:**
- 前回の修正でもハイライトが表示されない
- **根本原因**: Tiptap/ProseMirrorのDOM構造はネストされたspan要素を使用しており、従来の「直接の子ノードのみを検索」するアプローチでは、深い階層のテキストノードに到達できない
- v1はシンプルなcontenteditable要素で、テキストノードが浅い階層にあった
- v2のTiptapでは、`p > span > span > テキストノード`のような深いネスト構造

**方針:**
- `countSearchMatches`と`highlightSearchMatches`を再帰的検索に変更
- すべての子孫テキストノードを探索するように修正
- 既にハイライト済みの`.search-match`要素内は再検索しないようスキップ

**変更内容:**
- ファイル: `src/v2/utils/searchHighlight.ts`
- **countSearchMatches関数（32-65行目）**:
  - 再帰関数`countInNode`を追加
  - `node.nodeType === Node.ELEMENT_NODE`の場合、その子ノードを再帰的に処理
  - `.search-match`クラスを持つ要素はスキップ
- **highlightSearchMatches関数（125-159行目）**:
  - 再帰関数`processNode`を追加
  - テキストノードを見つけたら`highlightAllInTextNode`を呼び出し
  - 要素ノードの場合、その子ノードを再帰的に処理
  - div要素もquerySelectorに追加（ProseMirrorの構造に対応）

---

### 変更6: 重複カウント問題の修正（2025-12-28）

**分析結果:**
- **変更5で新たな問題発生**: 1か所しかない文字列が3か所と誤認される
- **根本原因**: `querySelectorAll`で親子関係にある要素（`div > p > span`）を取得し、それぞれから再帰的に処理したため、同じテキストノードを複数回カウント
- 例：`div`、`p`、`span`の3つの要素から同じテキストノードに到達 → 3回カウント

**方針:**
- `querySelectorAll`を完全に削除
- `container`から直接再帰的に処理する方式に変更
- これにより、各テキストノードは正確に1回のみ処理される

**変更内容:**
- ファイル: `src/v2/utils/searchHighlight.ts`
- **countSearchMatches関数（25-61行目）**:
  - `querySelectorAll`と`elements.forEach`を削除
  - `countInNode`関数を外に出し、`containers.forEach(container => countInNode(container))`に単純化
  - containerから直接再帰処理することで重複を防止
- **highlightSearchMatches関数（116-151行目）**:
  - 同様に`querySelectorAll`と`elements.forEach`を削除
  - `processNode`関数で`containers.forEach(container => processNode(container))`に単純化
  - containerから直接再帰処理

---

### 変更7: ハイライト表示の完全修正（2025-12-28）

**分析結果:**
- 重複カウント問題は解決したが、ハイライト表示が依然として動作しない
- **根本原因**: `highlightAllInTextNode`内で`range.surroundContents`を実行すると、DOMが変更される（テキストノードが分割される）
- 再帰的に処理中にDOMが変更されると、次のテキストノードの参照が無効になる可能性がある
- v1との違い：v1は浅い構造で直接の子ノードのみを処理、v2は深いネスト構造を再帰的に処理

**方針:**
- テキストノードを**事前に収集**してから、収集後に順次処理
- 2段階アプローチ：1) 収集フェーズ、2) ハイライトフェーズ
- ハイライト中にDOMが変更されても、事前に収集した配列には影響しない

**変更内容:**
- ファイル: `src/v2/utils/searchHighlight.ts`
- **highlightSearchMatches関数（116-168行目）**:
  - `collectTextNodes`関数で該当するテキストノードを配列に収集
  - `textNodes.push(node as Text)`で配列に追加（queryを含むテキストノードのみ）
  - 収集完了後、`for`ループで順次`highlightAllInTextNode`を呼び出し
  - `textNode.parentNode`チェックでDOMに存在するか確認してから処理
  - この2段階アプローチにより、DOM変更の影響を受けずに処理可能

---

### 変更8: highlightAllInTextNode関数の堅牢化（2025-12-28）

**分析結果:**
- 前回の修正でもハイライトが表示されない
- **根本原因の推測**: `range.surroundContents`がTiptap/ProseMirrorのDOM構造で失敗している可能性
- `surroundContents`は選択範囲が複数の要素をまたぐ場合に失敗する
- Tiptapはインラインスタイル（太字など）を`<strong>`タグでラップするため、この問題が発生しやすい

**方針:**
- より堅牢な`splitText` + `replaceChild`方式に変更
- `surroundContents`をプライマリから削除し、フォールバックに降格
- TypeScript型エラーも同時に修正

**変更内容:**
- ファイル: `src/v2/utils/searchHighlight.ts`
- **highlightAllInTextNode関数（71-131行目）**:
  - プライマリ方式を`splitText` + `replaceChild`に変更
  - `currentNode.splitText(idx)`: マッチ位置でテキストノードを分割
  - `matchStartNode.splitText(query.length)`: マッチ後で再分割
  - `parent.replaceChild(span, matchStartNode)`: マッチ部分をspanで置換
  - 従来の`range.surroundContents`はtry-catchのフォールバックとして残す
  - 明示的な型注釈`Text`を追加して型エラーを解消


## 3. 分析中に気づいた重要ポイント

### v2の現状
- ✅ ジャンプ入力ボックスは既にToolbar.tsxに実装済み（行183-202）
- ✅ useJumpNavigation フックが存在し、基本的なロジックは実装済み
- ✅ 段落IDによるジャンプは実装済み（Tiptapのdocument traversal使用）
- ✅ テキスト検索のユーティリティ関数（searchHighlight.ts）は存在する

### 未実装・不足機能
1. **テキスト検索ジャンプ機能が不完全**
   - useJumpNavigation.tsでは、テキスト検索時に該当箇所が見つかるかどうかの判定のみ行っている
   - **ハイライト表示が実装されていない**（v1ではhighlightSearchMatches関数を使用）
   - **複数該当時のエラー判定が実装されていない**（v1ではcountSearchMatches関数を使用）
   - **スクロール処理が実装されていない**

2. **Ctrl+Jのキーボードショートカットが未実装**
   - v1ではnavigator.tsのinitParagraphJump関数内で実装
   - v2ではuseKeyboardShortcuts.tsに追加が必要
   - ただし、入力フォーカスのための状態管理が必要（Reactの宣言的UI）

3. **検索ハイライトのスタイル**
   - v1では`.search-match`クラスでスタイリング（ui.css）
   - v2ではindex.cssに追加が必要

### v1の実装参考ポイント
- **jumpToParagraph関数（navigator.ts 258-326行）**: 段落ID検索→テキスト検索のフォールバック処理
- **countSearchMatches/highlightSearchMatches（search.ts）**: DOM操作で検索とハイライト
- **initParagraphJump関数（navigator.ts 178-219行）**: Ctrl+Jでフォーカス移動

### 実装方針
1. **useJumpNavigation.tsの改善**: searchHighlight.tsのユーティリティを活用してテキスト検索ロジックを完成させる
2. **useKeyboardShortcuts.tsの拡張**: Ctrl+Jを追加（ただし、入力要素へのfocusはhooks経由で実現）
3. **CSSの追加**: search-matchクラスのスタイルをv2/styles/index.cssに追加
4. **rules.md遵守**: DOM操作はhooksに隔離し、コンポーネントは描画のみに専念

## 4. 解決済み要件とその解決方法

### ✅ 文字列が複数段落に該当する場合はエラーを返す（一か所のみ該当する場合のみジャンプ）

**解決方法:**
- `countSearchMatches`関数でDOM内の該当箇所をカウント
- 0件 → エラートースト「見つかりません」
- 2件以上 → エラートースト「該当箇所が複数あります（N箇所）。検索条件を詳しくしてください。」
- 1件のみ → ハイライト表示 + ジャンプ

**実装箇所:**
- `src/v2/hooks/useJumpNavigation.ts` (80-107行目)
- `src/v2/utils/searchHighlight.ts` (countSearchMatches関数)

---

### ✅ Ctrl+Jを押すと、ジャンプ用入力ボックスにキャレットが移動する

**解決方法:**
- Zustandストアに`shouldFocusJumpInput`状態を追加
- `useKeyboardShortcuts`でCtrl+Jを検知 → `triggerJumpInputFocus()`でstateをtrueに
- `Toolbar.tsx`でuseEffectで状態監視 → useRefでinput要素にフォーカス + select()
- React宣言的UIに従い、DOM操作はhooks内でrefを経由

**実装箇所:**
- `src/v2/store/useAppStore.ts` (状態管理)
- `src/v2/hooks/useKeyboardShortcuts.ts` (Ctrl+J検知)
- `src/v2/components/features/Toolbar.tsx` (useRef + useEffect)

---

### ✅ 段落ID（1-1等）が入力されたら、エディタ上でその段落にジャンプする（ジャンプ箇所が中央にくるようにスクロール）

**解決方法:**
- Tiptapの`editor.state.doc.descendants`で段落IDを検索
- `domAtPos`で取得したノードから`closest('p, h1, h2, h3, h4, h5, h6')`で段落要素まで遡る
- `setTimeout(..., 50)`で50ms遅延させてレンダリング後に確実にスクロール実行
- `scrollIntoView({ behavior: 'smooth', block: 'center' })`で中央配置

**実装箇所:**
- `src/v2/hooks/useJumpNavigation.ts` (49-87行目)

---

### ✅ 1か所しかない文字列が複数か所と誤認されずに正確にカウントされる

**解決方法:**
- 変更5で導入した`querySelectorAll`が親子関係の要素を重複取得していた問題を修正
- `querySelectorAll`を完全に削除し、containerから直接再帰的に処理
- `countInNode`関数で各テキストノードを1回のみ走査
- これにより、同じテキストノードが複数回カウントされることを防止

**実装箇所:**
- `src/v2/utils/searchHighlight.ts` (countSearchMatches関数、25-61行目)
- `src/v2/utils/searchHighlight.ts` (highlightSearchMatches関数、116-151行目)

## 5. 要件に関連する全ファイルのファイル構成

### v2（実装対象）
```
src/v2/
├── components/
│   └── features/
│       └── Toolbar.tsx              # ジャンプ入力ボックスのUI (183-202行)
├── hooks/
│   ├── useJumpNavigation.ts         # ジャンプロジック（改善対象）
│   └── useKeyboardShortcuts.ts      # キーボードショートカット（拡張対象）
├── utils/
│   └── searchHighlight.ts           # 検索・ハイライトユーティリティ
└── styles/
    └── index.css                    # グローバルCSS（スタイル追加対象）
```

### v1（参考実装）
```
src/v1/
├── ui/
│   └── navigator.ts                 # initParagraphJump, jumpToParagraph関数
├── utils/
│   └── search.ts                    # countSearchMatches, highlightSearchMatches
└── styles/
    └── ui.css                       # .search-matchスタイル定義
```

## 6. 要件に関連する技術スタック

- **React + TypeScript**: コンポーネントベース、型安全
- **Tiptap**: エディタライブラリ（document traversal API使用）
- **DOM API**: 直接DOM操作（hooks内でカプセル化）
  - `querySelector`, `scrollIntoView`
  - `Range`, `createTextNode`, `replaceChild`（検索ハイライト）
- **Zustand**: グローバル状態管理（isWordMode等）
- **Sonner**: トースト通知（検索結果フィードバック）

## 7. 要件に関する機能の動作原理

### ジャンプ機能の全体フロー
1. **入力検知**: Toolbar.tsxのinput要素でEnterキー検知
2. **ロジック実行**: `useJumpNavigation.jumpTo(target)`呼び出し
3. **段落ID検索**: Tiptapの`editor.state.doc.descendants`でノードを走査
4. **テキスト検索（フォールバック）**: 段落IDが見つからない場合
   - `countSearchMatches`: 該当数をカウント → 0件または2件以上ならエラー
   - `highlightSearchMatches`: 1件のみの場合、ハイライト表示
   - `scrollIntoView`: 該当箇所にスクロール
   - 自動クリア: 次のマウス/キーボード操作でハイライト解除

### Ctrl+Jの動作原理（v1参考）
1. **グローバルイベント**: `window.addEventListener('keydown')`
2. **フォーカス移動**: `input.focus()` + `input.select()`
3. **モード判定**: isWordModeに応じて異なるinput要素にフォーカス

### 段落IDの形式
- **標準モード**: `p1-1`, `p1-2`, ... (入力: `1-1` → 自動で`p`プレフィックス追加)
- **Wordモード**: `p1`, `p2`, ... (入力: `15` → 自動で`p15`に変換)

### 検索ハイライトの仕組み
- テキストノードを`<span class="search-match">`で囲む
- 最初のマッチに`.current`クラスを追加
- `clearSearchHighlights`: span要素をテキストノードに戻して削除


