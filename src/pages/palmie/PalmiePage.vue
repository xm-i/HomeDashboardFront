<script setup lang="ts">
import { RouterView } from 'vue-router'

/**
 * パルミー機能のレイアウトラッパー。
 * Angular 版 `PalmieComponent`（router-outlet のみ）を再現し、子ルートを差し込む。
 */
</script>

<template>
  <div class="p-6">
    <RouterView />
  </div>
</template>
