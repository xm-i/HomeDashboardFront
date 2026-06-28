<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { financialApi } from '@/services/financial'
import type { DateRange } from '@/models/date-range.model'

/**
 * 家計簿データの更新リクエストコンポーネント。
 * Angular 版 `app-update-request` を移植する。
 * - 更新リクエスト送信 → キー取得 → 進捗を 500ms 間隔でポーリングする。
 * - 進捗 100% で `updated` を emit し、3 秒後に進捗表示をリセットする。
 * - RxJS の interval/timer は setInterval/setTimeout に置き換え、onUnmounted で必ず解放する。
 */
const props = defineProps<{
  /** 更新対象の日付範囲 */
  dateRange?: DateRange | null
}>()

const emit = defineEmits<{
  /** 更新完了時に通知する */
  (e: 'updated'): void
}>()

/** 進捗率（0〜100） */
const progress = ref(0)

/** ポーリング用タイマー ID */
let intervalId: ReturnType<typeof setInterval> | null = null
/** リセット用タイマー ID */
let resetTimeoutId: ReturnType<typeof setTimeout> | null = null

/** ポーリングを停止する */
function stopPolling(): void {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

/** 更新リクエストを送信し、進捗をポーリングする */
async function updateRequest(): Promise<void> {
  if (!props.dateRange) {
    return
  }
  let key: string
  try {
    const result = await financialApi.postUpdateRequest(
      props.dateRange.startDate.format('YYYY-MM-DD'),
      props.dateRange.endDate.format('YYYY-MM-DD'),
    )
    key = result.key
  } catch (err: unknown) {
    console.error('更新リクエストに失敗しました', err)
    return
  }
  if (!key) {
    return
  }

  stopPolling()
  intervalId = setInterval(async () => {
    try {
      const status = await financialApi.getUpdateStatus(key)
      progress.value = status.progress
      if (progress.value === 100) {
        emit('updated')
        stopPolling()
        // 完了後 3 秒でリセットする
        resetTimeoutId = setTimeout(() => {
          progress.value = 0
        }, 3000)
      }
    } catch (err: unknown) {
      console.error('更新状況の取得に失敗しました', err)
    }
  }, 500)
}

// タイマーの解放漏れを防ぐ
onUnmounted(() => {
  stopPolling()
  if (resetTimeoutId !== null) {
    clearTimeout(resetTimeoutId)
    resetTimeoutId = null
  }
})
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- 円形の進捗表示 -->
    <div class="relative h-12 w-12">
      <svg class="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="none" class="stroke-muted" stroke-width="3" />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          class="stroke-primary transition-all"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="`${(progress / 100) * 100.5} 100.5`"
        />
      </svg>
      <span
        class="absolute inset-0 flex items-center justify-center text-xs text-foreground"
        >{{ progress }}%</span
      >
    </div>
    <Button :disabled="progress !== 0" @click="updateRequest">更新</Button>
  </div>
</template>
