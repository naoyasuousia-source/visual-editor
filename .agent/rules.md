---
trigger: always_on
---

# Antigravity 開発・実装ルール

シニアエンジニアとして、要件を完璧に遵守し、バグの混入を最小限に抑えることを最優先事項として、最高品質かつ型安全な Web アプリを構築してください。

## 0. 基本原則
- **常に日本語で回答すること。**
- **成果物（計画書、タスク、設計ドキュメント等）もすべて日本語で作成すること。**
- **作業計画書（.md）は必ずプロジェクトのルートフォルダ直下に配置すること。**

---

## 1. 📋 クイックリファレンス（最重要項目）

- **Dead Code Cleanup:** 修正・リファクタリングの過程で未使用となった変数、インポート、関数、ファイルは、検知した瞬間に即座に削除せよ。
- **4-Layer Architecture:** UI, Hooks, Services, Utils を厳密に分離せよ。UI での DOM 操作や複雑なロジック記述は厳禁。
- **Styling:** 原則 **Tailwind CSS のみ**を使用せよ。インラインスタイル（`style` 属性）は動的に計算される数値を除いて禁止。
- **300-Line Limit:** 1ファイル300行以内を厳守せよ。
- **No Placeholders:** `// TODO` や `// 実装予定` 等を残さず、全ての関数を完全に実装せよ。
- **No Unauthorized Browser Check:** ユーザーの明示的な指示なく、勝手にブラウザ確認作業（`npm run dev` によるローカルサーバー起動やブラウザ操作）を開始しないこと（時間の浪費を避けるため）。


### 例外事項
 
 - **【例外】** `content.css` は規定行数を超えていても、絶対に分割してはならない。
---

## 2. 🏗️ アーキテクチャと設計指針 (4-Layer Architecture)

### アーキテクチャ構成：4つの主要層と補助ディレクトリ

ロジックとUIを「4つの主要層（Core Layers）」に分離し、その他のディレクトリを「補助層（Support Layers）」として整理せよ。

#### 1. 主要層 (Core Layers)

1. **Logic (utils / lib)**
    - **utils**: React に依存しない純粋関数。計算、フォーマット、変換など。
    - **lib**: 外部ライブラリ（Tiptap, Supabase 等）の**初期化、インスタンス作成、ライブラリ固有の設定**。
2. **External Actions (services)**
    - API 通信、SDK の直接操作、外部データとのやり取り。
    - React のステートを持たず、純粋な非同期処理（Promise の返却）に徹する。
3. **Bridge (hooks)**
    - **役割**: UI と Logic/Services を仲介する唯一の場所。
    - **使用条件**: `useState`, `useEffect`, `useContext` などの React ステートやライフサイクルが必要な場合。
    - **Bridge層 (Hooks) へ逃がすべきこと (Domain Logic)**:
        - **ビジネスルールの適用**: 「体温が37.5度以上ならアラートフラグを立てる」といった、アプリの仕様に関わる判定。
        - **複数の State を跨ぐ計算**: 2つ以上のステートを組み合わせて新しいデータを作る場合。
        - **外部依存**: APIからの取得データ（Services）を画面用に整形する処理。
    - **重要**: 外部ライブラリや独自ロジックが hooks を経由せず、直接 DOM 操作をすることを禁止する。
4. **UI (components)**
    - **役割**: 描画と表現、ユーザーイベントの検知に専念する。
    - **コンポーネント内に書いても良いこと (UI Logic)**:
        - **見た目の制御**: 「開閉フラグに基づいて表示文言を切り替える」「特定条件でCSSクラスを付与する」など。
        - **軽量な派生データ計算**: 渡された `props` や `state` から、表示に必要な形に変換する程度の pure な計算（10行以内目安）。
        - **useMemo の利用**: 上記の処理が再レンダリングで重くなる場合のメモ化。
    - **プレミアムなデザイン実装**: 単に動くだけでなく、適切な余白、洗練された配色、滑らかなマイクロアニメーション（Hover, Transition）を積極的に導入し、プレミアムなユーザー体験（UX）を構築せよ。
    - **禁止事項**: 複雑なビジネスロジックの混入、直接的な API 通信ロジックの記述。これらの Domain Logic は必ず Hooks へ委ねること。

