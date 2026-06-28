<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import Highcharts from 'highcharts'
import ChartBase from '@/components/common/ChartBase.vue'
import { highChartsColors } from '@/lib/highcharts'
import type { ElectricPower } from '@/models/electric-power.model'

/**
 * 電力消費量の折れ線チャート。
 * Angular 版 `electric-power-chart` を ChartBase で再現する。
 * - 過去ページ: `data` プロパティ（ElectricPower[]）を渡すと系列を再構築する。
 * - Top ページ: 公開した `addPoint` を呼んでリアルタイムに点を追加する。
 */
const props = defineProps<{
  /** 描画対象の電力消費量リスト（過去ページ用。Top はリアルタイム追記のため未指定） */
  data?: ElectricPower[]
}>()

/** ChartBase インスタンス参照（リアルタイム addPoint 用にチャート本体へアクセスする） */
const chartBaseRef = ref<InstanceType<typeof ChartBase> | null>(null)

/** ツールチップ整形（Angular 版の formatter を踏襲: 日時 + 値 W） */
const tooltipFormatter: Highcharts.TooltipFormatterCallbackFunction = function () {
  const dateStr = this.series.chart.time.dateFormat('%Y/%m/%d %H:%M:%S', Number(this.x))
  return `<span style="font-size:10px">${dateStr}</span><br><span style="fill:${this.color}">●</span><span>${this.series.name} :</span> <span style="font-weight:bold">${this.y}</span> W`
}

/** チャートオプション（`data` の変化で系列データを再構築する） */
const chartOptions = computed<Highcharts.Options>(() => ({
  chart: { type: 'line' },
  title: { text: '電力消費量' },
  xAxis: { type: 'datetime' },
  tooltip: { formatter: tooltipFormatter },
  yAxis: [
    {
      labels: { format: '{value} W' },
      title: { text: '消費電力' },
      min: 0,
    },
  ],
  series: [
    {
      type: 'line',
      name: '消費電力',
      color: highChartsColors[0],
      data: (props.data ?? []).map((x) => [dayjs(x.timeStamp).valueOf(), x.electricPower]),
    },
  ],
}))

/**
 * リアルタイムに 1 点追加する（Top ページの SignalR 受信時に呼ぶ）。
 * @param power 受信した電力使用量
 */
function addPoint(power: ElectricPower): void {
  const chart = chartBaseRef.value?.chart
  chart?.series[0]?.addPoint([dayjs(power.timeStamp).valueOf(), power.electricPower], true, false)
}

defineExpose({ addPoint })
</script>

<template>
  <ChartBase ref="chartBaseRef" :options="chartOptions" />
</template>
