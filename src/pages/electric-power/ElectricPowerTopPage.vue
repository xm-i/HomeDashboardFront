<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { useSignalR } from '@/composables/useSignalR'
import { env } from '@/config/env'
import ElectricPowerChart from './components/ElectricPowerChart.vue'

/**
 * 電力（Top）ページ。
 * SignalR（electric-power-received）で受信した最新値を表示し、
 * チャートへリアルタイムに点を追加する。
 * Angular 版 `electric-power-top` を移植。
 */

/** 受信した最新の計測時刻 */
const currentTime = ref<string>('')
/** 受信した最新の消費電力（W）。未受信時は NaN。 */
const currentValue = ref<number>(NaN)
/** チャートコンポーネント参照（addPoint 呼び出し用） */
const chartRef = ref<InstanceType<typeof ElectricPowerChart> | null>(null)

// 消費電力の表示（3 桁区切り。Angular の number パイプ相当） */
const formattedValue = computed<string>(() =>
  Number.isNaN(currentValue.value) ? '' : currentValue.value.toLocaleString(),
)

// 1 時間あたりの電気料金（円）。kwhPrice * W / 1000、小数 3 桁固定。
const formattedPrice = computed<string>(() =>
  Number.isNaN(currentValue.value)
    ? ''
    : ((env.kwhPrice * currentValue.value) / 1000).toLocaleString(undefined, {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      }),
)

// SignalR の電力受信を購読する（解放は useSignalR が onUnmounted で自動実行）
const { onElectricPowerReceived } = useSignalR()
onElectricPowerReceived((power) => {
  currentTime.value = dayjs(power.timeStamp).format('YYYY-MM-DD HH:mm:ss')
  currentValue.value = power.electricPower
  chartRef.value?.addPoint(power)
})
</script>

<template>
  <div class="space-y-2">
    <div class="text-sm text-muted-foreground">[{{ currentTime }}]</div>
    <div class="text-foreground">
      <span class="text-3xl font-bold">{{ formattedValue }}</span>W
      <span class="text-muted-foreground">（{{ formattedPrice }}円/h）</span>
    </div>
    <div class="h-[520px]">
      <ElectricPowerChart ref="chartRef" />
    </div>
  </div>
</template>
