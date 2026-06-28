<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Panel from '@/components/common/Panel.vue'
import { networkApi } from '@/services/network'
import { formatDateTime } from '@/lib/dayjs'
import type { DhcpLease } from '@/models/dhcp-lease.model'

/**
 * DHCP 払い出し中リストページ。
 * Angular 版 `DhcpLeasesComponent` を移植する。
 * IPv4 はゼロ埋めしたうえで昇順ソートする（linq の置き換え）。
 */
const dhcpLeases = ref<DhcpLease[]>([])

/** ソート用のキーを生成する（IPv4 は各オクテットを 3 桁ゼロ埋め、IPv6 はそのまま） */
function sortKey(ipAddress: string): string {
  if (ipAddress.includes(':')) {
    return ipAddress
  }
  return ipAddress
    .split('.')
    .map((octet) => `00${octet}`.slice(-3))
    .join('.')
}

onMounted(async () => {
  try {
    const leases = await networkApi.getDhcpLeases()
    dhcpLeases.value = [...(leases ?? [])].sort((a, b) =>
      sortKey(a.ipAddress).localeCompare(sortKey(b.ipAddress)),
    )
  } catch (err) {
    console.error('DHCP リースの取得に失敗しました', err)
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-lg font-semibold">DHCP払い出し中リスト</h3>
    <Panel>
      <table class="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-muted-foreground">
            <th class="w-44 p-2">リース有効期限</th>
            <th class="w-40 p-2">MACアドレス</th>
            <th class="w-32 p-2">IPアドレス</th>
            <th class="p-2">ホスト名</th>
            <th class="w-40 p-2">クライアントID</th>
            <th class="p-2">ベンダー名</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in dhcpLeases" :key="item.macAddress" class="border-b border-border">
            <td class="p-2">{{ formatDateTime(item.timeOfLeaseExpiry, 'YYYY-MM-DD HH:mm:ss') }}</td>
            <td class="p-2">{{ item.macAddress }}</td>
            <td class="p-2">{{ item.ipAddress }}</td>
            <td class="truncate p-2">{{ item.hostName }}</td>
            <td class="truncate p-2">{{ item.clientId }}</td>
            <td class="truncate p-2">{{ item.vendor?.organizationName }}</td>
          </tr>
          <tr v-if="dhcpLeases.length === 0">
            <td colspan="6" class="p-4 text-center text-muted-foreground">データがありません</td>
          </tr>
        </tbody>
      </table>
    </Panel>
  </div>
</template>
