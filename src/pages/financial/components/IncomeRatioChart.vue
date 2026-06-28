<script setup lang="ts">
import { computed } from 'vue'
import Highcharts from 'highcharts'
import ChartBase from '@/components/common/ChartBase.vue'
import type { Transaction } from '@/models/transaction.model'
import type { Condition } from '@/models/condition.model'

/**
 * 収入割合チャート（中カテゴリ別の円グラフ）。
 * Angular 版 `app-income-ratio-chart` を移植する。
 * - スライスクリックで「中カテゴリ」の絞り込み条件を親へ通知する。
 */
const props = defineProps<{
  /** 取引履歴生データ */
  transactions: Transaction[]
}>()

const emit = defineEmits<{
  /** 絞り込み条件の更新を通知する */
  (e: 'filterConditionChange', value: Condition<Transaction>): void
}>()

/** 配列をキー単位の Map にグルーピングする（出現順を保持） */
function groupBy<T>(items: T[], keyOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const arr = map.get(key)
    if (arr) {
      arr.push(item)
    } else {
      map.set(key, [item])
    }
  }
  return map
}

/** チャートオプション（transactions に依存） */
const chartOptions = computed<Highcharts.Options>(() => {
  const groups = [...groupBy(props.transactions.filter((x) => x.amount > 0), (x) => x.middleCategory).entries()]
    .map(([middleCategory, items]) => ({
      middleCategory,
      sum: items.reduce((s, x) => s + x.amount, 0),
    }))
    .sort((a, b) => b.sum - a.sum)

  return {
    chart: { type: 'pie' },
    title: { text: '収入割合' },
    plotOptions: {
      pie: { shadow: false, center: ['50%', '50%'] },
      series: {
        point: {
          events: {
            click() {
              const point = this as unknown as Highcharts.Point
              const name = point.name
              emit('filterConditionChange', {
                condition: (x: Transaction) => x.middleCategory === name,
              })
            },
          },
        },
      },
    },
    tooltip: {
      formatter() {
        return `${this.key}<br>${Highcharts.numberFormat(this.y ?? 0, 0, '', ',')}円<br>(${(this.percentage ?? 0).toFixed(3)}%`
      },
    },
    legend: {
      labelFormatter() {
        const point = this as unknown as Highcharts.Point
        return `${point.name}<br/><span style="font-size:0.6rem">(${Highcharts.numberFormat(point.y ?? 0, 0, '', ',')}円)</span>`
      },
      enabled: true,
      align: 'right',
      layout: 'vertical',
      verticalAlign: 'top',
    },
    series: [
      {
        type: 'pie',
        name: 'サブカテゴリ',
        data: groups.map((x, index) => ({ name: x.middleCategory, legendIndex: index, y: x.sum })),
        size: '100%',
        showInLegend: true,
        dataLabels: { enabled: true },
      } as Highcharts.SeriesPieOptions,
    ],
  }
})
</script>

<template>
  <ChartBase :options="chartOptions" />
</template>
