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

export default dayjs
