<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Highcharts from 'highcharts'
import ChartBase from '@/components/common/ChartBase.vue'
import { highChartsColors } from '@/lib/highcharts'
import { financialApi } from '@/services/financial'
import type { Asset } from '@/models/asset.model'
import type { DateRange } from '@/models/date-range.model'

/**
 * 資産割合チャート（カテゴリ + 金融機関の二層ドーナツ）。
 * Angular 版 `app-asset-ratio-chart` を移植する。
 */
const props = defineProps<{
  /** 表示対象の日付範囲 */
  dateRange?: DateRange | null
}>()

/** 取得した最新資産生データ */
const assets = ref<Asset[]>([])

/** 指定範囲の最新資産を取得する */
async function reload(range: DateRange): Promise<void> {
  try {
    assets.value =
      (await financialApi.getLatestAsset(
        range.startDate.format('YYYY-MM-DD'),
        range.endDate.format('YYYY-MM-DD'),
      )) ?? []
  } catch (err: unknown) {
    console.error('資産割合の取得に失敗しました', err)
  }
}

watch(
  () => props.dateRange,
  (range) => {
    if (range) {
      void reload(range)
    }
  },
  { immediate: true, deep: true },
)

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

/** ツールチップ整形（カテゴリ名 + 金額 + 割合） */
const tooltipFormatter: Highcharts.TooltipFormatterCallbackFunction = function () {
  return `${this.key}<br>${Highcharts.numberFormat(this.y ?? 0, 0, '', ',')}円<br>(${(this.percentage ?? 0).toFixed(3)}%`
}

/** チャートオプション */
const chartOptions = computed<Highcharts.Options>(() => {
  // amount>0 のみ、カテゴリ単位で合計昇順
  const positive = assets.value.filter((x) => x.amount > 0)
  const categoryGroups = [...groupBy(positive, (x) => x.category).entries()]
    .map(([category, items]) => ({ category, items }))
    .sort(
      (a, b) =>
        a.items.reduce((s, x) => s + x.amount, 0) - b.items.reduce((s, x) => s + x.amount, 0),
    )

  // 内側: カテゴリ
  const categoryData = categoryGroups.map(({ category, items }, index) => ({
    name: category,
    y: items.reduce((s, x) => s + x.amount, 0),
    color: highChartsColors[index],
  }))

  // 外側: 金融機関（カテゴリ色を明度調整）
  const institutionData = categoryGroups.flatMap(({ items }, index) => {
    const institutionGroups = [...groupBy(items, (x) => x.institution).entries()]
    return institutionGroups.map(([institution, insItems], index2) => ({
      name: institution,
      y: insItems.reduce((s, x) => s + x.amount, 0),
      color: Highcharts.color(highChartsColors[index])
        .brighten(0.2 - index2 / institutionGroups.length / 5)
        .get(),
    }))
  })

  return {
    chart: { type: 'pie' },
    title: { text: '資産割合' },
    plotOptions: { pie: { shadow: false, center: ['50%', '50%'] } },
    tooltip: { formatter: tooltipFormatter },
    series: [
      {
        type: 'pie',
        name: 'カテゴリ',
        animation: { duration: 200 },
        data: categoryData,
        size: '60%',
      } as Highcharts.SeriesPieOptions,
      {
        type: 'pie',
        name: '金融機関',
        animation: { duration: 200 },
        data: institutionData,
        size: '100%',
        innerSize: '60%',
        id: 'institutions',
      } as Highcharts.SeriesPieOptions,
    ],
    responsive: {
      rules: [
        {
          chartOptions: {
            series: [
              {},
              { id: 'institutions', dataLabels: { enabled: false } },
            ] as unknown as Highcharts.SeriesOptionsType[],
          },
          condition: {},
        },
      ],
    },
  }
})
</script>

<template>
  <ChartBase :options="chartOptions" />
</template>
