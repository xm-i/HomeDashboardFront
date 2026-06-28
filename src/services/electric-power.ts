import { http } from '@/lib/http'
import type { ElectricPower } from '@/models/electric-power.model'

/**
 * 電力使用量の REST API。
 * Angular 版 `electric-power.service.ts`（ElectricPowerApiService）のエンドポイントを移植。
 * リアルタイム更新（electric-power-received）は `useSignalR` を利用する。
 */
export const electricPowerApi = {
  /**
   * 指定期間の電力消費量リストを取得する。
   * @param from 開始日時（"YYYY-MM-DD HH:mm:ss"）
   * @param to 終了日時（"YYYY-MM-DD HH:mm:ss"）
   */
  getElectricPowerConsumptionList: (from: string, to: string) =>
    http.get<ElectricPower[]>('api/electric-power-api/get-electric-power-consumption-list', {
      params: { from, to },
    }),
}
