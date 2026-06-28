import type { Dayjs } from 'dayjs'

/**
 * 日付範囲。
 * Angular 版では moment の `Moment` を使用していたが、Vue 版では dayjs の `Dayjs` に置き換える。
 */
export interface DateRange {
  startDate: Dayjs
  endDate: Dayjs
}
