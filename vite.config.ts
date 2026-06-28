import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 4200,
    proxy: {
      // 開発時は API を Vite 経由でバックエンドへプロキシする。
      // secure: false で自己署名（開発用）証明書の検証を無視する。
      '/api': {
        target: 'https://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
