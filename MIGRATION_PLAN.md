# HomeDashboardFront Angular → Vue 移行プラン

Angular 17 製の `HomeDashboardFront-Angular` を Vue 3 で書き換えるためのプランです。
UI ライブラリは ng-zorro へのこだわりが無いため、**shadcn-vue + Tailwind CSS** へ刷新します（デザインは多少変わってOK）。

---

## 1. 現状（Angular 版）の分析サマリ

| 項目 | 内容 |
| --- | --- |
| フレームワーク | Angular 17（NgModule ベース、standalone 未使用） |
| UI ライブラリ | ng-zorro-antd 17（ダークテーマ `ng-zorro-antd.dark.css`） |
| グラフ | Highcharts 11 + `angular-highcharts` + `highcharts-more` / `exporting` |
| リアルタイム | `@microsoft/signalr` 8（Hub: `api/hubs/dashboard-hub`） |
| HTTP | `HttpClient`（REST）。API サービス 8 本 |
| 日時 | `moment` |
| その他 | `linq`、`ngx-cookie-service`、`@ngneat/until-destroy`、`angular-resize-event` |
| コンポーネント数 | 約 48 |
| 状態管理 | RxJS（Subject / Observable）＋ DI されたサービス |
| 独自基盤 | `ParentComponent` / `DashboardParentComponent`（ライフサイクルを Observable 化した抽象基底クラス） |

### ルーティング構成（`dashboard` 配下の children）

- `/`（DashboardTop）
- `/financial` … Top / `asset` / `expense` / `income` / `investment`
- `/network` … Top / `dhcp-leases` / `wake-on-lan` / `diagram` / `health-check`
- `/aquarium` … Top / `past`
- `/electric-power` … Top / `past`
- `/kitchen`
- `/palmie` … Top / `:id`（コース詳細）
- `/settings`
- `/links`

### API サービス（移植対象）

`aquarium` / `dashboard`(SignalR) / `electric-power` / `financial` / `kitchen` / `network` / `palmie` / `settings`

代表的エンドポイント例（aquarium）:
- `GET api/aquarium-api/get-water-state-list?from=&to=&period=`
- `GET api/aquarium-api/get-latest-water-state`
- SignalR イベント: `aqua-state-changed`, `electric-power-received`

### 環境設定（`environment.ts`）

- `apiUrl`（例: `https://localhost:5001/`）
- `palmieVideoUrl` / `palmieDocumentsUrl`
- `kwhPrice`（電気料金単価）

---

## 2. 移行後（Vue 版）の技術スタック

| 役割 | Angular（現行） | Vue（移行後） |
| --- | --- | --- |
| フレームワーク | Angular 17 | **Vue 3（`<script setup>` + TypeScript）** |
| ビルド | Angular CLI / webpack | **Vite** |
| ルーティング | `@angular/router` | **Vue Router 4** |
| 状態管理 | サービス + RxJS Subject | **Pinia** |
| UI | ng-zorro-antd | **shadcn-vue + Tailwind CSS**（ダークテーマ） |
| アイコン | ant-design icons | **lucide-vue-next** |
| グラフ | angular-highcharts | **highcharts-vue**（Highcharts 本体は継続利用） |
| HTTP | HttpClient | **axios**（＋必要に応じ `@tanstack/vue-query`） |
| リアルタイム | @microsoft/signalr | **@microsoft/signalr（そのまま流用可）** |
| 日時 | moment | **dayjs**（API 互換が高く移植容易） |
| リサイズ検知 | angular-resize-event | **VueUse `useResizeObserver`** |
| 購読破棄 | @ngneat/until-destroy | Vue の `onUnmounted` / `watchEffect`（不要化） |
| linq | linq | ネイティブ配列メソッド or `es-toolkit` |
| Cookie | ngx-cookie-service | **VueUse `useCookies`** or `js-cookie` |

---

## 3. アーキテクチャ方針

- **基底クラス（`ParentComponent` / `DashboardParentComponent`）は廃止。** Angular のライフサイクルを Observable 化していた仕組みは、Vue のコンポジション API（`onMounted` / `watch` / Composable）で素直に置き換える。
- **RxJS は原則排除。** ストリーム的な処理（SignalR・チャートの追記）は Composable（`useSignalR` 等）＋ `ref` / `reactive` で実装。
- **API サービスは Composable 化。** `services/*.ts` を `useAquariumApi()` のような Composable、もしくはプレーンな関数モジュールへ変換。SignalR 接続は Pinia ストア（`useDashboardStore`）で単一管理。
- **モデル（`models/*.ts`）はほぼそのまま流用可能**（型定義は Vue でもそのまま使える）。
- レイアウトは ng-zorro の `nz-layout` / `nz-sider` / `nz-menu` を、shadcn-vue の Sidebar コンポーネント＋自作レイアウトで再現。

### ディレクトリ構成（案）

