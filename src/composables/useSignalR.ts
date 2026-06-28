import { onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import type { CurrentWaterState } from '@/models/water-state.model'
import type { ElectricPower } from '@/models/electric-power.model'

/** Hub から受け取るイベントハンドラの型（引数は SignalR 側で型不定のため unknown 配列） */
type HubHandler = (...args: unknown[]) => void

/** 登録済みハンドラの控え（onUnmounted での解放に使用） */
interface Registration {
  event: string
  handler: HubHandler
}

/**
 * SignalR（dashboard-hub）のイベント購読を提供する Composable。
 *
 * - 接続は `useDashboardStore` が単一インスタンスとして管理する。
 * - このフックで登録したハンドラは `onUnmounted` で自動的に解除されるため、
 *   呼び出し側で `off` を意識する必要はない（AGENTS.md: 購読・リソースの解放）。
 */
export function useSignalR() {
  const store = useDashboardStore()
  const registrations: Registration[] = []

  /** 指定イベントにハンドラを登録し、接続を開始する（解放用に控えを保持する）。 */
  function register(event: string, handler: HubHandler): void {
    const conn = store.ensureConnection()
    conn.on(event, handler)
    registrations.push({ event, handler })
    // 接続が未開始なら開始する（多重呼び出しはストア側で吸収）
    store.startConnection().catch((err: unknown) => {
      console.error('SignalR の接続開始に失敗しました', err)
    })
  }

  /**
   * 水質状態の変化（`aqua-state-changed`）を購読する。
   * Hub からは (timeStamp, waterTemperature, humidity, temperature) の順で届く。
   */
  function onAquaStateChanged(callback: (state: CurrentWaterState) => void): void {
    const handler: HubHandler = (...args) => {
      const [timeStamp, waterTemperature, humidity, temperature] = args as [
        string,
        number,
        number,
        number,
      ]
      callback({ timeStamp, waterTemperature, temperature, humidity })
    }
    register('aqua-state-changed', handler)
  }

  /**
   * 電力使用量の受信（`electric-power-received`）を購読する。
   * Hub からは (timeStamp, electricPower) の順で届く。
   */
  function onElectricPowerReceived(callback: (power: ElectricPower) => void): void {
    const handler: HubHandler = (...args) => {
      const [timeStamp, electricPower] = args as [string, number]
      callback({ timeStamp, electricPower })
    }
    register('electric-power-received', handler)
  }

  // コンポーネント破棄時に、このフックで登録したハンドラだけを解除する
  onUnmounted(() => {
    const conn = store.connection
    if (conn) {
      for (const { event, handler } of registrations) {
        conn.off(event, handler)
      }
    }
    registrations.length = 0
  })

  return { onAquaStateChanged, onElectricPowerReceived }
}