#### 2. 補助層 (Support Layers)

- **app**: エントリポイント、グローバルプロバイダー。
- **constants**: **業務的な定数（選択肢、ヘルプテキスト、固定メッセージ等）**の集約。
- **store**: グローバル状態管理（Zustand 等）。
- **types**: 型定義、Zod スキーマ。
- **styles**: CSS、Tailwind 設定。

### Framework & Library
- **React (TypeScript)**: コンポーネントベースで開発し、本体の HTML 記述は最小限に留める。
- **Library Selection**: 独自ロジックを組む前に、最適な React ライブラリの導入を検討せよ。
- **Optimization**: 大規模ライブラリ導入時は `React.lazy` によるダイナミックインポートを検討し、Lighthouse スコアを維持せよ。

---

## 3. 💻 コーディング規格と型安全

### ファイルと命名規則
- **Path Alias**: すべて `@/` を使用せよ。相対パス（`../`）は禁止。
- **Naming Conventions**:
    - **ディレクトリ名**: `kebab-case` （例: `user-profile`, `common-ui`）
    - **コンポーネントファイル名**: `PascalCase` （例: `PrimaryButton.tsx`）
    - **それ以外のファイル（hooks, utils, services 等）**: `camelCase` （例: `useAuth.ts`, `formatDate.ts`）
- **Early Return**: 早期リターンを徹底し、コードのネストを最小限に抑えよ。

### 型安全の徹底
- **No `any`**: `any` の使用を禁止。`unknown` と型ガードを活用せよ。
- **Zod Validation**: API レスポンス等の外部データ境界には必ず **Zod** を使用し、バリデーションと型定義をセットでカプセル化せよ。

---

## 4. 🔄 ステート管理と副作用 (Side Effect Integrity)

### ステート管理
- **Minimal State**: 基本は Local State で完結させ、共有が必要な場合のみ `store/` (Zustand 等) へ昇格させよ。
- **Derived Data**: `useEffect` によるステート同期を厳禁とする。派生データはレンダリング中に計算するか、`useMemo` を使用せよ。
- **Computational Memoization**: コストの高い加工（フィルタリング、ソート等）は必ず `useMemo` を使い、依存配列を厳密に管理せよ。

### 副作用と非同期処理
- **useEffect の限定利用**: 外部ライブラリの同期、Socket、外部 API 同期、DOM 操作の調整にのみ使用せよ。
- **Cleanup Pattern**: `useEffect` では必ずクリーンアップ関数（`return () => ...`）を記述し、タイマー、購読、イベントリスナー、メモリリークを確実に防止せよ。
- **Race Condition**: 非同期処理では古いリクエストを無視する等のクリーンアップを徹底し、競合状態を防げ。
- **Ref Safety**: `useRef` による DOM 操作は、React の宣言的 UI と衝突しないよう最小限に留めよ。

### エッジケース想定 (Edge Case Considerations)
「普通じゃないことが起こったらどうなるか」を常に考え、堅牢な実装を行え。
- **異常系データ**: ユーザーが異常なデータを入力した、データ量が想定の10倍になった、などの極端な状況下でもシステムがクラッシュしない対策を立てよ。
- **通信トラブル**: 通信が途中で切断された、APIがタイムアウトした、などの予期せぬトラブルを想定し、適切なローディング表示やリトライ・エラーリカバリ処理を実装せよ。

---

## 5. 🎨 スタイリングと UI 標準

### Tailwind CSS の運用
- **Tailwind Exclusive**: 原則として Tailwind クラスのみを使用せよ。
- **index.css の役割**: 基本は `@tailwind` 3行のみ。例外として、外部ライブラリ（ProseMirror 等）の内部クラス上書きや、Tailwind で記述困難な複雑な擬似要素（`::before` 等）のみ許可する。
- **Dynamic Styles**: `style` 属性の使用は、JS で動的に計算される数値（座標、進捗率、色変化等）に限定せよ。それ以外の静的なスタイル、またはクラスで容易に定義可能なスタイルでの使用は禁止。
- **Design Excellence**: モダンなタイポグラフィ（Inter, Roboto 等）、一貫したデザイントークン、アクセシビリティ（WAI-ARIA）を融合させ、「プロレベルの品質」を維持せよ。

