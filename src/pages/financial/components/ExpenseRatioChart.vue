<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Highcharts from 'highcharts'
import ChartBase from '@/components/common/ChartBase.vue'
import { getHighChartsColor } from '@/lib/highcharts'
import { getMfTransactionLargeCategoryId } from '../utils/util'
import { TransactionCondition } from '@/models/condition.model'
import type { Transaction } from '@/models/transaction.model'

/**
 * 支出割合チャート（サンバースト）。
 * Angular 版 `app-expense-ratio-chart` を移植する。
 * - チャートは「年月 / 大カテゴリ群」フィルターの変化でのみ再構築する。
 * - 大カテゴリ・中カテゴリのドリル（setRootNode）はチャートを再構築せずに行う。
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

/** ChartBase インスタンス参照（setRootNode 呼び出し用） */
const chartBaseRef = ref<InstanceType<typeof ChartBase> | null>(null)

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

/** サンバーストの現在ルートノードの値を取得する */
function sunburstParentValue(point: Highcharts.Point): number {
  const series = point.series as unknown as { rootNode: string; points: Highcharts.Point[] }
  const rootNode = series.rootNode || 'root'
  const parent = series.points.find(
    (x) => (x as unknown as { id: string }).id === rootNode,
  ) as unknown as { value: number } | undefined
  return parent?.value ?? 0
}

/** ツールチップのフォーマッタ */
function tooltipFormatter(this: Highcharts.TooltipFormatterContextObject): string {
  const point = this.point as Highcharts.Point
  const value = (point as unknown as { value: number }).value
  return `${this.key}<br>${Highcharts.numberFormat(value, 0, '', ',')}円<br>(${Highcharts.numberFormat((value / sunburstParentValue(point)) * 100, 2, '.', ',')}%)`
}

/** データラベルのフォーマッタ */
function dataLabelFormatter(this: Highcharts.PointLabelObject): string {
  const point = this.point as Highcharts.Point
  const value = (point as unknown as { value: number }).value
  return `${this.key}<br>${Highcharts.numberFormat((value / sunburstParentValue(point)) * 100, 2, '.', ',')}%`
}

/** サンバーストのクリックハンドラ */
const onSunburstClick: Highcharts.SeriesClickCallbackFunction = function (event) {
  const fc = new TransactionCondition()
  fc.month = props.filterCondition.month
  fc.largeCategories = props.filterCondition.largeCategories
  const opt = event.point.options as unknown as { id?: string; parent?: string }
  if (opt.id === 'root') {
    // ルートクリックは何もしない
  } else if (opt.parent === 'root') {
    fc.largeCategory = event.point.name
  } else {
    fc.largeCategory = props.filterCondition.largeCategory
    fc.middleCategory = event.point.name
  }
  emit('update:filterCondition', fc)
}

/**
 * チャートオプション。
 * 依存は transactions / month / largeCategories のみ（Angular の再構築条件に対応）。
 */
const chartOptions = computed<Highcharts.Options>(() => {
  const month = props.filterCondition.month
  const largeCategories = props.filterCondition.largeCategories
  const temp = props.transactions
    .filter((x) => (month === null ? true : x.date.startsWith(month)))
    .filter((x) =>
      largeCategories.length === 0 ? true : largeCategories.some((c) => c === x.largeCategory),
    )
    .filter((x) => -x.amount > 0)

  const total = temp.reduce((s, x) => s + -x.amount, 0)

  // 大カテゴリ階層（金額降順）
  const largeNodes = [...groupBy(temp, (x) => x.largeCategory).entries()]
    .map(([largeCategory, items]) => ({
      id: largeCategory,
      parent: 'root',
      color: getHighChartsColor(getMfTransactionLargeCategoryId(largeCategory)),
      name: largeCategory,
      value: items.reduce((s, x) => s + -x.amount, 0),
    }))
    .sort((a, b) => b.value - a.value)

  // 中カテゴリ階層
  const middleNodes = [...groupBy(temp, (x) => `${x.largeCategory}_${x.middleCategory}`).entries()].map(
    ([, items]) => ({
      id: `${items[0].largeCategory}_${items[0].middleCategory}`,
      parent: items[0].largeCategory,
      name: items[0].middleCategory,
      value: items.reduce((s, x) => s + -x.amount, 0),
    }),
  )

  const data = [
    { id: 'root', parent: '', name: 'ALL', value: total },
    ...largeNodes,
    ...middleNodes,
  ]

  return {
    title: { text: '支出割合' },
    plotOptions: { pie: { shadow: false, center: ['50%', '50%'] } },
    tooltip: {
      formatter: tooltipFormatter,
    },
    series: [
      {
        name: 'カテゴリ',
        type: 'sunburst',
        animation: { duration: 200 },
        data,
        allowDrillToNode: true,
        cursor: 'pointer',
        events: {
          click: onSunburstClick,
        },
        dataLabels: {
          formatter: dataLabelFormatter,
          filter: { property: 'innerArcLength', operator: '>', value: 16 },
        },
        levels: [
          {
            level: 1,
            levelIsConstant: false,
            dataLabels: { filter: { property: 'outerArcLength' } },
          },
          { level: 2, colorByPoint: true },
          { level: 3, colorVariation: { key: 'brightness', to: 0.3 } },
        ],
      } as unknown as Highcharts.SeriesSunburstOptions,
    ],
  }
})

// 大カテゴリ・中カテゴリの変化に応じてドリル（setRootNode）する
watch(
  () => props.filterCondition,
  (cond, prev) => {
    if (!prev) {
      return
    }
    if (
      prev.month === cond.month &&
      prev.largeCategories === cond.largeCategories &&
      prev.largeCategory === cond.largeCategory &&
      prev.middleCategory === cond.middleCategory
    ) {
      return
    }
    const chart = chartBaseRef.value?.chart
    if (!chart) {
      return
    }
    const series = chart.series[0] as unknown as { setRootNode: (id: string) => void }
    // 同じ大カテゴリのまま中カテゴリが解除された場合は一段戻す
    if (prev.largeCategory === cond.largeCategory && cond.middleCategory === null) {
      const fc = new TransactionCondition()
      fc.month = props.filterCondition.month
      fc.largeCategories = props.filterCondition.largeCategories
      emit('update:filterCondition', fc)
      return
    }
    series.setRootNode(cond.largeCategory !== null ? cond.largeCategory : 'root')
  },
  { deep: true },
)
</script>

<template>
  <ChartBase ref="chartBaseRef" :options="chartOptions" />
</template>
