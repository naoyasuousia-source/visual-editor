# src/v2 コード修正・リファクタリング計画

## 1. 目的
`.agent/rules.md` に定義されたコーディング規約およびアーキテクチャに厳密に従うよう、`src/v2` 内のコードを修正し、品質と保守性を向上させる。

## 2. 現在の課題（規約違反）
- **ディレクトリ構造**: `src/v2/components/` 直下にコンポーネントが配置されている（`ui`, `common`, `features` への分類が必要）。
- **ファイルの長さ**: 300行を超えるファイルが複数存在する。
- **インラインスタイル**: Tailwind CSS ではなく、`style` 属性が使用されている箇所がある。
- **相対パス**: `@/` エイリアスではなく、相対パスでのインポートが存在する。
- **デッドコード**: 未使用のインポートや変数が残っている可能性がある。

## 3. 実装ステップ

### ステップ 1: ディレクトリ構造の適正化
- `src/v2/components/CommandApprovalBar.tsx` -> `src/v2/components/features/AutoEdit/CommandApprovalBar.tsx` (または適切な feature 下)
- `src/v2/components/CommandPopup.tsx` -> `src/v2/components/features/AutoEdit/CommandPopup.tsx`
- これに伴うインポートパスの修正。

### ステップ 2: インラインスタイルの Tailwind 移行
以下のファイルのインラインスタイルを Tailwind CSS に置き換える（動的な値を除く）。
- `src/v2/components/common/toolbar/FontMenu.tsx`
- `src/v2/components/common/toolbar/HighlightMenu.tsx`
- `src/v2/components/common/editor-menus/LinkBubbleMenu.tsx`
- `src/v2/components/common/editor-menus/ImageContextMenu.tsx`
- `src/v2/app/App.tsx`

### ステップ 3: 相対パスの修正
- `src/v2` 内の全ファイルを対象に、`../` や `./` によるインポートを `@/v2/...` に書き換える。

### ステップ 4: 長大ファイルの分割 (300行制限)
以下のファイルを機能単位で分割し、300行以内に納める。
- `src/v2/services/commandExecutionService.ts`
- `src/v2/services/newCommandExecutionService.ts`
- `src/v2/utils/commandParser.ts`
- `src/v2/utils/newCommandParser.ts`
- `src/v2/utils/paragraphOperations.ts`

### ステップ 5: デッドコードの削除と型安全の強化
- 各ファイルのスキャンを行い、未使用のインポート、変数、関数を削除。
- `any` 型の排除（可能な限り）。

### ステップ 6: 最終確認とビルドテスト
- `npm run build` を実行し、型エラーやビルドエラーがないことを確認。

## 4. 完了条件
- 全てのファイルが300行以内（`content.css`を除く）。
- インラインスタイルが排除されている（動的値を除く）。
- 全てのインポートが `@/` エイリアスを使用。
- `src/v2` ディレクトリが 4-Layer Architecture に完全準拠。
