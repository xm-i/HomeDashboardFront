/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_PALMIE_VIDEO_URL: string
  readonly VITE_PALMIE_DOCUMENTS_URL: string
  readonly VITE_KWH_PRICE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
