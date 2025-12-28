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
- 出力HTMLでも、エディタと同じように、背景濃いグレーで、ページ間間隔もエディタと同じになるようにcssを修正する。
- 出力HTMLはcontenteditableではなくする！！
- 各段落（p,h1～h6）には、data-page="n”は、記述しない。（<section data-page="n" class="page">はこのままでOK）    
- 画像挿入において、imgタグの中の、data-captionと、data-tagは記述しないようにする。（ai-image-index内の記述はこのままでOK）

## 2. 未解決要件に関するコード変更履歴
- **2025-12-29**: 
    - **分析**: 出力HTMLの生成ロジックが `src/v2/utils/aiMetadata.ts` に集中していることを確認。また、エディタの外観（背景色、ページ間隔）が `App.tsx` のTailwindクラスに依存しているため、これを `content.css` に移植して出力HTMLでも再現できるようにした。
    - **変更内容**: 
        - `src/v2/styles/content.css`: `body` の背景色、パディング、および `#pages-container` のレイアウト（flex, gap）を追加。印刷時のリセット処理も追加。
        - `src/v2/utils/aiMetadata.ts`: `buildFullHTML` 関数内に正規表現による属性フィルタリングを実装。`contenteditable`, `data-page` (段落/見出しのみ), `data-caption`, `data-tag` をエクスポート時に除去。
    - **結果**: 出力HTMLがエディタと同一の外観を持ちつつ、編集不可かつクリーンな属性構造を持つようになった。

## 3. 分析中に気づいた重要ポイント
- 出力HTML（保存ファイル）は `src/v2/utils/aiMetadata.ts` の `buildFullHTML` 関数で生成されている。
- `contenteditable="true"` は `pageExtension.ts` の `renderHTML` で `page-inner` に付与されている。エクスポート時にこれを削除する必要がある。
- `data-page` は `paragraphNumbering.ts` によって各段落に付与されているが、出力HTMLでは不要。
- 画像の `data-caption` と `data-tag` は `CustomImage` 拡張で付与されている。これらは `ai-image-index` に集約されているため、`img` タグ側からは削除して冗長性を排除する。
- エディタの外観（背景色 #525659、ページ間隔 24px）を再現するため、`content.css` に `body` と `container` 用のスタイルを追加する必要がある。

## 4. 解決済み要件とその解決方法

## 5. 要件に関連する全ファイルのファイル構成
- `src/v2/utils/aiMetadata.ts`: HTML生成・エクスポートロジック。
- `src/v2/styles/content.css`: コンテンツおよび出力HTMLのスタイル。
- `src/v2/lib/pageExtension.ts`: ページのレンダリング定義。
- `src/v2/lib/paragraphNumbering.ts`: 段落属性（data-page等）の管理。
- `src/v2/lib/customImage/index.ts`: 画像属性の管理。

## 6. 要件に関連する技術スタック
- React / TypeScript
- Tiptap (ProseMirror)
- Vanilla CSS

## 7. 要件に関する機能の動作原理
1. `editor.getHTML()` でエディタ内のHTML構造を取得。
2. `buildFullHTML` 内で、取得したHTMLにAI用ガイド（コメント）や画像インデックス（#ai-image-index）を付加。
3. `content.css` を `<style>` タグとして埋め込み、完全なHTMLを作成。
4. 今回、エクスポート直前に特定の属性（contenteditable, data-page, data-caption, data-tag）を除去するフィルタリング処理を追加する。