```
HomeDashboardFront/                 ← Vue プロジェクトのルート
  index.html
  vite.config.ts
  tailwind.config.ts
  components.json                   ← shadcn-vue 設定
  src/
    main.ts
    App.vue
    router/index.ts
    stores/                         ← Pinia（dashboard / settings 等）
    composables/                    ← useSignalR, useApi, useDateRange ...
    lib/                            ← axios インスタンス, dayjs, highcharts 設定
    config/env.ts                   ← apiUrl 等（.env で管理）
    components/
      ui/                           ← shadcn-vue 生成コンポーネント
      layout/                       ← AppSidebar, AppLayout
      common/                       ← DateRangeSelector, Panel, ChartBase
    models/                         ← 既存モデルを移植
    services/                       ← API 呼び出しモジュール
    pages/
      DashboardTop.vue
      financial/ network/ aquarium/ electric-power/
      kitchen/ palmie/ settings/ links/
    assets/
```

---

## 4. 移行ステップ（フェーズ分割）

### フェーズ 0: 基盤セットアップ
1. `HomeDashboardFront/` に Vite + Vue 3 + TS プロジェクト作成
2. Tailwind CSS + shadcn-vue 初期化（ダークテーマ既定）
3. Vue Router / Pinia 導入
4. `.env`（`VITE_API_URL`, `VITE_PALMIE_VIDEO_URL` 等）で環境変数化
5. axios インスタンス・dayjs・Highcharts のラッパー作成

### フェーズ 1: 共通基盤の移植
1. `models/*` をコピー移植（型のみなので低リスク）
2. `lib/highcharts.ts` … `utils/highcharts.options.ts` のデフォルトオプションを移植
3. Composable: `useSignalR`（dashboard-hub 接続を一元管理、`aqua-state-changed` / `electric-power-received` を購読）
4. レイアウト: `AppLayout.vue` + `AppSidebar.vue`（サイドメニュー＋ルーター差し込み）
5. 共通部品: `DateRangeSelector.vue`（dayjs ベース、shadcn-vue の Calendar/Popover）、`Panel.vue`、`ChartBase.vue`（highcharts-vue ラッパー＋リサイズ対応）

### フェーズ 2: ページ移植（機能単位、独立性が高い順）
1. **Links**（最小・静的） … 動作確認の足がかり
2. **Settings**（フォーム中心）
3. **Kitchen**
4. **Network**（dhcp-leases / wake-on-lan / diagram / health-check）
5. **Aquarium**（Top: SignalR リアルタイム / past: グラフ）
6. **Electric Power**（Top: SignalR / past: グラフ、`kwhPrice` 利用）
7. **Palmie**（一覧 + `:id` 詳細、動画/ドキュメント URL）
8. **Financial**（最大: asset / expense / income / investment、グラフ多数）

各ページごとに:
- API サービス移植 → Composable/store 接続 → 画面コンポーネント実装 → 動作確認

### フェーズ 3: 仕上げ
1. 全ルートの疎通・SignalR 再接続・グラフのリサイズ確認
2. ダークテーマの見た目調整
3. ビルド最適化（`vite build`）、`Jenkinsfile` のビルドコマンド更新
4. 旧 Angular 資産の取り扱い方針確定（並行運用 or 置き換え）

---

## 5. 重点的に注意するポイント

- **SignalR**: ライブラリはそのまま使えるが、購読/破棄を Composable に閉じ込め、ストアで単一接続を保つ。自動再接続設定を移植。
- **Highcharts のリアルタイム追記**: Angular 版は `chart.addPoint` で逐次追加。Vue でも `ref` でチャートインスタンスを保持し同等に実装（`@Input` setter のロジックを `watch` に置換）。
- **moment → dayjs**: API はほぼ互換だが、`startOf/endOf/add` などの利用箇所を全て確認。`DateRangeSelector` のプリセット（今月/先月/今年など）を移植。
- **ng-zorro 依存 UI の置換**: `nz-table` / `nz-date-picker` / `nz-modal` / `nz-form` などを shadcn-vue の対応コンポーネント（DataTable / Calendar / Dialog / Form）に読み替え。テーブルは `@tanstack/vue-table` 併用が有力。
- **基底クラス廃止に伴う再設計**: ライフサイクル Observable を使っていた箇所は素直な `onMounted`/`watch` に。
- **ルーティングの親子 + リダイレクト**: Angular の children 構造を Vue Router のネストされた `children` + `redirect` で忠実に再現。

---

## 6. リスクと対策

| リスク | 対策 |
| --- | --- |
| ng-zorro 固有コンポーネントの挙動差異 | 機能単位で見た目を再現、デザイン変更は許容範囲として調整 |
| Highcharts 設定の移植漏れ | `highcharts.options.ts` を最初に共通化し全チャートで共有 |
| SignalR の接続管理ミス | Pinia ストアで単一接続・再接続を集中管理 |
| API 仕様の取り違え | 各 `*-api.service.ts` のエンドポイントを移植時に一覧化して照合 |
| 一括移行による停滞 | ページ単位で段階移行し、都度動作確認 |

---

## 7. 次のアクション（着手候補）

- [ ] フェーズ 0 の Vite + Vue + Tailwind + shadcn-vue プロジェクト雛形を `HomeDashboardFront/` に生成
- [ ] `models/` と `highcharts.options.ts` の移植
- [ ] `useSignalR` Composable と `AppLayout`/`AppSidebar` の実装
- [ ] 最小ページ（Links）で疎通確認

> このプランで進めてよければ、フェーズ 0（プロジェクト雛形生成）から実装を開始します。
> 「shadcn-vue ではなく別の UI（例: PrimeVue / Naive UI）にしたい」「状態管理は Pinia 不要」等の希望があれば調整します。
