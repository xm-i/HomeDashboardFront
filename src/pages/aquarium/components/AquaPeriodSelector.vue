<script setup lang="ts">
/**
 * アクアリウムの集計間隔（ピリオド）セレクタ。
 * Angular 版 `aqua-period-selector` を、ネイティブ select で再現する。
 * 選択値は v-model:period で双方向バインドする（秒単位）。
 */
const period = defineModel<number | null>('period', { default: null })

/** 集計間隔の候補（Angular 版の candidate を移植） */
const candidate: { label: string; value: number }[] = [
  { label: '10秒', value: 10 },
  { label: '1分', value: 60 },
  { label: '3分', value: 180 },
  { label: '5分', value: 300 },
  { label: '10分', value: 600 },
  { label: '15分', value: 900 },
  { label: '30分', value: 1800 },
  { label: '1時間', value: 3600 },
  { label: '3時間', value: 10800 },
  { label: '6時間', value: 21600 },
  { label: '12時間', value: 43200 },
  { label: '24時間', value: 86400 },
  { label: '3日', value: 259200 },
  { label: '7日', value: 604800 },
  { label: '30日', value: 2592000 },
  { label: '180日', value: 15552000 },
  { label: '365日', value: 31536000 },
]

/** select の変更を number に変換して反映する */
function onChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  period.value = value === '' ? null : Number(value)
}
</script>

<template>
  <select
    :value="period ?? ''"
    class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
    @change="onChange"
  >
    <option value="" disabled>間隔の選択</option>
    <option v-for="item in candidate" :key="item.value" :value="item.value">
      {{ item.label }}
    </option>
  </select>
</template>
