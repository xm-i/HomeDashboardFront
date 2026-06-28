# HomeDashboard Frontend (Vue)

家庭内の各種情報を一元表示するホームダッシュボードの Web フロントエンドです。
Angular 17 製の既存実装（`HomeDashboardFront-Angular`）を **Vue 3 へ移行**したプロジェクトです。

## 主な機能

- **家計簿 (Financial)**: 資産 / 支出 / 収入 / 投資の可視化
- **ネットワーク (Network)**: DHCP 払い出しリスト / Wake on LAN / ネットワーク図 / ヘルスチェック
- **アクアリウム (Aquarium)**: 水温・気温・湿度のリアルタイム表示と過去推移
- **電力 (Electric Power)**: 消費電力のリアルタイム表示と過去推移
- **キッチン (Kitchen)** / **パルミー (Palmie)** / **リンク (Links)** / **設定 (Settings)**

## 技術スタック

| 役割 | 採用技術 |
| --- | --- |
| 言語 / フレームワーク | TypeScript / Vue 3（`<script setup>`） |
| ビルド | Vite |
| ルーティング | Vue Router 4 |
| 状態管理 | Pinia |
| UI | shadcn-vue + Tailwind CSS（ダークテーマ） |
| アイコン | lucide-vue-next |
| グラフ | Highcharts 11 + highcharts-vue |
| リアルタイム | @microsoft/signalr |
| HTTP | fetch（標準 API） |
| 日時 | dayjs |
| ユーティリティ | VueUse |

## セットアップ

```bash
# 依存関係のインストール
npm install

# 環境変数ファイルを用意（.env.example をコピーして編集）
cp .env.example .env
```

### 環境変数 (`.env`)

| 変数名 | 説明 | 例 |
| --- | --- | --- |
| `VITE_API_URL` | バックエンド API のベース URL | `https://localhost:5001/` |
| `VITE_PALMIE_VIDEO_URL` | パルミー動画の URL | `http://palmiecdn.nas.localnet/Videos/` |
| `VITE_PALMIE_DOCUMENTS_URL` | パルミー資料の URL | `http://palmiecdn.nas.localnet/Documents/` |
| `VITE_KWH_PRICE` | 電気料金単価（円/kWh） | `30.57` |

## 開発

```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# Lint
npm run lint

# 本番ビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## ディレクトリ構成

```
src/
  main.ts                 # エントリポイント
  App.vue
  router/                 # ルート定義
  stores/                 # Pinia ストア（SignalR / グローバル状態）
  composables/            # useSignalR, useDateRange など
  services/               # REST API 呼び出しモジュール
  models/                 # 型定義
  lib/                    # http(fetch ラッパー) / dayjs / Highcharts 設定
  config/                 # 環境変数ラッパー
  components/
    ui/                   # shadcn-vue コンポーネント
    layout/               # AppLayout, AppSidebar
    common/               # DateRangeSelector, Panel, ChartBase
  pages/                  # 画面コンポーネント（機能単位）
```

## 関連ドキュメント

- 移行プラン: [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
- AI アシスタント向けルール: [AGENTS.md](./AGENTS.md)
- 移行元（Angular 版）: `../HomeDashboardFront-Angular/`
