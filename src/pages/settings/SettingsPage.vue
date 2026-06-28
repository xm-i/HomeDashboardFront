<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Panel from '@/components/common/Panel.vue'
import { Button } from '@/components/ui/button'
import { settingsApi } from '@/services/settings'
import type { Settings } from '@/models/settings.model'

/**
 * 設定ページ（MoneyForward 連携設定）。
 * Angular 版 `FinancialSettingsComponent` のフォームを移植する。
 * メール／パスワードは「変更されたフィールドのみ」を送信する（dirty 判定）。
 */

/** メールアドレス入力値 */
const mail = ref('')
/** パスワード入力値 */
const password = ref('')

/** 各フィールドがユーザーによって変更されたか（dirty 判定） */
const mailDirty = ref(false)
const passwordDirty = ref(false)

/** 送信中フラグ */
const submitting = ref(false)

/** 更新結果メッセージ（ng-zorro の message の代替） */
const message = ref<{ type: 'success' | 'warning'; text: string } | null>(null)

/** 初期表示時に現在の設定を読み込む */
onMounted(async () => {
  try {
    const settings = await settingsApi.getSettings()
    if (!settings) {
      return
    }
    mail.value = settings.moneyForwardId ?? ''
    // パスワードは取得しても表示しない（Angular 版と同様に空にする）
    password.value = ''
  } catch (err) {
    console.error('設定の取得に失敗しました', err)
  }
})

/** 設定を更新する */
async function onSubmit(): Promise<void> {
  const settings: Settings = {}
  if (mailDirty.value) {
    settings.moneyForwardId = mail.value
  }
  if (passwordDirty.value) {
    settings.moneyForwardPassword = password.value
  }

  submitting.value = true
  message.value = null
  try {
    await settingsApi.updateSettings(settings)
    message.value = { type: 'success', text: '更新成功' }
    // 送信後は dirty 状態をリセットする
    mailDirty.value = false
    passwordDirty.value = false
  } catch (err) {
    console.error('設定の更新に失敗しました', err)
    message.value = { type: 'warning', text: '更新失敗' }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <Panel>
      <form class="flex max-w-xl flex-col gap-4" @submit.prevent="onSubmit">
        <h3 class="text-lg font-semibold">MoneyForward</h3>

        <div class="flex flex-col gap-1.5">
          <label for="mf-mail" class="text-sm text-muted-foreground">メールアドレス</label>
          <input
            id="mf-mail"
            v-model="mail"
            type="text"
            autocomplete="username"
            class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            @input="mailDirty = true"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="mf-password" class="text-sm text-muted-foreground">パスワード</label>
          <input
            id="mf-password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            @input="passwordDirty = true"
          />
        </div>

        <div class="flex items-center gap-3">
          <Button type="submit" :disabled="submitting">更新</Button>
          <span
            v-if="message"
            class="text-sm"
            :class="message.type === 'success' ? 'text-green-500' : 'text-yellow-500'"
          >
            {{ message.text }}
          </span>
        </div>
      </form>
    </Panel>
  </div>
</template>
