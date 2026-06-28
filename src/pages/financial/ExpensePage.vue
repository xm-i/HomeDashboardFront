<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useLocalStorage } from '@vueuse/core'
import DateRangeSelector from '@/components/common/DateRangeSelector.vue'
import ExpenseTransitionChart from './components/ExpenseTransitionChart.vue'
import ExpenseRatioChart from './components/ExpenseRatioChart.vue'
import ExpenseRawDataViewer from './components/ExpenseRawDataViewer.vue'
import { financialApi } from '@/services/financial'
import { TransactionCondition } from '@/models/condition.model'
import type { DateRange } from '@/models/date-range.model'
import type { Transaction } from '@/models/transaction.model'

/**
 * 支出ページ。
 * Angular 版 `ExpenseComponent` を移植する。
 * - 日付範囲で取引を取得し、推移チャート・割合チャート・生データテーブルを表示する。
 * - フィルター条件は推移/割合チャートと双方向（v-model）で共有する。
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

/** フィルター条件 */
const filterCondition = ref<TransactionCondition>(new TransactionCondition())

/** 選択範囲の取引を取得し、選択値を保存する */
async function reload(): Promise<void> {
  try {
    transactions.value = await financialApi.getTransactions(
      selectedDateRange.value.startDate.format('YYYY-MM-DD'),
      selectedDateRange.value.endDate.format('YYYY-MM-DD'),
    )
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

    <!-- フィルター条件表示 -->
    <div class="space-y-2">
      <div class="text-sm text-muted-foreground">フィルター条件:</div>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span>年月:</span>
        <input
          type="text"
          disabled
          :value="filterCondition.month ?? ''"
          class="h-8 w-28 rounded-md border border-input bg-muted px-2 text-foreground"
        />
        <span>大カテゴリ:</span>
        <input
          type="text"
          disabled
          :value="filterCondition.largeCategory ?? ''"
          class="h-8 w-32 rounded-md border border-input bg-muted px-2 text-foreground"
        />
        <span>中カテゴリ:</span>
        <input
          type="text"
          disabled
          :value="filterCondition.middleCategory ?? ''"
          class="h-8 w-32 rounded-md border border-input bg-muted px-2 text-foreground"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div class="h-[480px]">
        <ExpenseTransitionChart
          :transactions="transactions"
          v-model:filter-condition="filterCondition"
        />
      </div>
      <div class="h-[480px]">
        <ExpenseRatioChart :transactions="transactions" v-model:filter-condition="filterCondition" />
      </div>
    </div>

    <ExpenseRawDataViewer :transactions="transactions" :filter-condition="filterCondition" />
  </div>
</template>
