<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import type { DateRange } from '@/models/date-range.model'
import { Button } from '@/components/ui/button'

/**
 * 日付範囲セレクタ。
 * Angular 版 `date-range-selector`（nz-range-picker + プリセット）を、
 * ネイティブ日付入力 + プリセットボタンで再現する。日時は dayjs で扱う。
 */
const props = withDefaults(defineProps<{ showTime?: boolean }>(), { showTime: false })

/** 選択中の日付範囲（v-model:dateRange で双方向バインド） */
const dateRange = defineModel<DateRange>('dateRange')

/**
 * プリセット（今月/先月/先々月/今年/去年/一昨年）。
 * Angular 版の `dateRanges` を dayjs に置き換えて移植。
 */
const presets: { label: string; range: () => DateRange }[] = [
  { label: '今月', range: () => ({ startDate: dayjs().startOf('month'), endDate: dayjs() }) },
  {
    label: '先月',
    range: () => ({
      startDate: dayjs().add(-1, 'month').startOf('month'),
      endDate: dayjs().add(-1, 'month').endOf('month'),
    }),
  },
  {
    label: '先々月',
    range: () => ({
      startDate: dayjs().add(-2, 'month').startOf('month'),
      endDate: dayjs().add(-2, 'month').endOf('month'),
    }),
  },
  { label: '今年', range: () => ({ startDate: dayjs().startOf('year'), endDate: dayjs() }) },
  {
    label: '去年',
    range: () => ({
      startDate: dayjs().add(-1, 'year').startOf('year'),
      endDate: dayjs().add(-1, 'year').endOf('year'),
    }),
  },
  {
    label: '一昨年',
    range: () => ({
      startDate: dayjs().add(-2, 'year').startOf('year'),
      endDate: dayjs().add(-2, 'year').endOf('year'),
    }),
  },
]

/** 時刻入力の有無で input type を切り替える */
const inputType = computed(() => (props.showTime ? 'datetime-local' : 'date'))

/** input の value フォーマット（type に対応） */
const inputFormat = computed(() => (props.showTime ? 'YYYY-MM-DDTHH:mm' : 'YYYY-MM-DD'))

/** 本日以降を選択不可にするための max 値 */
const maxValue = computed(() => dayjs().format(inputFormat.value))

/** 開始日の input 表示値 */
const startValue = computed(() =>
  dateRange.value ? dateRange.value.startDate.format(inputFormat.value) : '',
)

/** 終了日の input 表示値 */
const endValue = computed(() =>
  dateRange.value ? dateRange.value.endDate.format(inputFormat.value) : '',
)

/** プリセットを適用する */
function applyPreset(range: DateRange): void {
  dateRange.value = range
}

/** 開始日変更 */
function onStartChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  if (!value) {
    return
  }
  const startDate = dayjs(value)
  const endDate = dateRange.value?.endDate ?? startDate
  dateRange.value = { startDate, endDate }
}

/** 終了日変更 */
function onEndChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  if (!value) {
    return
  }
  const endDate = dayjs(value)
  const startDate = dateRange.value?.startDate ?? endDate
  dateRange.value = { startDate, endDate }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <!-- 日付入力 -->
    <div class="flex flex-wrap items-center gap-2">
      <input
        :type="inputType"
        :value="startValue"
        :max="maxValue"
        class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        @change="onStartChange"
      />
      <span class="text-muted-foreground">〜</span>
      <input
        :type="inputType"
        :value="endValue"
        :max="maxValue"
        class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        @change="onEndChange"
      />
    </div>

    <!-- プリセット -->
    <div class="flex flex-wrap gap-2">
      <Button
        v-for="preset in presets"
        :key="preset.label"
        variant="outline"
        size="sm"
        @click="applyPreset(preset.range())"
      >
        {{ preset.label }}
      </Button>
    </div>
  </div>
</template>
