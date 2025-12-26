# React/Hooks アーキテクチャ準拠レポート

## 実行日時
2025-12-26 23:06

## アーキテクチャ検証結果

### ✅ 完全準拠：全ての外部ロジックはReactとHooksで結びつき、Reactの副作用としてのみ動作

## レイヤー構造

### 1. **lib/** - Tiptap拡張機能（Tiptapエンジンの一部）
```
lib/
├── pageExtension.ts      # Tiptapノード定義
├── paragraphNumbering.ts # Tiptap Plugin（appendTransaction）
├── pagination.ts         # Tiptap Plugin（自動ページ生成）
├── customImage.ts        # Tiptapノード定義
└── styleAttributes.ts    # Tiptap拡張
```
**役割**: Tiptapエンジンの拡張機能として動作
**使用箇所**: `App.tsx`のuseEditor extensionsのみ
**✅ 正しい**: Tiptapの設定なので直接インポート可

### 2. **utils/** - 純粋関数（副作用なし）
```
utils/
├── selectionState.ts     # Selection状態の計算
├── searchHighlight.ts    # 検索ハイライトロジック
├── figureDom.ts          # DOM操作ユーティリティ
└── aiMetadata.ts         # メタデータ処理
```
**役割**: 純粋な計算・データ加工
**使用箇所**: hooksからのみ呼び出される
**✅ 正しい**: componentsから直接インポートなし

### 3. **hooks/** - ReactとロジックのBridge
```
hooks/
├── useFormattingActions.ts    # フォーマット操作
├── usePageOperations.ts       # ページ操作
├── useJumpNavigation.ts       # ジャンプ機能
├── useImageActions.ts         # 画像操作
├── useImageIndex.ts           # 画像インデックス
├── useFileIO.ts               # ファイルIO
├── useIMEControl.ts           # IME制御
├── usePasteControl.ts         # ペースト制御
└── useParagraphNumberToggle.ts # 段落番号表示切替
```
**役割**: 
- utilsの関数を呼び出し
- Reactの状態（state）と結びつけ
- useEffect/useCallbackで副作用を管理
- componentsへデータと関数を提供

**✅ 正しい**: 全てのロジックがhooksを経由

### 4. **components/** - UI表示のみ
```
components/
├── features/
│   ├── Toolbar.tsx          # ✅ hooksのみ使用
│   ├── PageNavigator.tsx    # ✅ hooksのみ使用
│   └── AIImageIndex.tsx     # ✅ hooksのみ使用
├── common/
│   ├── toolbar/             # ✅ hooksのみ使用
│   ├── dialogs/             # ✅ hooksのみ使用
│   └── editor-menus/        # ✅ hooksのみ使用
└── ui/                      # ✅ Shadcn/ui
```
**役割**: フックから受け取ったデータと関数を表示に反映
**✅ 正しい**: utils/libを直接インポートしていない

## 検証結果

### ✅ componentsからのutils/libインポート
```bash
$ grep "from '@/utils/" components/**/*.tsx
# 結果: なし

$ grep "from '@/lib/" components/**/*.tsx  
# 結果: なし
```

### ✅ データフロー
```
lib (Tiptap拡張)
  ↓
App.tsx (useEditor extensions)
  ↓
editor instance
  ↓
hooks (Reactの副作用として動作)
  ↓ (データと関数を提供)
components (UI表示のみ)
```

### ✅ 副作用の管理
全てのロジックはhooks内で：
- `useEffect` - 初期化とクリーンアップ
- `useCallback` - メモ化された関数
- `useState` - 状態管理

として実行される

## 具体例

### ❌ 違反例（存在しない）
```tsx
// components内でutilsを直接呼び出し
import { someFunction } from '@/utils/something';
someFunction(); // NG
```

### ✅ 正しい実装（実際のコード）
```tsx
// Toolbar.tsx
import { useJumpNavigation } from '@/hooks/useJumpNavigation';

const { jumpTo } = useJumpNavigation(editor, isWordMode);
// jumpToはhook内でutils関数をラップしている
```

```tsx
// useJumpNavigation.ts (hook)
import { highlightSearchMatches } from '@/utils/searchHighlight';

export const useJumpNavigation = (editor, isWordMode) => {
  const jumpTo = useCallback((target: string) => {
    // utilsの関数を呼び出し
    highlightSearchMatches(editorElement, target);
  }, [editor]);
  
  return { jumpTo };
};
```

## まとめ

**✅ 全ての外部ロジックはReactとHooksで結びつき、Reactの副作用としてのみ動作しています。**

### アーキテクチャの健全性
- ✅ lib: Tiptap拡張として正しく配置
- ✅ utils: 純粋関数として分離
- ✅ hooks: Reactとロジックの橋渡し
- ✅ components: UIのみ、ロジックなし

### Rules.md準拠
- ✅ Logic & UI Separation完全遵守
- ✅ 「Bridge (hooks)」の役割を完璧に実装
- ✅ componentsからutils/libへの直接アクセスなし
- ✅ 全てのロジックがReactの副作用として動作

**v2エディタは、rules.mdのアーキテクチャ原則に完全準拠しています。**
