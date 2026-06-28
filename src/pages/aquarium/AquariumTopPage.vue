<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs, { type ManipulateType } from 'dayjs'
import { useLocalStorage } from '@vueuse/core'
import CurrentWaterStates from './components/CurrentWaterStates.vue'
import AquaPeriodSelector from './components/AquaPeriodSelector.vue'
import WaterStatesChart from './components/WaterStatesChart.vue'
import type { DateRange } from '@/models/date-range.model'

/**
 * アクアリウム（現在）ページ。
 * 現在の水質状態（リアルタイム）と、期間/間隔指定の箱ひげ図を表示する。
 * Angular 版 `aquarium-top` を移植（cookie 永続化は localStorage に置き換え）。
 */

/** 期間プリセット（Angular 版 termCandidate を dayjs 単位に置き換え） */
const termCandidate: { value: string; unit: ManipulateType }[] = [
  { value: '1', unit: 'hour' },
  { value: '6', unit: 'hour' },
  { value: '12', unit: 'hour' },
  { value: '1', unit: 'day' },
  { value: '3', unit: 'day' },
  { value: '7', unit: 'day' },
  { value: '14', unit: 'day' },
  { value: '1', unit: 'month' },
  { value: '6', unit: 'month' },
  { value: '1', unit: 'year' },
  { value: '3', unit: 'year' },
  { value: '10', unit: 'year' },
]

// 選択値の永続化（Angular 版の cookie を localStorage に置き換え）
const termValue = useLocalStorage<string>('aquaTermValue', '2')
const termUnit = useLocalStorage<string>('aquaTermUnit', 'day')
/** 選択中間隔（秒） */
const selectedPeriod = useLocalStorage<number>('aquaPeriod', 1800)

/** select 用のキー（value|unit）。候補に一致しなければ空文字。 */
const selectedTermKey = computed<string>(() => {
  const found = termCandidate.find((x) => x.value === termValue.value && x.unit === termUnit.value)
  return found ? `${found.value}|${found.unit}` : ''
})

/** 選択中日付範囲 */
const selectedDateRange = ref<DateRange | null>(null)

/** 選択中の期間プリセットから日付範囲を再計算する */
function updateDateRange(): void {
  const found = termCandidate.find((x) => x.value === termValue.value && x.unit === termUnit.value)
  if (!found) {
    return
  }
  selectedDateRange.value = {
    startDate: dayjs().add(-Number(found.value), found.unit),
    endDate: dayjs(),
  }
}

/** select 変更時に value/unit を保存して日付範囲を更新する */
function onTermChange(event: Event): void {
  const key = (event.target as HTMLSelectElement).value
  const [value, unit] = key.split('|')
  termValue.value = value
  termUnit.value = unit
  updateDateRange()
}

// 初期表示時に日付範囲を確定する
watch(selectedTermKey, updateDateRange, { immediate: true })
</script>

<template>
  <div class="space-y-4">
    <CurrentWaterStates />

    <div class="flex flex-wrap items-center gap-2">
      <select
        :value="selectedTermKey"
        class="h-9 w-[140px] rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        @change="onTermChange"
      >
        <option value="" disabled>期間の選択</option>
        <option v-for="item in termCandidate" :key="`${item.value}|${item.unit}`" :value="`${item.value}|${item.unit}`">
          {{ item.value }} {{ item.unit }}
        </option>
      </select>
      <AquaPeriodSelector v-model:period="selectedPeriod" />
    </div>

    <div class="h-[520px]">
      <WaterStatesChart :date-range="selectedDateRange" :period="selectedPeriod" />
    </div>
  </div>
</template>
