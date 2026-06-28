import { http } from '@/lib/http'
import type { WaterState, CurrentWaterState } from '@/models/water-state.model'

/**
 * アクアリウム（水質状態）の REST API。
 * Angular 版 `aquarium-api.service.ts` のエンドポイントを移植。
 * リアルタイム更新（aqua-state-changed）は `useSignalR` を利用する。
 */
export const aquariumApi = {
  /**
   * 指定期間・集計間隔の水質状態リストを取得する。
   * @param from 開始日時（"YYYY-MM-DD HH:mm:ss"）
   * @param to 終了日時（"YYYY-MM-DD HH:mm:ss"）
   * @param period 集計間隔（秒）
   */
  getWaterStateList: (from: string, to: string, period: number) =>
    http.get<WaterState[]>('api/aquarium-api/get-water-state-list', {
      params: { from, to, period },
    }),

  /** 最新の水質状態を取得する */
  getLatestWaterState: () =>
    http.get<CurrentWaterState>('api/aquarium-api/get-latest-water-state'),
}
