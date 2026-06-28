/**
 * 環境変数のラッパー。
 * `import.meta.env` を直接参照せず、必ずこのモジュール経由でアクセスする。
 */
export const env = {
  /** バックエンド API のベース URL */
  apiUrl: import.meta.env.VITE_API_URL,
  /** パルミー動画の URL */
  palmieVideoUrl: import.meta.env.VITE_PALMIE_VIDEO_URL,
  /** パルミー資料の URL */
  palmieDocumentsUrl: import.meta.env.VITE_PALMIE_DOCUMENTS_URL,
  /** 電気料金単価（円/kWh） */
  kwhPrice: Number(import.meta.env.VITE_KWH_PRICE),
} as const
