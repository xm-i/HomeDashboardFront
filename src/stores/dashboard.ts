import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr'
import { env } from '@/config/env'

/**
 * ダッシュボード全体のグローバル状態を管理するストア。
 * SignalR（dashboard-hub）への**単一接続**をここで集中管理する。
 * 各画面は `useSignalR` Composable 経由でイベントを購読する。
 */
export const useDashboardStore = defineStore('dashboard', () => {
  /** アプリ名（プレースホルダ） */
  const appName = ref('HomeDashboard')

  /** SignalR の Hub 接続（単一インスタンス）。リアクティブ追跡は不要なため shallowRef を使用 */
  const connection = shallowRef<HubConnection | null>(null)

  /** 現在の接続状態 */
  const connectionState = ref<HubConnectionState>(HubConnectionState.Disconnected)

  /** Hub 接続の URL を組み立てる（apiUrl の末尾スラッシュ有無を吸収する） */
  function buildHubUrl(): string {
    const baseUrl = env.apiUrl.endsWith('/') ? env.apiUrl : `${env.apiUrl}/`
    return `${baseUrl}api/hubs/dashboard-hub`
  }

  /**
   * Hub 接続を生成する（未生成の場合のみ）。
   * Angular 版の自動再接続設定（1 秒間隔）を踏襲する。
   */
  function ensureConnection(): HubConnection {
    if (connection.value) {
      return connection.value
    }

    const conn = new HubConnectionBuilder()
      .withUrl(buildHubUrl())
      .withAutomaticReconnect({
        // 失敗回数によらず常に 1 秒後に再試行する（Angular 版と同等）
        nextRetryDelayInMilliseconds: () => 1000,
      })
      .build()

    conn.onreconnecting(() => {
      connectionState.value = HubConnectionState.Reconnecting
    })
    conn.onreconnected(() => {
      connectionState.value = HubConnectionState.Connected
    })
    conn.onclose(() => {
      connectionState.value = HubConnectionState.Disconnected
    })

    connection.value = conn
    return conn
  }

  /**
   * Hub 接続を開始する（未接続の場合のみ）。
   * 既に接続中・接続済みの場合は何もせず既存の接続を返す。
   */
  async function startConnection(): Promise<HubConnection> {
    const conn = ensureConnection()
    if (conn.state === HubConnectionState.Disconnected) {
      connectionState.value = HubConnectionState.Connecting
      try {
        await conn.start()
        connectionState.value = HubConnectionState.Connected
      } catch (err) {
        connectionState.value = HubConnectionState.Disconnected
        throw err
      }
    }
    return conn
  }

  /** Hub 接続を停止して破棄する。 */
  async function stopConnection(): Promise<void> {
    if (connection.value) {
      await connection.value.stop()
      connection.value = null
      connectionState.value = HubConnectionState.Disconnected
    }
  }

  return {
    appName,
    connection,
    connectionState,
    ensureConnection,
    startConnection,
    stopConnection,
  }
})
