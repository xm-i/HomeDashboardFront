<script setup lang="ts">
/**
 * 汎用パネル（カード）コンポーネント。
 * Angular 版 `app-panel`（nz-card によるラッパー）を shadcn-vue のカード調スタイルで再現する。
 * 既定スロットに内容を差し込む。
 */
</script>

<template>
  <div class="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
    <slot />
  </div>
</template>
