# HomeDashboard Frontend AI Assistant Rules (AGENTS.md)

このファイルは、AIアシスタント（Agent）が HomeDashboard フロントエンド（Vue 版）プロジェクトでコードを読み書きする際の**基本ルールとコンテキスト**を定義するものです。AIアシスタントはこのファイルの内容を優先して遵守します。

## 1. プロジェクトの概要と方針
- **プロジェクトの目的**: 家庭内の各種情報（家計簿・ネットワーク・アクアリウム・電力・キッチン・パルミー等）を一元表示するホームダッシュボードの Web フロントエンド。
- **背景**: Angular 17 + ng-zorro-antd 製の既存実装（`HomeDashboardFront-Angular`）を **Vue 3 へ全面移行**する。移行プランは [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) を参照する。
- **コミュニケーション**: AIアシスタントとのチャットおよびすべての回答（実装プラン等を含む）は**「日本語」**で行うこと。

## 2. 技術スタック
- **言語・フレームワーク**: TypeScript, Vue 3（`<script setup>` SFC）
- **ビルドツール**: Vite
- **ルーティング**: Vue Router 4（ネストされた children 構成）
- **状態管理**: Pinia
- **UI ライブラリ**: shadcn-vue + Tailwind CSS（ダークテーマ既定）
- **アイコン**: lucide-vue-next
- **グラフ**: Highcharts 11 + highcharts-vue
- **リアルタイム通信**: @microsoft/signalr（Hub: `api/hubs/dashboard-hub`）
- **HTTP クライアント**: axios
- **日時処理**: dayjs
- **ユーティリティ**: VueUse

## 3. コーディング規約とアーキテクチャルール

### プロジェクト構成とファイル定義
- `src/main.ts`: アプリのエントリポイント（Vue / Router / Pinia の初期化）。
- `src/router/`: ルート定義。Angular 版の親子ルート構成を忠実に再現する。
- `src/stores/`: Pinia ストア。SignalR 接続やグローバル状態を集中管理する（例: `useDashboardStore`）。
- `src/composables/`: 再利用ロジック（`useSignalR`, `useDateRange` など）。Angular のサービス/基底クラス相当のロジックはここへ。
- `src/services/`: REST API 呼び出しモジュール。機能ごとに分割（`aquarium`, `financial`, `network` 等）。
- `src/models/`: 型定義。Angular 版の `models/*.ts` を移植する。
- `src/lib/`: 横断的な設定（axios インスタンス, dayjs, Highcharts 既定オプション）。
- `src/config/`: 環境変数のラッパー（`apiUrl` 等）。
- `src/components/ui/`: shadcn-vue が生成する UI コンポーネント（**手動で大きく改変しない**）。
- `src/components/layout/`: `AppLayout`, `AppSidebar` などレイアウト。
- `src/components/common/`: `DateRangeSelector`, `Panel`, `ChartBase` など共通部品。
- `src/pages/`: 画面コンポーネント。機能ディレクトリ（`financial/`, `network/`, `aquarium/` 等）配下に配置する。

### 実装上のルール
- **Composition API の徹底**: コンポーネントは必ず `<script setup lang="ts">` で記述する。Options API は使用しない。
- **コメント規約**: コメントは必ず「日本語」で記述すること。複雑なロジックを持つ関数・Composable・型には JSDoc 形式のコメントを付与すること。
- **状態管理**: コンポーネントをまたぐ状態は Pinia ストアで管理する。SignalR 接続は**単一接続**をストアで保持し、各画面はストア経由で購読する。
- **RxJS は使用しない (重要)**: Angular 版の RxJS / `@ngneat/until-destroy` / 基底クラス（`ParentComponent` 等）は移植しない。ストリーム的処理は `ref`/`reactive`/`watch` と Composable で実装する。
- **購読・リソースの解放**: SignalR の `on`/`off`、`ResizeObserver`、タイマー等は必ず `onUnmounted` で解放すること。可能な限り VueUse（`useResizeObserver` 等）を使い、解放漏れを防ぐ。
- **UI ライブラリの優先**: UI 要素は可能な限り shadcn-vue のコンポーネントを使う。独自実装やインライン CSS よりも Tailwind ユーティリティクラスを優先する。
- **日時処理は dayjs に統一**: `moment` は使用しない。日付範囲のプリセット（今月/先月/今年 等）は `DateRangeSelector` に集約する。
- **API 呼び出し**: 直接 `axios` をコンポーネントで叩かず、`src/services/` のモジュールを経由すること。エンドポイント URL は Angular 版の `*-api.service.ts` と照合して移植する。
- **環境変数**: API の URL 等のハードコードは禁止。`.env`（`VITE_API_URL`, `VITE_PALMIE_VIDEO_URL`, `VITE_PALMIE_DOCUMENTS_URL`, `VITE_KWH_PRICE` 等）で管理し、`src/config/` 経由で参照する。
- **型安全**: `any` の使用は最小限に留め、`src/models/` の型を活用する。
- **Highcharts**: チャートの既定オプションは `src/lib/highcharts.ts` に集約し、各チャートで共有する。リアルタイム追記は `ChartBase` のラッパー越しに行う。
- **作業完了前の検証 (重要)**: 作業を終了する前に、必ず `npm run lint`、`npm run type-check`（`vue-tsc`）、`npm run build` を実行し、Lint エラー・型エラー・ビルドエラーがすべて解消されていることを確認すること。

## 4. 移行作業の進め方
- 移行は [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) のフェーズ順に進める。
- ページ単位で「API サービス移植 → Composable/store 接続 → 画面実装 → 動作確認」を 1 サイクルとする。
- 独立性の高い順（Links → Settings → Kitchen → Network → Aquarium → Electric Power → Palmie → Financial）で着手する。
- 各機能の挙動は Angular 版（`HomeDashboardFront-Angular`）を正とし、仕様を照合しながら移植する。デザインの細部は変わってよいが、機能の欠落は避ける。

## 5. 参照
- 移行プラン: [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
- 既存実装（参照元）: `../HomeDashboardFront-Angular/`
