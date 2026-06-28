import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * ダッシュボード全体のグローバル状態を管理するストア。
 * フェーズ 1 で SignalR 接続（dashboard-hub）の単一管理を実装する。
 */
export const useDashboardStore = defineStore('dashboard', () => {
  /** アプリ名（プレースホルダ） */
  const appName = ref('HomeDashboard')

  return { appName }
})
