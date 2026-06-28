import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import isoWeek from 'dayjs/plugin/isoWeek'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

// 日時処理は dayjs に統一する（moment は使用しない）。
dayjs.extend(isoWeek)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)
dayjs.locale('ja')

/**
 * 日時を指定フォーマットで整形する。
 * Angular 版 `datetimeFormatPipe`（moment ベース）の dayjs 置き換え。
 */
export function formatDateTime(value: string | number | Date, format: string): string {
  return dayjs(value).format(format)
}

export default dayjs
