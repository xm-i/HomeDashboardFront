<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import Highcharts from 'highcharts'
import { Chart } from 'highcharts-vue'
import { useResizeObserver } from '@vueuse/core'
import { defaultHighchartsOptions } from '@/lib/highcharts'

/**
 * Highcharts の共通ラッパー。
 * - `src/lib/highcharts.ts` の既定オプション（ダークテーマ）を自動でマージする。
 * - コンテナのリサイズを検知して `chart.reflow()` を呼ぶ（VueUse 利用）。
 * - リアルタイム追記用にチャートインスタンスを `chart` として expose する。
 */
const props = defineProps<{
  /** このチャート固有のオプション（既定オプションへ上書きマージされる） */
  options: Highcharts.Options
}>()

/** 生成されたチャートインスタンス（addPoint 等のリアルタイム操作に利用） */
const chartInstance = shallowRef<Highcharts.Chart | null>(null)

/** リサイズ検知用のコンテナ参照 */
const containerRef = ref<HTMLElement | null>(null)

/** 既定オプションと固有オプションをディープマージする（merge は新しいオブジェクトを返す） */
const mergedOptions = computed<Highcharts.Options>(() =>
  Highcharts.merge(defaultHighchartsOptions, props.options),
)

/** チャート生成後にインスタンスを保持する（Highcharts は this にチャートを束縛する） */
const onChartCreated: Highcharts.ChartCallbackFunction = function (this: Highcharts.Chart) {
  chartInstance.value = this
}

// コンテナのサイズ変化に追従して再描画する
useResizeObserver(containerRef, () => {
  chartInstance.value?.reflow()
})

defineExpose({ chart: chartInstance })
</script>

<template>
  <div ref="containerRef" class="h-full w-full">
    <Chart :options="mergedOptions" :callback="onChartCreated" :highcharts="Highcharts" />
  </div>
</template>
