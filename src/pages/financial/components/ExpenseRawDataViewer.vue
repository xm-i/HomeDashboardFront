<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { Transaction } from '@/models/transaction.model'
import type { TransactionCondition } from '@/models/condition.model'

/**
 * 支出生データ表示テーブル。
 * Angular 版 `app-expense-raw-data-viewer` を移植する。
 * - 支出（amount<0）を正の値へ反転し、フィルター条件で絞り込んで日付降順に表示する。
 */
const props = defineProps<{
  /** 取引履歴生データ */
  transactions: Transaction[]
  /** フィルター条件 */
  filterCondition?: TransactionCondition | null
}>()

/** 表示用テーブルデータ */
const tableData = computed<Transaction[]>(() =>
  props.transactions
    .map((x) => ({ ...x, amount: -x.amount }))
    .filter((x) => x.amount > 0)
    .filter((x) => props.filterCondition?.condition(x) ?? true)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
)

/** 合計金額 */
const totalAmount = computed<number>(() => tableData.value.reduce((s, x) => s + x.amount, 0))
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-border">
    <div class="max-h-[600px] overflow-auto">
      <table class="w-full text-sm">
        <thead class="sticky top-0 bg-muted text-muted-foreground">
          <tr>
            <th class="w-[110px] px-2 py-1 text-left">日付</th>
            <th class="w-[100px] px-2 py-1 text-right">金額</th>
            <th class="w-[130px] px-2 py-1 text-left">大カテゴリ</th>
            <th class="w-[130px] px-2 py-1 text-left">中カテゴリ</th>
            <th class="px-2 py-1 text-left">詳細</th>
            <th class="w-[150px] px-2 py-1 text-left">メモ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in tableData"
            :key="item.transactionId"
            class="border-t border-border text-foreground"
          >
            <td class="px-2 py-1">{{ dayjs(item.date).format('YYYY-MM-DD') }}</td>
            <td class="px-2 py-1 text-right">{{ item.amount.toLocaleString() }}円</td>
            <td class="truncate px-2 py-1">{{ item.largeCategory }}</td>
            <td class="truncate px-2 py-1">{{ item.middleCategory }}</td>
            <td class="break-words px-2 py-1">{{ item.content }}</td>
            <td class="truncate px-2 py-1" :title="item.memo">{{ item.memo }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="border-t border-border bg-muted px-2 py-1 text-right text-sm text-muted-foreground">
      合計 : {{ totalAmount.toLocaleString() }}円
    </div>
  </div>
</template>
