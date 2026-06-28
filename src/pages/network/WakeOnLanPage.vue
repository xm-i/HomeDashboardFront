<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Panel from '@/components/common/Panel.vue'
import { Button } from '@/components/ui/button'
import { networkApi } from '@/services/network'
import type { WakeOnLanTarget } from '@/models/wake-on-lan-target.model'

/**
 * Wake on LAN ページ。
 * Angular 版 `WakeOnLanComponent` を移植する。
 * 機器一覧の表示・追加（モーダル）・削除と、マジックパケット送信を行う。
 */

/** MAC アドレスの形式バリデーション（Angular 版の pattern を移植） */
const macPattern = /^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$/

/** 送信対象の MAC アドレス */
const targetMacAddress = ref('')

/** 機器一覧 */
const targetList = ref<WakeOnLanTarget[]>([])

/** 追加モーダルの表示状態 */
const modalVisible = ref(false)

/** 簡易メッセージ（ng-zorro message の代替） */
const message = ref<{ type: 'success' | 'warning'; text: string } | null>(null)

/** 追加フォーム */
const form = reactive<{ deviceName: string; macAddress: string }>({
  deviceName: '',
  macAddress: '',
})

/** フォームが有効か（機器名必須・MAC アドレスは形式一致） */
const formValid = computed(
  () => form.deviceName.length > 0 && macPattern.test(form.macAddress),
)

/** 機器一覧を取得する */
async function getTargetList(): Promise<void> {
  targetList.value = (await networkApi.getWakeOnLanTargets()) ?? []
}

/** フォームをリセットする */
function resetForm(): void {
  form.deviceName = ''
  form.macAddress = ''
}

/** モーダルを開く */
function openModal(): void {
  resetForm()
  modalVisible.value = true
}

/** 追加をキャンセルする */
function cancelAddTarget(): void {
  resetForm()
  modalVisible.value = false
}

/** マジックパケットを送信する */
async function sendMagicPacket(): Promise<void> {
  if (!targetMacAddress.value) {
    return
  }
  message.value = null
  try {
    const ok = await networkApi.sendMagicPacket(targetMacAddress.value)
    message.value = ok
      ? { type: 'success', text: '送信成功' }
      : { type: 'warning', text: '送信失敗' }
  } catch (err) {
    console.error('マジックパケットの送信に失敗しました', err)
    message.value = { type: 'warning', text: '送信失敗' }
  }
}

/** 機器を追加する */
async function addTarget(): Promise<void> {
  message.value = null
  try {
    await networkApi.registerWakeOnLanTarget({
      macAddress: form.macAddress,
      deviceName: form.deviceName,
    })
  } catch (err) {
    console.error('機器の登録に失敗しました', err)
    message.value = { type: 'warning', text: '登録失敗' }
    return
  }
  message.value = { type: 'success', text: '登録成功' }
  resetForm()
  modalVisible.value = false
  await getTargetList()
}

/** 機器を削除する */
async function deleteTarget(target: WakeOnLanTarget): Promise<void> {
  try {
    await networkApi.deleteWakeOnLanTarget(target)
  } catch (err) {
    console.error('機器の削除に失敗しました', err)
    return
  }
  await getTargetList()
}

onMounted(async () => {
  try {
    await getTargetList()
  } catch (err) {
    console.error('機器一覧の取得に失敗しました', err)
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-lg font-semibold">マジックパケットを送信する。</h3>

    <div class="flex items-center gap-3">
      <Button @click="openModal">機器追加</Button>
      <span
        v-if="message"
        class="text-sm"
        :class="message.type === 'success' ? 'text-green-500' : 'text-yellow-500'"
      >
        {{ message.text }}
      </span>
    </div>

    <Panel>
      <table class="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-muted-foreground">
            <th class="w-28 p-2">選択</th>
            <th class="p-2">機器名</th>
            <th class="p-2">MACアドレス</th>
            <th class="w-28 p-2">削除</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in targetList" :key="item.macAddress" class="border-b border-border">
            <td class="p-2">
              <Button size="sm" @click="targetMacAddress = item.macAddress">選択</Button>
            </td>
            <td class="truncate p-2">{{ item.deviceName }}</td>
            <td class="p-2">{{ item.macAddress }}</td>
            <td class="p-2">
              <Button variant="outline" size="sm" @click="deleteTarget(item)">削除</Button>
            </td>
          </tr>
          <tr v-if="targetList.length === 0">
            <td colspan="4" class="p-4 text-center text-muted-foreground">機器がありません</td>
          </tr>
        </tbody>
      </table>
    </Panel>

    <!-- 送信用入力 -->
    <div class="flex items-center gap-2">
      <input
        v-model="targetMacAddress"
        type="text"
        placeholder="00:00:00:00:00:00"
        class="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
      />
      <Button size="lg" @click="sendMagicPacket">送信</Button>
    </div>

    <!-- 機器追加モーダル -->
    <div
      v-if="modalVisible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="cancelAddTarget"
    >
      <div class="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg">
        <h3 class="mb-4 text-lg font-semibold">機器追加</h3>
        <form class="flex flex-col gap-4" @submit.prevent="addTarget">
          <div class="flex flex-col gap-1.5">
            <label for="wol-device" class="text-sm text-muted-foreground">機器名</label>
            <input
              id="wol-device"
              v-model="form.deviceName"
              type="text"
              class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="wol-mac" class="text-sm text-muted-foreground">MACアドレス</label>
            <input
              id="wol-mac"
              v-model="form.macAddress"
              type="text"
              placeholder="00:00:00:00:00:00"
              class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" @click="cancelAddTarget">キャンセル</Button>
            <Button type="submit" :disabled="!formValid">追加</Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
