<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from './AppSidebar.vue'

/**
 * アプリ全体のレイアウト。
 * Angular 版 `nz-layout`（sider + content）を、サイドバー + メインコンテンツで再現する。
 * メインコンテンツには子ルートが `RouterView` で差し込まれる。
 */
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background text-foreground">
    <AppSidebar />
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
