<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useLocalStorage } from '@vueuse/core'
import DateRangeSelector from '@/components/common/DateRangeSelector.vue'
import AssetTransitionChart from './components/AssetTransitionChart.vue'
import AssetRatioChart from './components/AssetRatioChart.vue'
import type { DateRange } from '@/models/date-range.model'

/**
 * 資産ページ。
 * Angular 版 `AssetComponent` を移植する。
 * - 日付範囲を選択し、資産推移チャートと資産割合チャートを表示する。
 * - 選択値は localStorage（startDate / endDate）に永続化する。
 */

// 永続化（Angular 版 cookie startDate / endDate。asset/expense/income で共有）
const startStr = useLocalStorage<string>('startDate', '')
const endStr = useLocalStorage<string>('endDate', '')

const initialStart = startStr.value
  ? dayjs(startStr.value)
  : dayjs().add(-6, 'month').startOf('month')
const initialEnd = endStr.value === 'today' || !endStr.value ? dayjs() : dayjs(endStr.value)

/** 選択中日付範囲 */
const selectedDateRange = ref<DateRange>({ startDate: initialStart, endDate: initialEnd })

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
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div class="h-[480px]">
        <AssetTransitionChart :date-range="selectedDateRange" />
      </div>
      <div class="h-[480px]">
        <AssetRatioChart :date-range="selectedDateRange" />
      </div>
    </div>
  </div>
</template>