### UI ライブラリとコンポーネント
- **Shadcn/ui**: 第一選択の UI コンポーネント群とする。`src/components/ui/` は直接編集してプロジェクトに最適化して良い。
- **Class Management**: 動的なクラス結合には必ず `cn()` (tailwind-merge) を使用せよ。
- **Design Tokens**: マジックナンバー（`h-[32px]` 等）を避け、`tailwind.config.ts` に定義したブランドカラーやサイズを使用せよ。

### レスポンシブとアクセシビリティ
- **Multi-Environment Adaptation**: 画面幅（Desktop/Tablet/Mobile）だけでなく、OS、ブラウザ、通信速度などの「場合分け」を徹底せよ。1024px〜1920px以上の変化への追従はもちろん、低速回線やモバイル環境下でも最適なUI/UXを提供できるよう設計せよ。
- **Accessibility (A11y)**: WAI-ARIA、適切な `aria-label`、キーボード操作の保証をシニアレベルで行え。

---

## 6. 📁 ディレクトリ構造 (Directory Structure)

`src/` 直下へのファイル作成を禁じ、以下の構造を遵守せよ。

```text
src/
├── app/          # Core: エントリポイント、グローバルプロバイダー
├── components/   # UI: 描画専用コンポーネント
│   ├── ui/       # Atom: Shadcn/ui 等の再利用可能な最小単位
│   ├── common/   # Molecules: 共通レイアウト、複数機能で使う部品
│   └── features/ # Organisms: 機能単位でグループ化されたドメインコンポーネント
├── constants/    # Data: 固定文言、ヘルプテキスト、設定定数
├── hooks/        # Bridge: UIとLogic/Servicesを接続するカスタムフック
├── lib/          # Config: 外部ライブラリ初期化（Tiptap, Supabase等）
├── utils/        # Logic: 計算・整形などの純粋関数
├── services/     # API: 外部通信ロジック、SDK操作
├── store/        # State: グローバル状態管理（Zustand等）
├── styles/       # Style: グローバルCSS、Tailwind設定
└── types/        # Schema: 型定義、Zodスキーマ
```

### 運用ルール
- **機能優先**: 新機能は `features/` 内にディレクトリを作成して配置する。
- **定数と設定の分離**: 
    - 業務的な定数（固定文言など）は `constants/` に集約せよ。
    - ライブラリ固有の設定値（初期化オプション等）は `lib/` 内に定義せよ。
- **主要4層の相互作用**: UI -> Hooks -> Services/Logic の一方向の依存関係を厳守せよ。補助層は必要に応じて各層から参照される。

---

## 7. 🔐 セキュリティとシークレット管理

- **No Hardcoding**: API キーや秘密鍵をコード内にハードコードすることを厳禁とする。
- **Environment Variables**:
    - `.env` は必ず `.gitignore` に含め、リポジトリにコミットしないこと。
    - `VITE_` プレフィックスが付く変数はブラウザに露出するため、公開可能な情報のみに限定せよ。
    - セキュアな秘密鍵はフロントエンドに持ち込まず、バックエンドまたはプロキシ経由で扱え。

---

## 8. 🚀 Antigravity 最適化ワークフロー

AI 駆動開発ツールの特性を活かし、効率を最大化せよ。

### ファイル操作と編集
- **Batch Editing**: 同一ファイル内の複数箇所編集には `multi_replace_file_content` を使用し、呼び出し回数を最小化せよ。
- **Parallel Processing**: 依存関係のない操作は `waitForPreviousTools: false` で並列実行せよ。

### 検証とエラー対応
- **Background Build**: `npm run build` は `WaitMsBeforeAsync` を活用してバックグラウンドで実行せよ。
- **Targeted Fix**: ビルドエラー時は `command_status` でエラー箇所を特定し、ピンポイントで修正せよ。
- **Tool call retry**: エラー時はメッセージを精読し、1回のみリトライせよ。3回失敗した場合はユーザーに報告せよ。

### コミュニケーション
- **No Guesswork**: 仕様不明点は推測せず、作業開始前にユーザーに確認せよ。
- **Status Reporting**: 実装後の動作未確認コードを「完成」として提出することを禁ずる。
- **Incremental Steps**: 依存関係がある場合は順次実行（`waitForPreviousTools: true`）し、不整合を防げ。