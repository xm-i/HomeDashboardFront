<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import dayjs from 'dayjs'
import { useLocalStorage } from '@vueuse/core'
import DateRangeSelector from '@/components/common/DateRangeSelector.vue'
import UpdateRequest from './components/UpdateRequest.vue'
import type { DateRange } from '@/models/date-range.model'

/**
 * 家計簿（Top）ページ。
 * Angular 版 `financial-top` を移植する。
 * - 更新対象の日付範囲を選択し、更新リクエストコンポーネントへ渡す。
 * - 選択値は localStorage に永続化する（Angular 版の cookie 相当）。
 *   終了日が当日の場合は "today" を保存する。
 */

// 永続化（Angular 版 cookie startDateForUpdate / endDateForUpdate）
const startStr = useLocalStorage<string>('startDateForUpdate', '')
const endStr = useLocalStorage<string>('endDateForUpdate', '')

/** 開始日の初期値（保存値がなければ 6 か月前の月初） */
const initialStart = startStr.value
  ? dayjs(startStr.value)
  : dayjs().add(-6, 'month').startOf('month')
/** 終了日の初期値（"today" または保存値、なければ現在） */
const initialEnd =
  endStr.value === 'today' || !endStr.value ? dayjs() : dayjs(endStr.value)

/** 選択中日付範囲 */
const selectedDateRange = ref<DateRange>({ startDate: initialStart, endDate: initialEnd })

// 日付範囲の変更を localStorage へ保存する
watch(
  selectedDateRange,
  (range) => {
    startStr.value = range.startDate.format('YYYY-MM-DD')
    endStr.value =
      range.endDate.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
        ? 'today'
        : range.endDate.format('YYYY-MM-DD')
  },
  { deep: true },
)
</script>

<template>
  <div class="space-y-4">
    <DateRangeSelector v-model:date-range="selectedDateRange" />
    <UpdateRequest :date-range="selectedDateRange" />
    <ul class="space-y-1">
      <li>
        <RouterLink to="/financial/asset" class="text-primary hover:underline">資産</RouterLink>
      </li>
      <li>
        <RouterLink to="/financial/expense" class="text-primary hover:underline">支出</RouterLink>
      </li>
      <li>
        <RouterLink to="/financial/income" class="text-primary hover:underline">収入</RouterLink>
      </li>
    </ul>
  </div>
</template>
