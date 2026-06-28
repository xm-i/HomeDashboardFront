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
          path: 'aquarium',
          component: () => import('@/pages/aquarium/AquariumPage.vue'),
          children: [
            {
              path: '',
              name: 'aquarium',
              component: () => import('@/pages/aquarium/AquariumTopPage.vue'),
            },
            {
              path: 'past',
              name: 'aquarium-past',
              component: () => import('@/pages/aquarium/AquariumPastPage.vue'),
            },
          ],
        },
        {
          path: 'electric-power',
          component: () => import('@/pages/electric-power/ElectricPowerPage.vue'),
          children: [
            {
              path: '',
              name: 'electric-power',
              component: () => import('@/pages/electric-power/ElectricPowerTopPage.vue'),
            },
            {
              path: 'past',
              name: 'electric-power-past',
              component: () => import('@/pages/electric-power/ElectricPowerPastPage.vue'),
            },
          ],
        },
        {
          path: 'palmie',
          component: () => import('@/pages/palmie/PalmiePage.vue'),
          children: [
            {
              path: '',
              name: 'palmie',
              component: () => import('@/pages/palmie/PalmieTopPage.vue'),
            },
            {
              path: ':id',
              name: 'palmie-course',
              component: () => import('@/pages/palmie/PalmieCoursePage.vue'),
            },
          ],
        },
        {
          path: 'financial',
          component: () => import('@/pages/financial/FinancialPage.vue'),
          children: [
            {
              path: '',
              name: 'financial',
              component: () => import('@/pages/financial/FinancialTopPage.vue'),
            },
            {
              path: 'asset',
              name: 'financial-asset',
              component: () => import('@/pages/financial/AssetPage.vue'),
            },
            {
              path: 'expense',
              name: 'financial-expense',
              component: () => import('@/pages/financial/ExpensePage.vue'),
            },
            {
              path: 'income',
              name: 'financial-income',
              component: () => import('@/pages/financial/IncomePage.vue'),
            },
            {
              path: 'investment',
              name: 'financial-investment',
              component: () => import('@/pages/financial/InvestmentPage.vue'),
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
