<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useLocalStorage } from '@vueuse/core'
import DateRangeSelector from '@/components/common/DateRangeSelector.vue'
import AquaPeriodSelector from './components/AquaPeriodSelector.vue'
import WaterStatesChart from './components/WaterStatesChart.vue'
import type { DateRange } from '@/models/date-range.model'

/**
 * アクアリウム（過去）ページ。
 * 任意の日付範囲・間隔を指定して水質状態の箱ひげ図を表示する。
 * Angular 版 `aquarium-past` を移植（cookie 永続化は localStorage に置き換え）。
 */

// 選択値の永続化（Angular 版の cookie を localStorage に置き換え）
const startStr = useLocalStorage<string>(
  'aquaStartDate',
  dayjs().add(-7, 'day').startOf('month').format('YYYY-MM-DD HH:mm:ss'),
)
const endStr = useLocalStorage<string>('aquaEndDate', dayjs().format('YYYY-MM-DD HH:mm:ss'))
/** 選択中間隔（秒） */
const selectedPeriod = useLocalStorage<number>('aquaPastPeriod', 1800)

/** 選択中日付範囲 */
const selectedDateRange = ref<DateRange>({
  startDate: dayjs(startStr.value),
  endDate: dayjs(endStr.value),
})

// 日付範囲の変更を localStorage に保存する
watch(
  selectedDateRange,
  (range) => {
    startStr.value = range.startDate.format('YYYY-MM-DD HH:mm:ss')
    endStr.value = range.endDate.format('YYYY-MM-DD HH:mm:ss')
  },
  { deep: true },
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <DateRangeSelector v-model:date-range="selectedDateRange" :show-time="true" />
      <AquaPeriodSelector v-model:period="selectedPeriod" />
    </div>

    <div class="h-[520px]">
      <WaterStatesChart :date-range="selectedDateRange" :period="selectedPeriod" />
    </div>
  </div>
</template>
