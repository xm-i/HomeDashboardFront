<script setup lang="ts">
import { RouterView } from 'vue-router'

/**
 * 家計簿・投資機能のレイアウトラッパー。
 * Angular 版 `FinancialComponent`（router-outlet のみ）を再現し、子ルートを差し込む。
 */
</script>

<template>
  <div class="p-6">
    <RouterView />
  </div>
</template>
