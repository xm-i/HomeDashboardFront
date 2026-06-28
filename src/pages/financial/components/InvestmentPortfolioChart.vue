<script setup lang="ts">
import { computed } from 'vue'
import Highcharts from 'highcharts'
import ChartBase from '@/components/common/ChartBase.vue'
import type { InvestmentProduct } from '@/models/investment-product.model'
import type { InvestmentCurrencyUnit } from '@/models/investment-currency-unit.model'

/**
 * 投資ポートフォリオチャート（カテゴリ + 商品のサンバースト）。
 * Angular 版 `app-investment-portfolio-chart` を移植する。
 */
const props = defineProps<{
  /** 投資商品一覧 */
  investmentProductList: InvestmentProduct[]
  /** 通貨単位一覧 */
  investmentCurrencyUnitList: InvestmentCurrencyUnit[]
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

/** チャートオプション */
const chartOptions = computed<Highcharts.Options>(() => {
  const currencyList = props.investmentCurrencyUnitList
  // 評価額（円換算）を算出し、降順に並べる
  const temp = props.investmentProductList
    .filter((x) => x.amount !== 0)
    .map((x) => {
      const currency = currencyList.find((icu) => icu.id === x.currencyUnitId)
      return {
        category: x.category,
        name: x.name,
        value: x.amount * x.latestRate * (currency?.latestRate ?? 0),
      }
    })
    .sort((a, b) => b.value - a.value)

  const total = temp.reduce((s, x) => s + x.value, 0)
  const categoryNodes = [...groupBy(temp, (x) => x.category).entries()].map(([category, items]) => ({
    id: category,
    parent: 'root',
    name: category,
    value: items.reduce((s, x) => s + x.value, 0),
  }))
  const productNodes = temp.map((x) => ({
    id: x.name,
    parent: x.category,
    name: x.name,
    value: x.value,
  }))

  const data = [{ id: 'root', parent: '', name: 'ALL', value: total }, ...categoryNodes, ...productNodes]

  return {
    title: { text: undefined },
    plotOptions: { pie: { shadow: false, center: ['50%', '50%'] } },
    tooltip: {
      formatter: tooltipFormatter,
    },
    series: [
      {
        name: 'カテゴリ',
        type: 'sunburst',
        data,
        allowDrillToNode: true,
        cursor: 'pointer',
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
</script>

<template>
  <ChartBase :options="chartOptions" />
</template>
