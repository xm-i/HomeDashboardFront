<script setup lang="ts">
import Panel from '@/components/common/Panel.vue'

/**
 * リンク集ページ。
 * Angular 版 `LinksComponent` のハードコードされたリンクをそのまま移植する。
 */
const links: { label: string; url: string }[] = [
  { label: 'jenkins', url: '//jenkins.home-server.localnet/' },
  { label: 'ZABBIX', url: '//zabbix.home-server.localnet/' },
]
</script>

<template>
  <div class="p-6">
    <Panel>
      <h2 class="mb-4 text-xl font-semibold">リンク</h2>
      <ul class="flex flex-col gap-2">
        <li v-for="item in links" :key="item.url">
          <a
            :href="item.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary underline-offset-4 hover:underline"
          >
            {{ item.label }}
          </a>
        </li>
      </ul>
    </Panel>
  </div>
</template>
