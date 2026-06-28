<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import Highcharts from 'highcharts'
import ChartBase from '@/components/common/ChartBase.vue'
import { aquariumApi } from '@/services/aquarium'
import { defaultHighchartsOptions, highChartsColors } from '@/lib/highcharts'
import type { DateRange } from '@/models/date-range.model'
import type { WaterState } from '@/models/water-state.model'

/**
 * 水質状態（気温・水温・湿度）の箱ひげ図 + 中央値ラインチャート。
 * Angular 版 `water-states` を ChartBase + highcharts-more（boxplot）で再現する。
 */
const props = defineProps<{
  /** 表示対象の日付範囲 */
  dateRange: DateRange | null
  /** 集計間隔（秒） */
  period: number | null
}>()

/** チャートオプション（未生成・データ0件のときは null） */
const chartOptions = ref<Highcharts.Options | null>(null)

/** 状態メッセージ（取得失敗・データ0件など） */
const message = ref<string | null>(null)

/** boxplot 用 5 数要約タプル */
type BoxValues = [number, number, number, number, number]

/**
 * 日付スロット（minTime から period 秒刻み）に整列したデータ配列を生成する。
 * 該当する WaterState が無いスロットは null を入れる（Angular 版 groupJoin 相当）。
 */
function buildSeriesData<T>(
  list: WaterState[],
  period: number,
  selector: (ws: WaterState) => T,
): (T | null)[] {
  const map = new Map<string, WaterState>()
  for (const ws of list) {
    map.set(ws.time, ws)
  }
  const times = list.map((x) => x.time)
  const minTime = times.reduce((a, b) => (a < b ? a : b))
  const maxTime = times.reduce((a, b) => (a > b ? a : b))
  const minMs = dayjs(minTime).valueOf()
  const maxMs = dayjs(maxTime).valueOf()
  const count = Math.floor((maxMs - minMs) / (period * 1000)) + 1
  const result: (T | null)[] = []
  for (let i = 0; i < count; i++) {
    const slot = dayjs(minTime)
      .add(i * period, 'second')
      .format('YYYY-MM-DD HH:mm:ss')
    const ws = map.get(slot)
    result.push(ws ? selector(ws) : null)
  }
  return result
}

/** 取得済みリストからチャートオプションを構築する */
function buildOptions(list: WaterState[], period: number): Highcharts.Options {
  // 系列の起点（JST 補正の +9h は Angular 版を踏襲）
  const pointStart = dayjs(list[0].time).add(9, 'hour').valueOf()
  const pointInterval = period * 1000

  const humidityBox = (ws: WaterState): BoxValues => [
    ws.minHumidity,
    ws.lowerQuartileHumidity,
    ws.medianHumidity,
    ws.upperQuartileHumidity,
    ws.maxHumidity,
  ]
  const temperatureBox = (ws: WaterState): BoxValues => [
    ws.minTemperature,
    ws.lowerQuartileTemperature,
    ws.medianTemperature,
    ws.upperQuartileTemperature,
    ws.maxTemperature,
  ]
  const waterTemperatureBox = (ws: WaterState): BoxValues => [
    ws.minWaterTemperature,
    ws.lowerQuartileWaterTemperature,
    ws.medianWaterTemperature,
    ws.upperQuartileWaterTemperature,
    ws.maxWaterTemperature,
  ]

  return {
    chart: {
      type: 'boxplot',
      zooming: { type: 'xy' },
    },
    title: { text: '気温・水温・湿度' },
    tooltip: { valueDecimals: 3 },
    xAxis: {
      type: 'datetime',
      title: undefined,
      dateTimeLabelFormats: {
        year: '%Y',
        month: '%Y/%m',
        week: '%m/%d',
        day: '%m/%d',
      },
    },
    yAxis: [
      {
        ...(defaultHighchartsOptions.yAxis as Highcharts.YAxisOptions),
        labels: { format: '{value}°C', style: { color: '#E0E0E3' } },
        title: { text: '気温・水温', style: { color: '#A0A0A3' } },
        plotBands: [
          { from: 29, to: 30, color: '#ff7f5015' },
          { from: 30, to: 10000, color: '#ff000015' },
          { from: 25, to: 15, color: '#87cefa15' },
          { from: 15, to: -100000, color: '#1e90ff15' },
        ],
      },
      {
        ...(defaultHighchartsOptions.yAxis as Highcharts.YAxisOptions),
        title: { text: '湿度', style: { color: '#A0A0A3' } },
        labels: { format: '{value} %', style: { color: '#E0E0E3' } },
        opposite: true,
      },
    ],
    series: [
      {
        type: 'boxplot',
        name: '湿度',
        yAxis: 1,
        pointInterval,
        pointStart,
        // null はギャップ点として扱われる（型上は許容されないためキャスト）
        data: buildSeriesData(list, period, humidityBox) as Highcharts.SeriesBoxplotOptions['data'],
        color: highChartsColors[0],
      },
      {
        type: 'boxplot',
        name: '気温',
        pointInterval,
        pointStart,
        data: buildSeriesData(list, period, temperatureBox) as Highcharts.SeriesBoxplotOptions['data'],
        color: highChartsColors[3],
      },
      {
        type: 'boxplot',
        name: '水温',
        pointInterval,
        pointStart,
        data: buildSeriesData(list, period, waterTemperatureBox) as Highcharts.SeriesBoxplotOptions['data'],
        color: highChartsColors[2],
      },
      {
        type: 'line',
        name: '湿度',
        yAxis: 1,
        pointInterval,
        pointStart,
        data: buildSeriesData(list, period, (ws) => ws.medianHumidity),
        color: highChartsColors[0],
      },
      {
        type: 'line',
        name: '気温',
        pointInterval,
        pointStart,
        data: buildSeriesData(list, period, (ws) => ws.medianTemperature),
        color: highChartsColors[3],
      },
      {
        type: 'line',
        name: '水温',
        pointInterval,
        pointStart,
        data: buildSeriesData(list, period, (ws) => ws.medianWaterTemperature),
        color: highChartsColors[2],
      },
    ],
  }
}

/** dateRange / period が揃ったらデータを取得してチャートを再構築する */
async function reload(): Promise<void> {
  const { dateRange, period } = props
  if (!dateRange || !period) {
    return
  }
  message.value = null
  let list: WaterState[]
  try {
    list = await aquariumApi.getWaterStateList(
      dateRange.startDate.format('YYYY-MM-DD HH:mm:ss'),
      dateRange.endDate.format('YYYY-MM-DD HH:mm:ss'),
      period,
    )
  } catch {
    message.value = 'データ取得失敗'
    return
  }
  if (!list || list.length === 0) {
    chartOptions.value = null
    message.value = '期間内のデータ件数が0件でした。グラフを生成出来ません。'
    return
  }
  chartOptions.value = buildOptions(list, period)
}

watch(
  () => [props.dateRange, props.period] as const,
  () => {
    void reload()
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <div class="h-full w-full">
    <ChartBase v-if="chartOptions" :options="chartOptions" />
    <p v-else class="p-4 text-sm text-muted-foreground">
      {{ message ?? '期間と間隔を選択してください。' }}
    </p>
  </div>
</template>
