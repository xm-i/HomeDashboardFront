<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { AlertTriangle, CheckCircle2 } from 'lucide-vue-next'
import Panel from '@/components/common/Panel.vue'
import { networkApi } from '@/services/network'
import type { HealthCheckResult } from '@/models/health-check-result.model'

/**
 * ヘルスステータスページ。
 * Angular 版 `HealthCheckComponent` を移植する。
 * `state` が true のときは警告（異常）、false のときは正常として表示する。
 */
const results = ref<HealthCheckResult[]>([])

onMounted(async () => {
  try {
    results.value = (await networkApi.getLatestHealthCheck()) ?? []
  } catch (err) {
    console.error('ヘルスチェック結果の取得に失敗しました', err)
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-lg font-semibold">ヘルスステータス</h3>
    <Panel>
      <table class="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-muted-foreground">
            <th class="p-2">名前</th>
            <th class="p-2">ホスト</th>
            <th class="w-20 p-2">ステータス</th>
            <th class="w-52 p-2">ステータス変化時間</th>
            <th class="p-2">備考</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in results"
            :key="item.healthCheckTargetId"
            class="border-b border-border"
          >
            <td class="truncate p-2">{{ item.name }}</td>
            <td class="truncate p-2">{{ item.host }}</td>
            <td class="p-2">
              <AlertTriangle v-if="item.state" class="size-5 text-[#c41a52]" />
              <CheckCircle2 v-else class="size-5 text-[#52c41a]" />
            </td>
            <td class="p-2">{{ item.dateTime }}</td>
            <td class="truncate p-2">{{ item.reason }}</td>
          </tr>
          <tr v-if="results.length === 0">
            <td colspan="5" class="p-4 text-center text-muted-foreground">データがありません</td>
          </tr>
        </tbody>
      </table>
    </Panel>
  </div>
</template>
