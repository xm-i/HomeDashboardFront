<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'

/** リンク項目 */
interface LinkItem {
  /** 表示タイトル */
  title: string
  /** 遷移先 URL */
  url: string
}

/** リンクカテゴリ */
interface LinkCategory {
  /** カテゴリ見出し */
  title: string
  /** カテゴリ内のリンク一覧 */
  items: LinkItem[]
}

/**
 * リンク集データ。
 * タイトルと管理画面 URL のみをシンプルにまとめる。
 */
const categories: LinkCategory[] = [
  {
    title: 'Web サービス',
    items: [
      { title: 'ホームダッシュボード', url: 'https://dashboard.home-server.internal/' },
      { title: 'Jenkins', url: 'https://jenkins.home-server.internal/' },
      { title: 'Grafana', url: 'https://monitor.home-server.internal/' },
      { title: 'EPGStation', url: 'https://recorder.home-server.internal/' },
      { title: 'Rundeck', url: 'https://rundeck.home-server.internal/' },
      { title: 'Pinpon', url: 'https://pinpon.home-server.internal/' },
    ],
  },
  {
    title: '監視・ツール',
    items: [
      { title: 'DHCP リース一覧', url: 'http://dns-server.internal/' },
      { title: 'Prometheus', url: 'http://watch-server.internal:9090/' },
      { title: 'Alertmanager', url: 'http://watch-server.internal:9093/' },
      { title: 'Mirakurun', url: 'http://recorder.internal:40772/' },
    ],
  },
  {
    title: 'ネットワーク機器・NAS',
    items: [
      { title: 'Yamaha RTX1210', url: 'http://rtx1210.internal/' },
      { title: 'NETGEAR XS708T', url: 'http://xs708t.internal/' },
      { title: 'ASUSTOR NAS', url: 'http://nas-management.internal/' },
      { title: 'Buffalo WXR-5950AX12', url: 'http://wxr-5950ax12.internal/' },
    ],
  },
]
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <h2 class="text-xl font-semibold">リンク</h2>

    <section v-for="category in categories" :key="category.title" class="flex flex-col gap-3">
      <h3 class="text-sm font-medium text-muted-foreground">{{ category.title }}</h3>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <a
          v-for="item in category.items"
          :key="item.url"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex flex-col gap-1 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:border-ring/50 hover:bg-accent/40"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-sm font-semibold text-foreground">{{ item.title }}</span>
            <ExternalLink
              class="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
            />
          </div>
          <span class="truncate font-mono text-xs text-muted-foreground">
            {{ item.url }}
          </span>
        </a>
      </div>
    </section>
  </div>
</template>
