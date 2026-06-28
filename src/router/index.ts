import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // フェーズ 2 以降で DashboardTop / 各機能ページに差し替える。
      component: () => import('@/pages/HomePage.vue'),
    },
  ],
})

export default router
