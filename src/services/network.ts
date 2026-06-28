import { http } from '@/lib/http'
import type { WakeOnLanTarget } from '@/models/wake-on-lan-target.model'
import type { DhcpLease } from '@/models/dhcp-lease.model'
import type { HealthCheckResult } from '@/models/health-check-result.model'

/**
 * ネットワーク（Wake on LAN / DHCP / ヘルスチェック）の REST API。
 * Angular 版 `network-api.service.ts` のエンドポイントを移植。
 */
export const networkApi = {
  /** マジックパケットを送信する */
  sendMagicPacket: (macAddress: string) =>
    http.post<boolean>('api/network-api/post-send-magic-packet-request', {
      targetMacAddress: macAddress,
    }),

  /** Wake on LAN 対象を登録する */
  registerWakeOnLanTarget: (target: WakeOnLanTarget) =>
    http.post<boolean>('api/network-api/post-register-wake-on-lan-target', target),

  /** Wake on LAN 対象を削除する */
  deleteWakeOnLanTarget: (target: WakeOnLanTarget) =>
    http.post<boolean>('api/network-api/post-delete-wake-on-lan-target', target),

  /** Wake on LAN 対象の一覧を取得する */
  getWakeOnLanTargets: () =>
    http.get<WakeOnLanTarget[]>('api/network-api/get-wake-on-lan-target-list'),

  /** DHCP 払い出し中リストを取得する */
  getDhcpLeases: () => http.get<DhcpLease[]>('api/network-api/get-dhcp-leases'),

  /** ヘルスチェックの最新結果を取得する */
  getLatestHealthCheck: () =>
    http.get<HealthCheckResult[]>('api/health-check-api/get-latest-result'),
}
