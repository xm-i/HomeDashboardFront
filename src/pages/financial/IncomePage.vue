<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useLocalStorage } from '@vueuse/core'
import DateRangeSelector from '@/components/common/DateRangeSelector.vue'
import IncomeTransitionChart from './components/IncomeTransitionChart.vue'
import IncomeRatioChart from './components/IncomeRatioChart.vue'
import IncomeRawDataViewer from './components/IncomeRawDataViewer.vue'
import { financialApi } from '@/services/financial'
import type { DateRange } from '@/models/date-range.model'
import type { Transaction } from '@/models/transaction.model'
import type { Condition } from '@/models/condition.model'

/**
 * 収入ページ。
 * Angular 版 `IncomeComponent` を移植する。
 * - 日付範囲で取引を取得し、推移チャート・割合チャート・生データテーブルを表示する。
 * - 絞り込み条件は推移/割合チャートから受け取り（emit）、生データテーブルへ渡す。
 */

// 永続化（Angular 版 cookie startDate / endDate）
const startStr = useLocalStorage<string>('startDate', '')
const endStr = useLocalStorage<string>('endDate', '')

const initialStart = startStr.value
  ? dayjs(startStr.value)
  : dayjs().add(-6, 'month').startOf('month')
const initialEnd = endStr.value === 'today' || !endStr.value ? dayjs() : dayjs(endStr.value)

/** 選択中日付範囲 */
const selectedDateRange = ref<DateRange>({ startDate: initialStart, endDate: initialEnd })

/** 取引履歴生データ */
const transactions = ref<Transaction[]>([])

/** 絞り込み条件 */
const filterCondition = ref<Condition<Transaction> | null>(null)

/** 選択範囲の取引を取得し、選択値を保存する */
async function reload(): Promise<void> {
  try {
    transactions.value =
      (await financialApi.getTransactions(
        selectedDateRange.value.startDate.format('YYYY-MM-DD'),
        selectedDateRange.value.endDate.format('YYYY-MM-DD'),
      )) ?? []
  } catch (err: unknown) {
    console.error('取引の取得に失敗しました', err)
  }
  startStr.value = selectedDateRange.value.startDate.format('YYYY-MM-DD')
  endStr.value =
    selectedDateRange.value.endDate.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
      ? 'today'
      : selectedDateRange.value.endDate.format('YYYY-MM-DD')
}

watch(selectedDateRange, () => void reload(), { deep: true, immediate: true })
</script>

<template>
  <div class="space-y-4">
    <DateRangeSelector v-model:date-range="selectedDateRange" />

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div class="h-[480px]">
        <IncomeTransitionChart
          :transactions="transactions"
          @filter-condition-change="filterCondition = $event"
        />
      </div>
      <div class="h-[480px]">
        <IncomeRatioChart
          :transactions="transactions"
          @filter-condition-change="filterCondition = $event"
        />
      </div>
    </div>

    <IncomeRawDataViewer :transactions="transactions" :filter-condition="filterCondition" />
  </div>
</template>
