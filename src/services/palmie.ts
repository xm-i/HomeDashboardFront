import { http } from '@/lib/http'
import type { PalmieCourses } from '@/models/palmie-course.model'

/**
 * パルミー（オンライン絵画講座）の REST API。
 * Angular 版 `palmie-api.service.ts`（PalmieApiService）のエンドポイントを移植。
 */
export const palmieApi = {
  /** 全コースを取得する */
  getCourses: () => http.get<PalmieCourses>('api/palmie-api/get-all-courses'),

  /**
   * 検索ワードでコースを取得する。
   * @param word 検索ワード（コース ID 指定時は "123," のように利用する）
   */
  getSearchResult: (word: string) =>
    http.get<PalmieCourses>('api/palmie-api/get-courses', { params: { word } }),
}
