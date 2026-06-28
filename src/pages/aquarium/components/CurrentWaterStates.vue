<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSignalR } from '@/composables/useSignalR'
import { aquariumApi } from '@/services/aquarium'
import type { CurrentWaterState } from '@/models/water-state.model'
import Panel from '@/components/common/Panel.vue'

/**
 * 現在の水質状態（水温・気温・湿度）をゲージ表示する。
 * - 初期値は REST（getLatestWaterState）から取得する。
 * - 以降は SignalR（aqua-state-changed）でリアルタイム更新する。
 * Angular 版 `current-water-states` を、shadcn/Tailwind + SVG ゲージで再現。
 */

/** 現在の水質状態 */
const waterState = ref<CurrentWaterState | null>(null)

/** 取得失敗メッセージ */
const errorMessage = ref<string | null>(null)

const { onAquaStateChanged } = useSignalR()

// リアルタイム更新を購読（解放は useSignalR が onUnmounted で自動実行）
onAquaStateChanged((state) => {
  waterState.value = state
})

// 初期値を取得
aquariumApi
  .getLatestWaterState()
  .then((state) => {
    waterState.value = state
  })
  .catch(() => {
    errorMessage.value = '通信失敗'
  })

/** SVG 円の半径と円周（ゲージ描画用） */
const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * ゲージ表示用の定義。
 * - 水温/気温: percent = (value - 15) * 5（Angular 版の計算式を踏襲）
 * - 湿度: percent = value
 */
const gauges = computed(() => {
  const ws = waterState.value
  return [
    {
      title: '水温',
      value: ws?.waterTemperature ?? 0,
      percent: ws ? (ws.waterTemperature - 15) * 5 : 0,
      text: `${(ws?.waterTemperature ?? 0).toFixed(3)} ℃`,
      color: '#1e90ff',
    },
    {
      title: '気温',
      value: ws?.temperature ?? 0,
      percent: ws ? (ws.temperature - 15) * 5 : 0,
      text: `${(ws?.temperature ?? 0).toFixed(3)} ℃`,
      color: '#ff4500',
    },
    {
      title: '湿度',
      value: ws?.humidity ?? 0,
      percent: ws?.humidity ?? 0,
      text: `${(ws?.humidity ?? 0).toFixed(3)} %`,
      color: '#52c41a',
    },
  ]
})

/** percent（0-100 にクランプ）から SVG の dashoffset を求める */
function dashOffset(percent: number): number {
  const clamped = Math.min(100, Math.max(0, percent))
  return CIRCUMFERENCE * (1 - clamped / 100)
}
</script>

<template>
  <div>
    <div class="flex flex-wrap gap-4">
      <Panel v-for="gauge in gauges" :key="gauge.title" class="w-[260px]">
        <div class="mb-2 text-sm font-medium text-muted-foreground">{{ gauge.title }}</div>
        <div class="flex items-center justify-center">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <!-- 背景の円 -->
            <circle
              cx="80"
              cy="80"
              :r="RADIUS"
              fill="none"
              stroke="#3f3f46"
              stroke-width="10"
            />
            <!-- 値の円弧 -->
            <circle
              cx="80"
              cy="80"
              :r="RADIUS"
              fill="none"
              :stroke="gauge.color"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="CIRCUMFERENCE"
              :stroke-dashoffset="dashOffset(gauge.percent)"
              transform="rotate(-90 80 80)"
              style="transition: stroke-dashoffset 0.3s ease"
            />
            <!-- 中央の値ラベル -->
            <text
              x="80"
              y="86"
              text-anchor="middle"
              class="fill-foreground"
              style="font-size: 18px"
            >
              {{ gauge.text }}
            </text>
          </svg>
        </div>
      </Panel>
    </div>
    <div class="mt-1 pr-2 text-right text-sm text-muted-foreground">
      <span v-if="waterState">{{ waterState.timeStamp }}時点</span>
      <span v-else-if="errorMessage" class="text-destructive">{{ errorMessage }}</span>
    </div>
  </div>
</template>
