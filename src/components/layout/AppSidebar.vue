<script setup lang="ts">
import { computed, ref, watch, type FunctionalComponent } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import {
  Home,
  Wallet,
  Network,
  Fish,
  Zap,
  BookOpen,
  Video,
  Link as LinkIcon,
  Settings,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-vue-next'

/** 単独リンクのメニュー項目 */
interface MenuLink {
  type: 'link'
  label: string
  to: string
  icon: FunctionalComponent
}

/** サブメニュー（子リンクを持つ）項目 */
interface MenuGroup {
  type: 'group'
  label: string
  icon: FunctionalComponent
  children: { label: string; to: string }[]
}

type MenuItem = MenuLink | MenuGroup

/**
 * サイドメニュー定義。
 * Angular 版 `dashboard.component.html` の nz-menu 構成を忠実に再現する。
 */
const menu: MenuItem[] = [
  { type: 'link', label: 'トップ', to: '/', icon: Home },
  {
    type: 'group',
    label: '家計簿',
    icon: Wallet,
    children: [
      { label: 'Top', to: '/financial' },
      { label: '資産', to: '/financial/asset' },
      { label: '支出', to: '/financial/expense' },
      { label: '収入', to: '/financial/income' },
      { label: '投資', to: '/financial/investment' },
    ],
  },
  {
    type: 'group',
    label: 'ネットワーク',
    icon: Network,
    children: [
      { label: 'DHCP払い出し中リスト', to: '/network/dhcp-leases' },
      { label: 'Wake on LAN', to: '/network/wake-on-lan' },
      { label: 'ネットワーク図', to: '/network/diagram' },
      { label: 'ヘルスステータス', to: '/network/health-check' },
    ],
  },
  {
    type: 'group',
    label: 'アクアリウム',
    icon: Fish,
    children: [
      { label: 'Top', to: '/aquarium' },
      { label: '過去分', to: '/aquarium/past' },
    ],
  },
  {
    type: 'group',
    label: '電力',
    icon: Zap,
    children: [
      { label: 'Top', to: '/electric-power' },
      { label: '過去分', to: '/electric-power/past' },
    ],
  },
  { type: 'link', label: 'キッチン', to: '/kitchen', icon: BookOpen },
  { type: 'link', label: 'パルミー', to: '/palmie', icon: Video },
  { type: 'link', label: 'リンク', to: '/links', icon: LinkIcon },
  { type: 'link', label: '設定', to: '/settings', icon: Settings },
]

const route = useRoute()

/** サイドバーの折りたたみ状態（nzCollapsible 相当） */
const collapsed = ref(false)

/** 開いているサブメニューのラベル集合 */
const openGroups = ref<Set<string>>(new Set())

/** 指定パスが現在のルートに含まれるか（親子のアクティブ判定に使用） */
function isActivePath(to: string): boolean {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path === to || route.path.startsWith(`${to}/`)
}

/** サブメニューが現在のルートにマッチしているか */
function isGroupActive(group: MenuGroup): boolean {
  return group.children.some((child) => isActivePath(child.to))
}

/** サブメニューの開閉を切り替える */
function toggleGroup(label: string): void {
  const next = new Set(openGroups.value)
  if (next.has(label)) {
    next.delete(label)
  } else {
    next.add(label)
  }
  openGroups.value = next
}

/** 折りたたみを切り替える */
function toggleCollapsed(): void {
  collapsed.value = !collapsed.value
}

/** 現在ルートにマッチするサブメニューを自動的に開く */
watch(
  () => route.path,
  () => {
    const next = new Set(openGroups.value)
    for (const item of menu) {
      if (item.type === 'group' && isGroupActive(item)) {
        next.add(item.label)
      }
    }
    openGroups.value = next
  },
  { immediate: true },
)

/** 折りたたみ時はサブメニューを閉じた表示にする */
const showLabels = computed(() => !collapsed.value)
</script>

<template>
  <aside
    class="flex h-screen flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200"
    :class="collapsed ? 'w-16' : 'w-52'"
  >
    <!-- ロゴ領域 -->
    <div class="flex h-14 shrink-0 items-center gap-2 px-4">
      <Home class="size-5 shrink-0 text-primary" />
      <span v-if="showLabels" class="truncate font-semibold">Home Dashboard</span>
    </div>

    <!-- メニュー -->
    <nav class="flex-1 overflow-y-auto px-2 py-2">
      <ul class="flex flex-col gap-1">
        <li v-for="item in menu" :key="item.label">
          <!-- 単独リンク -->
          <RouterLink
            v-if="item.type === 'link'"
            :to="item.to"
            class="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            :class="
              isActivePath(item.to)
                ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                : ''
            "
            :title="collapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="size-4 shrink-0" />
            <span v-if="showLabels" class="truncate">{{ item.label }}</span>
          </RouterLink>

          <!-- サブメニュー -->
          <template v-else>
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              :class="
                isGroupActive(item)
                  ? 'font-medium text-sidebar-accent-foreground'
                  : ''
              "
              :title="collapsed ? item.label : undefined"
              @click="toggleGroup(item.label)"
            >
              <component :is="item.icon" class="size-4 shrink-0" />
              <span v-if="showLabels" class="flex-1 truncate text-left">{{ item.label }}</span>
              <ChevronDown
                v-if="showLabels"
                class="size-4 shrink-0 transition-transform"
                :class="openGroups.has(item.label) ? 'rotate-180' : ''"
              />
            </button>

            <ul
              v-show="showLabels && openGroups.has(item.label)"
              class="mt-1 flex flex-col gap-1 pl-4"
            >
              <li v-for="child in item.children" :key="child.to">
                <RouterLink
                  :to="child.to"
                  class="block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  :class="
                    isActivePath(child.to)
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'text-muted-foreground'
                  "
                >
                  {{ child.label }}
                </RouterLink>
              </li>
            </ul>
          </template>
        </li>
      </ul>
    </nav>

    <!-- 折りたたみトグル -->
    <div class="shrink-0 border-t border-border p-2">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        @click="toggleCollapsed"
      >
        <ChevronsRight v-if="collapsed" class="size-4" />
        <template v-else>
          <ChevronsLeft class="size-4" />
          <span>折りたたむ</span>
        </template>
      </button>
    </div>
  </aside>
</template>
