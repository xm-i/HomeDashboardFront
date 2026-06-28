<script setup lang="ts">
import { LayoutDashboard } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useDashboardStore } from '@/stores/dashboard'

const store = useDashboardStore()
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
    <LayoutDashboard class="size-12 text-primary" />
    <h1 class="text-3xl font-bold">{{ store.appName }}</h1>
    <p class="text-muted-foreground">
      Vue 3 + Vite + TypeScript + Tailwind CSS + shadcn-vue の雛形が起動しました。
    </p>
    <Button>セットアップ完了</Button>
  </main>
</template>
