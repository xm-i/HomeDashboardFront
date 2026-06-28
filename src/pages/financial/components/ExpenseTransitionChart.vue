<script setup lang="ts">
import { computed } from 'vue'
import Highcharts from 'highcharts'
import dayjs from 'dayjs'
import ChartBase from '@/components/common/ChartBase.vue'
import { getHighChartsColor } from '@/lib/highcharts'
import { getMfTransactionLargeCategoryId } from '../utils/util'
import { TransactionCondition } from '@/models/condition.model'
import type { Transaction } from '@/models/transaction.model'

/**
 * 支出推移チャート（大カテゴリ別の積み上げ縦棒）。
 * Angular 版 `app-expense-transition-chart` を移植する。
 * - 棒・凡例・背景クリックでフィルター条件を更新し、親へ通知する。
 * - チャート自体は transactions の変化でのみ再構築する（filterCondition では再構築しない）。
 */
const props = defineProps<{
  /** 取引履歴生データ */
  transactions: Transaction[]
  /** フィルター条件（双方向） */
  filterCondition: TransactionCondition
}>()

const emit = defineEmits<{
  /** フィルター条件の更新を通知する */
  (e: 'update:filterCondition', value: TransactionCondition): void
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

/** チャートオプション（transactions のみに依存） */
const chartOptions = computed<Highcharts.Options>(() => {
  // 支出（amount<0）を正の値へ反転、月単位に整形
  const temp = props.transactions
    .filter((x) => x.amount < 0)
    .map((x) => ({ ...x, amount: -x.amount, date: dayjs(x.date).format('YYYY-MM') }))
  const months = [...new Set(temp.map((x) => x.date))]

  const series = [...groupBy(temp, (x) => x.largeCategory).entries()]
    .map(([largeCategory, items]) => ({ largeCategory, items }))
    .sort(
      (a, b) =>
        a.items.reduce((s, x) => s + Math.abs(x.amount), 0) -
        b.items.reduce((s, x) => s + Math.abs(x.amount), 0),
    )
    .map(({ largeCategory, items }, index) => {
      const byMonth = groupBy(items, (x) => x.date)
      return {
        type: 'column',
        animation: { duration: 200 },
        color: getHighChartsColor(getMfTransactionLargeCategoryId(largeCategory)),
        name: largeCategory,
        legendIndex: -index,
        data: months.map((month) => {
          const monthItems = byMonth.get(month)
          const value = monthItems ? monthItems.reduce((s, x) => s + x.amount, 0) : null
          return [dayjs(`${month}-01`).add(9, 'hour').valueOf(), value]
        }),
      } as Highcharts.SeriesColumnOptions
    })

  return {
    chart: {
      type: 'column',
      zooming: { type: 'x' },
      events: {
        // 背景クリックでカテゴリ選択を解除する（largeCategories は維持）
        click() {
          const fc = new TransactionCondition()
          fc.largeCategories = props.filterCondition.largeCategories
          emit('update:filterCondition', fc)
        },
      },
    },
    title: { text: '支出推移' },
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
            // 棒クリックで「年月 + 大カテゴリ」を選択する
            click() {
              const point = this as unknown as Highcharts.Point
              const month = dayjs(Number(point.category)).format('YYYY-MM')
              const fc = new TransactionCondition()
              fc.month = month
              fc.largeCategories = props.filterCondition.largeCategories
              fc.largeCategory = point.series.name
              emit('update:filterCondition', fc)
            },
          },
        },
        events: {
          // 凡例クリックで表示中の大カテゴリ群を再計算する
          legendItemClick() {
            const target = this as unknown as Highcharts.Series
            const allItems = target.chart.legend.allItems as unknown as Highcharts.Series[]
            const fc = new TransactionCondition()
            fc.month = props.filterCondition.month
            fc.largeCategories = allItems
              .filter((x) => (target.name === x.name ? !x.visible : x.visible))
              .map((x) => x.name)
            fc.largeCategory = props.filterCondition.largeCategory
            fc.middleCategory = props.filterCondition.middleCategory
            emit('update:filterCondition', fc)
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
