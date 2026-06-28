<script setup lang="ts">
import { computed } from 'vue'
import Highcharts from 'highcharts'
import dayjs from 'dayjs'
import ChartBase from '@/components/common/ChartBase.vue'
import type { Transaction } from '@/models/transaction.model'
import type { Condition } from '@/models/condition.model'

/**
 * 収入推移チャート（中カテゴリ別の積み上げ縦棒）。
 * Angular 版 `app-income-transition-chart` を移植する。
 * - 棒クリックで「年月 + 中カテゴリ」の絞り込み条件を親へ通知する。
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

/** y 軸ラベル整形（0円 / 万円 表記） */
const yAxisLabelFormatter: Highcharts.AxisLabelsFormatterCallbackFunction = function () {
  const value = Number(this.value)
  if (value === 0) {
    return `${value}円`
  } else if (Math.abs(value) >= 100000000) {
    return `${value / 100000000} 万円`
  } else {
    return `${value / 10000} 万円`
  }
}

/** チャートオプション（transactions に依存） */
const chartOptions = computed<Highcharts.Options>(() => {
  // 収入（amount>0）を月単位に整形
  const temp = props.transactions
    .filter((x) => x.amount > 0)
    .map((x) => ({ ...x, date: dayjs(x.date).format('YYYY-MM') }))
  const months = [...new Set(temp.map((x) => x.date))]

  const series = [...groupBy(temp, (x) => x.middleCategory).entries()]
    .map(([middleCategory, items]) => ({ middleCategory, items }))
    .sort((a, b) => b.items.reduce((s, x) => s + x.amount, 0) - a.items.reduce((s, x) => s + x.amount, 0))
    .map(({ middleCategory, items }, index) => {
      const byMonth = groupBy(items, (x) => x.date)
      return {
        type: 'column',
        name: middleCategory,
        legendIndex: index,
        data: months.map((month) => {
          const monthItems = byMonth.get(month)
          const value = monthItems ? monthItems.reduce((s, x) => s + x.amount, 0) : null
          return [dayjs(`${month}-01`).add(9, 'hour').valueOf(), value]
        }),
      } as Highcharts.SeriesColumnOptions
    })

  return {
    chart: { type: 'column', zooming: { type: 'x' } },
    title: { text: '収入推移' },
    xAxis: { type: 'datetime', title: undefined, dateTimeLabelFormats: { month: '%Y/%m' } },
    yAxis: {
      title: undefined,
      stackLabels: {
        enabled: true,
        formatter() {
          return `${Highcharts.numberFormat(this.total, 0, '', ',')}円`
        },
      },
      labels: { formatter: yAxisLabelFormatter },
    },
    legend: {
      labelFormatter() {
        const sum = ((this as unknown as { yData: number[] }).yData ?? []).reduce(
          (s, v) => s + (v ?? 0),
          0,
        )
        return `${this.name}<br/><span style="font-size:0.6rem">(${Highcharts.numberFormat(sum, 0, '', ',')}円)</span>`
      },
    },
    plotOptions: {
      column: { stacking: 'normal', dataLabels: { enabled: false } },
      series: {
        point: {
          events: {
            click() {
              const point = this as unknown as Highcharts.Point
              const month = dayjs(Number(point.category)).format('YYYY-MM')
              const seriesName = point.series.name
              emit('filterConditionChange', {
                condition: (x: Transaction) =>
                  x.date.startsWith(month) && x.middleCategory === seriesName,
              })
            },
          },
        },
      },
    },
    tooltip: {
      formatter() {
        return `${dayjs(Number(this.x)).format('YYYY年MM月')}<br>${this.series.name} : ${Highcharts.numberFormat(this.y ?? 0, 0, '', ',')}円`
      },
    },
    series,
  }
})
</script>

<template>
  <ChartBase :options="chartOptions" />
</template>
