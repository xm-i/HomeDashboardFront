<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Highcharts from 'highcharts'
import dayjs from 'dayjs'
import ChartBase from '@/components/common/ChartBase.vue'
import { financialApi } from '@/services/financial'
import type { InvestmentAsset } from '@/models/investment-asset.model'

/**
 * 投資資産推移チャート（積み上げエリア + 合計ライン）。
 * Angular 版 `app-investment-asset-transition-chart` を移植する。
 * - 初期表示時に 2020-11-01〜現在の投資資産を取得する。
 * - 表示種別（全部/利益のみ/元本のみ）と単位（日/月/年）を切り替えられる。
 */

/** 表示種別 */
const chartTypes = [
  { label: '全部', value: 'all' },
  { label: '利益のみ', value: 'profit' },
  { label: '元本のみ', value: 'principal' },
] as const

/** 表示単位 */
const chartUnits = [
  { label: '日', value: 'day' },
  { label: '月', value: 'month' },
  { label: '年', value: 'year' },
] as const

/** 取得した投資資産生データ */
const assets = ref<InvestmentAsset | null>(null)
/** 選択中の表示種別インデックス */
const selectedTypeIndex = ref(0)
/** 選択中の表示単位インデックス */
const selectedUnitIndex = ref(0)

// 初期表示で固定範囲（2020-11-01〜現在）の投資資産を取得する
onMounted(async () => {
  try {
    assets.value =
      (await financialApi.getInvestmentAssets('2020-11-01', dayjs().format('YYYY-MM-DD'))) ?? null
  } catch (err: unknown) {
    console.error('投資資産の取得に失敗しました', err)
  }
})

/** 単位に応じて対象日付かどうかを判定する（月=1日, 年=1月1日） */
function isTargetDate(date: string, unit: string): boolean {
  const d = dayjs(date)
  if (unit === 'day') {
    return true
  }
  if (unit === 'month') {
    return d.date() === 1
  }
  // year
  return d.month() === 0 && d.date() === 1
}

/** 系列を構築する（Angular の getChartSeries 相当） */
function buildSeries(): Highcharts.SeriesOptionsType[] {
  const data = assets.value
  if (data === null) {
    return []
  }
  const typeValue = chartTypes[selectedTypeIndex.value].value
  const unitValue = chartUnits[selectedUnitIndex.value].value
  const products = data.investmentAssetProducts
  const firstRates = products[0]?.dailyRates ?? []

  // 対象日付一覧
  const dates = firstRates.filter((x) => isTargetDate(x.date, unitValue)).map((x) => x.date)

  /** 種別に応じたレート係数を返す */
  const rateOf = (r: { rate: number; averageRate: number }): number =>
    typeValue === 'all' ? r.rate : typeValue === 'principal' ? r.averageRate : r.rate - r.averageRate

  // 商品ごとの系列（最終評価額の昇順）
  const productSeries = [...products]
    .map((x) => {
      const latest = x.dailyRates[firstRates.length - 1]
      const order = latest ? latest.amount * latest.rate * latest.currencyRate : 0
      return { product: x, order }
    })
    .sort((a, b) => a.order - b.order)
    .map(({ product }, index) => {
      // 日単位以外は個別系列を空にする（Angular 仕様）
      if (selectedUnitIndex.value !== 0) {
        return { data: [] } as unknown as Highcharts.SeriesAreaOptions
      }
      // rate が 0 の先頭を読み飛ばし、対象日付のみ採用
      let started = false
      const seriesData = product.dailyRates
        .filter((r) => {
          if (!started && r.rate === 0) {
            return false
          }
          started = true
          return true
        })
        .filter((r) => dates.includes(r.date))
        .map((r) => r.amount * rateOf(r) * r.currencyRate)
      const firstValid =
        product.dailyRates.find((r) => dates.includes(r.date) && r.rate !== 0)?.date ?? dates[0]
      return {
        type: 'area',
        name: product.name,
        pointInterval: 1,
        pointIntervalUnit: unitValue,
        pointStart: dayjs(firstValid).add(9, 'hour').valueOf(),
        legendIndex: -index,
        stack: seriesData.reduce((s, v) => s + v, 0) > 0 ? 0 : 1,
        data: seriesData,
      } as Highcharts.SeriesAreaOptions
    })

  // 合計ライン
  const totalData = dates
    .map((date) =>
      products.reduce((sum, x) => {
        const rate = x.dailyRates.find((dr) => dr.date === date)
        if (!rate) {
          return sum
        }
        return sum + rateOf(rate) * rate.amount * rate.currencyRate
      }, 0),
    )
    .map((value, index) =>
      index !== dates.length - 1
        ? value
        : { y: value, dataLabels: { enabled: true, align: 'right' as const } },
    )

  return [
    ...productSeries,
    {
      type: 'line',
      name: '計',
      zIndex: 10000,
      pointInterval: 1,
      pointIntervalUnit: unitValue,
      pointStart: dayjs(dates[0]).add(9, 'hour').valueOf(),
      legendIndex: -1000000,
      data: totalData,
    } as Highcharts.SeriesLineOptions,
  ]
}

/** y 軸ラベル整形（0円 / 億円 / 万円 表記） */
const yAxisLabelFormatter: Highcharts.AxisLabelsFormatterCallbackFunction = function () {
  const value = Number(this.value)
  if (value === 0) {
    return `${value}円`
  } else if (Math.abs(value) >= 100000000) {
    return `${value / 100000000} 億円`
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

/** チャートオプション（assets と選択インデックスに依存） */
const chartOptions = computed<Highcharts.Options>(() => ({
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
        x: -40,
        y: -40,
        formatter() {
          return `最終値:${Highcharts.numberFormat(this.y ?? 0, 0, '', ',')}円`
        },
      },
    },
  },
  legend: { labelFormatter: legendLabelFormatter },
  series: buildSeries(),
}))
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-2 flex flex-wrap gap-3">
      <div class="inline-flex overflow-hidden rounded-md border border-border">
        <button
          v-for="(t, index) in chartTypes"
          :key="t.value"
          type="button"
          class="px-3 py-1 text-sm"
          :class="
            selectedTypeIndex === index
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-foreground'
          "
          @click="selectedTypeIndex = index"
        >
          {{ t.label }}
        </button>
      </div>
      <div class="inline-flex overflow-hidden rounded-md border border-border">
        <button
          v-for="(u, index) in chartUnits"
          :key="u.value"
          type="button"
          class="px-3 py-1 text-sm"
          :class="
            selectedUnitIndex === index
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-foreground'
          "
          @click="selectedUnitIndex = index"
        >
          {{ u.label }}
        </button>
      </div>
    </div>
    <div class="min-h-0 flex-1">
      <ChartBase :options="chartOptions" />
    </div>
  </div>
</template>
