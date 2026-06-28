<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useLocalStorage } from '@vueuse/core'
import DateRangeSelector from '@/components/common/DateRangeSelector.vue'
import ElectricPowerChart from './components/ElectricPowerChart.vue'
import { electricPowerApi } from '@/services/electric-power'
import type { DateRange } from '@/models/date-range.model'
import type { ElectricPower } from '@/models/electric-power.model'

/**
 * 電力（過去）ページ。
 * 任意の日付範囲を指定して電力消費量の折れ線チャートを表示する。
 * Angular 版 `electric-power-past` を移植（cookie 永続化は localStorage に置き換え）。
 */

// 選択値の永続化（Angular 版の cookie を localStorage に置き換え）
const startStr = useLocalStorage<string>(
  'electricPowerPastStartDate',
  dayjs().add(-7, 'day').startOf('month').format('YYYY-MM-DD HH:mm:ss'),
)
const endStr = useLocalStorage<string>(
  'electricPowerPastEndDate',
  dayjs().format('YYYY-MM-DD HH:mm:ss'),
)

/** 選択中日付範囲 */
const selectedDateRange = ref<DateRange>({
  startDate: dayjs(startStr.value),
  endDate: dayjs(endStr.value),
})

/** チャートデータ */
const chartData = ref<ElectricPower[]>([])

/** 選択中の日付範囲で電力消費量を再取得する */
async function reload(): Promise<void> {
  try {
    chartData.value = await electricPowerApi.getElectricPowerConsumptionList(
      selectedDateRange.value.startDate.format('YYYY-MM-DD HH:mm:ss'),
      selectedDateRange.value.endDate.format('YYYY-MM-DD HH:mm:ss'),
    )
  } catch (err: unknown) {
    console.error('電力消費量の取得に失敗しました', err)
  }
}

// 日付範囲の変更を localStorage に保存しつつデータを再取得する
watch(
  selectedDateRange,
  (range) => {
    startStr.value = range.startDate.format('YYYY-MM-DD HH:mm:ss')
    endStr.value = range.endDate.format('YYYY-MM-DD HH:mm:ss')
    void reload()
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-2">
      <DateRangeSelector v-model:date-range="selectedDateRange" :show-time="true" />
    </div>

    <div class="h-[520px]">
      <ElectricPowerChart :data="chartData" />
    </div>
  </div>
</template>
