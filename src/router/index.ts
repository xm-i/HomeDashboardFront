import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      // 全画面共通のレイアウト（サイドバー + メインコンテンツ）。
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'home',
          // フェーズ 2 以降で DashboardTop / 各機能ページに差し替える。
          component: () => import('@/pages/HomePage.vue'),
        },
        {
          path: 'links',
          name: 'links',
          component: () => import('@/pages/links/LinksPage.vue'),
        },
        {
          path: 'kitchen',
          name: 'kitchen',
          component: () => import('@/pages/kitchen/KitchenPage.vue'),
        },
        {
          path: 'network',
          component: () => import('@/pages/network/NetworkPage.vue'),
          children: [
            {
              path: '',
              name: 'network',
              component: () => import('@/pages/network/NetworkTopPage.vue'),
            },
            {
              path: 'dhcp-leases',
              name: 'network-dhcp-leases',
              component: () => import('@/pages/network/DhcpLeasesPage.vue'),
            },
            {
              path: 'wake-on-lan',
              name: 'network-wake-on-lan',
              component: () => import('@/pages/network/WakeOnLanPage.vue'),
            },
            {
              path: 'health-check',
              name: 'network-health-check',
              component: () => import('@/pages/network/HealthCheckPage.vue'),
            },
            {
              path: 'diagram',
              name: 'network-diagram',
              component: () => import('@/pages/network/NetworkDiagramPage.vue'),
            },
          ],
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/pages/settings/SettingsPage.vue'),
        },
      ],
    },
  ],
})

export default router
