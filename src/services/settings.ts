import { http } from '@/lib/http'
import type { Settings } from '@/models/settings.model'

/**
 * 設定（MoneyForward 連携情報）の REST API。
 * Angular 版 `settings-api.service.ts` のエンドポイントを移植。
 */
export const settingsApi = {
  /** 現在の設定を取得する */
  getSettings: () => http.get<Settings>('api/settings-api/get-current-settings'),

  /** 設定を更新する（変更されたフィールドのみを送る想定） */
  updateSettings: (settings: Settings) =>
    http.post<boolean>('api/settings-api/update-settings', settings),
}
