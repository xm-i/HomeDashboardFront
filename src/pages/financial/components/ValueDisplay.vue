<script setup lang="ts">
import { computed } from 'vue'
import type { InvestmentCurrencyUnit } from '@/models/investment-currency-unit.model'
import { jpyCurrencyId } from '../utils/util'

/**
 * 数値表示コンポーネント。
 * Angular 版 `app-value-display` を移植する。
 * - type により表示形式を切り替える（増減色付け / 通貨単位 / 円換算など）。
 * - プラスは緑、マイナスは赤、ゼロはグレーで表示する。
 */
const props = withDefaults(
  defineProps<{
    /** 表示値 */
    value?: number
    /** 通貨単位 */
    investmentCurrencyUnit?: InvestmentCurrencyUnit | null
    /** 表示タイプ */
    type?: 'price' | 'static-price' | 'percent' | 'static-price-with-yen' | 'amount'
    /** 小数点以下桁数の調整値 */
    adjustNumberOfDecimalPoint?: number
  }>(),
  {
    value: NaN,
    investmentCurrencyUnit: null,
    type: 'price',
    adjustNumberOfDecimalPoint: 0,
  },
)

/** 表示に用いる小数点以下桁数 */
const numberOfDecimalPoint = computed<number>(() => {
  if (props.type === 'percent') {
    return 3 + props.adjustNumberOfDecimalPoint
  }
  if (props.type === 'amount') {
    return props.adjustNumberOfDecimalPoint
  }
  return (props.investmentCurrencyUnit?.numberOfDecimalPoint ?? 0) + props.adjustNumberOfDecimalPoint
})

/** 指定桁数で 3 桁区切りに整形する（Angular の number パイプ digitsInfo 相当） */
function format(value: number, decimals: number): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return ''
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** 整形済みの本体値 */
const formattedValue = computed<string>(() => format(props.value, numberOfDecimalPoint.value))

/** 円換算値（static-price-with-yen で外貨の場合に利用） */
const formattedYenValue = computed<string>(() =>
  format(props.value * (props.investmentCurrencyUnit?.latestRate ?? 0), 0),
)

/** 日本円単位かどうか */
const isJpy = computed<boolean>(() => props.investmentCurrencyUnit?.id === jpyCurrencyId)

/** 通貨単位記号 */
const unit = computed<string>(() => props.investmentCurrencyUnit?.unit ?? '')
</script>

<template>
  <!-- 増減色付きの価格表示 -->
  <template v-if="type === 'price'">
    <span v-if="value > 0" class="text-emerald-400">{{ unit }}+{{ formattedValue }}</span>
    <span v-else-if="value === 0" class="text-muted-foreground">{{ unit }}0</span>
    <span v-else class="text-rose-400">{{ unit }}{{ formattedValue }}</span>
  </template>

  <!-- 固定色の価格表示 -->
  <template v-else-if="type === 'static-price'">
    <span class="text-muted-foreground">{{ unit }}{{ formattedValue }}</span>
  </template>

  <!-- 円換算付きの価格表示 -->
  <template v-else-if="type === 'static-price-with-yen'">
    <span class="text-muted-foreground">
      <template v-if="isJpy"> {{ unit }}{{ formattedValue }} </template>
      <template v-else>
        ￥{{ formattedYenValue }}<br />
        ({{ unit }}{{ formattedValue }})
      </template>
    </span>
  </template>

  <!-- 増減色付きのパーセント表示 -->
  <template v-else-if="type === 'percent'">
    <span v-if="value > 0" class="text-emerald-400">+{{ formattedValue }} %</span>
    <span v-else-if="value === 0" class="text-muted-foreground">0 %</span>
    <span v-else class="text-rose-400">{{ formattedValue }} %</span>
  </template>

  <!-- 数量表示 -->
  <template v-else-if="type === 'amount'">
    <span class="text-muted-foreground">{{ formattedValue }}</span>
  </template>
</template>
