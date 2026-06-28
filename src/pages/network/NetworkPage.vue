<script setup lang="ts">
import { RouterView } from 'vue-router'

/**
 * ネットワーク機能のレイアウトラッパー。
 * Angular 版 `NetworkComponent`（router-outlet のみ）を再現し、子ルートを差し込む。
 */
</script>

<template>
  <div class="p-6">
    <RouterView />
  </div>
</template>
