<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Highcharts from 'highcharts'
import dayjs from 'dayjs'
import ChartBase from '@/components/common/ChartBase.vue'
import { financialApi } from '@/services/financial'
import type { Asset } from '@/models/asset.model'
import type { DateRange } from '@/models/date-range.model'

/**
 * 資産推移チャート（積み上げエリア + 合計ライン）。
 * Angular 版 `app-asset-transition-chart` を移植する。
 * linq の groupBy/orderBy/groupJoin はネイティブ配列処理に置き換える。
 */
const props = defineProps<{
  /** 表示対象の日付範囲 */
  dateRange?: DateRange | null
}>()

/** 取得した資産推移生データ（日付を "YYYY-MM-DD" に整形済み） */
const assets = ref<{ date: string; institution: string; category: string; amount: number }[]>([])

/** 指定範囲の資産を取得する */
async function reload(range: DateRange): Promise<void> {
  try {
    const list = await financialApi.getAssets(
      range.startDate.format('YYYY-MM-DD'),
      range.endDate.format('YYYY-MM-DD'),
    )
    assets.value = (list ?? []).map((x: Asset) => ({
      ...x,
      date: dayjs(x.date).format('YYYY-MM-DD'),
    }))
  } catch (err: unknown) {
    console.error('資産推移の取得に失敗しました', err)
  }
}

// 日付範囲の変更で再取得する
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

/** y 軸ラベル整形（0円 / 万円 表記。Angular の formatter を踏襲） */
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

/** ツールチップ整形（日付 + 系列名 + 金額） */
const tooltipFormatter: Highcharts.TooltipFormatterCallbackFunction = function () {
  return `${Highcharts.dateFormat('%Y/%m/%d', Number(this.key))}<br>${this.series.name} : ${Highcharts.numberFormat(this.y ?? 0, 0, '', ',')}円`
}

/** 凡例ラベル整形（最終値を併記） */
const legendLabelFormatter: Highcharts.FormatterCallbackFunction<
  Highcharts.Point | Highcharts.Series
> = function () {
  const values = (this as unknown as { yData: number[] }).yData
  const lastValue = values[values.length - 1]
  if (lastValue != null && lastValue !== 0) {
    return `${this.name}<br/><span style="font-size:0.6rem">(${Highcharts.numberFormat(lastValue, 0, '', ',')}円)</span>`
  }
  return `${this.name}<br/><span style="font-size:0.6rem">( - )</span>`
}

/** チャートオプション */
const chartOptions = computed<Highcharts.Options>(() => {
  const data = assets.value
  // 出現順の日付一覧
  const dates = [...new Set(data.map((x) => x.date))]
  const datesCount = dates.length
  const oneDay = 24 * 3600 * 1000
  const pointStart = dayjs(dates[0]).add(9, 'hour').valueOf()

  // 金融機関ごとに系列化（最終金額の絶対値で昇順）
  const institutionGroups = groupBy(data, (x) => x.institution)
  const institutionSeries = [...institutionGroups.entries()]
    .map(([institution, items]) => ({ institution, items }))
    .sort((a, b) => {
      const aLast = a.items[a.items.length - 1].amount
      const bLast = b.items[b.items.length - 1].amount
      return Math.abs(aLast) - Math.abs(bLast)
    })
    .map(({ institution, items }, index) => {
      const sumAmount = items.reduce((acc, x) => acc + x.amount, 0)
      // 日付ごとの合計を引く
      const byDate = groupBy(items, (x) => x.date)
      const seriesData = dates.map((d) => {
        const dayItems = byDate.get(d)
        return dayItems ? dayItems.reduce((acc, x) => acc + x.amount, 0) : null
      })
      return {
        type: 'area',
        animation: { duration: 200 },
        name: institution,
        pointInterval: oneDay,
        pointStart,
        stack: sumAmount > 0 ? 0 : 1,
        legendIndex: -index,
        data: seriesData,
      } as Highcharts.SeriesAreaOptions
    })

  // 合計ライン（日付昇順）
  const totalByDate = [...groupBy(data, (x) => x.date).entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([, items]) => items.reduce((acc, x) => acc + x.amount, 0))
  const totalData = totalByDate.map((value, index) =>
    index !== datesCount - 1
      ? value
      : { y: value, dataLabels: { enabled: true, align: 'right' as const } },
  )

  const series: Highcharts.SeriesOptionsType[] = [
    ...institutionSeries,
    {
      type: 'line',
      name: '計',
      zIndex: 10000,
      pointInterval: oneDay,
      pointStart,
      legendIndex: -1000000,
      data: totalData,
    } as Highcharts.SeriesLineOptions,
  ]

  return {
    chart: { type: 'area', zooming: { type: 'x' } },
    title: { text: '資産推移' },
    xAxis: {
      type: 'datetime',
      title: undefined,
      dateTimeLabelFormats: { year: '%Y', month: '%Y/%m', week: '%m/%d', day: '%m/%d' },
    },
    yAxis: { title: undefined, labels: { formatter: yAxisLabelFormatter } },
    tooltip: { formatter: tooltipFormatter },
    plotOptions: {
      series: {
        dataLabels: {
          shape: 'callout',
          backgroundColor: '#0007',
          formatter() {
            return `最終値:${Highcharts.numberFormat(this.y ?? 0, 0, '', ',')}円`
          },
        },
      },
    },
    legend: { labelFormatter: legendLabelFormatter },
    series,
  }
})
</script>

<template>
  <ChartBase :options="chartOptions" />
</template>
