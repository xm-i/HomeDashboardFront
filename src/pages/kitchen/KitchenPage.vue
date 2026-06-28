<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import Panel from '@/components/common/Panel.vue'
import { Button } from '@/components/ui/button'
import { kitchenApi } from '@/services/kitchen'
import type { Recipe } from '@/models/recipe.model'

/**
 * キッチン（レシピ管理）ページ。
 * Angular 版 `KitchenTopComponent` を移植する。
 * レシピ一覧の表示・追加（モーダル）・削除を行う。
 */

/** URL の簡易バリデーション（Angular 版の pattern を移植） */
const urlPattern = /(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})[/\w .-]*\/?/

/** レシピ一覧 */
const recipeList = ref<Recipe[]>([])

/** 追加モーダルの表示状態 */
const modalVisible = ref(false)

/** 簡易メッセージ（ng-zorro message の代替） */
const message = ref<{ type: 'success' | 'warning'; text: string } | null>(null)

/** 追加フォームの入力値 */
const form = reactive<{ url: string; title: string; imageUrl: string }>({
  url: '',
  title: '',
  imageUrl: '',
})

/** フォームが有効か（URL 必須・パターン一致、画像URL は任意だが入力時はパターン一致） */
const formValid = computed(() => {
  if (!form.url || !urlPattern.test(form.url)) {
    return false
  }
  if (form.imageUrl && !urlPattern.test(form.imageUrl)) {
    return false
  }
  return true
})

/** レシピ一覧を取得する */
async function getRecipeList(): Promise<void> {
  recipeList.value = (await kitchenApi.getRecipeList()) ?? []
}

/** フォームをリセットする */
function resetForm(): void {
  form.url = ''
  form.title = ''
  form.imageUrl = ''
}

/** モーダルを開く */
function openModal(): void {
  resetForm()
  modalVisible.value = true
}

/** 追加をキャンセルする */
function cancelAddRecipe(): void {
  resetForm()
  modalVisible.value = false
}

/** レシピを追加する */
async function addRecipe(): Promise<void> {
  message.value = null
  try {
    await kitchenApi.registerRecipe({
      id: null,
      url: form.url,
      imageUrl: form.imageUrl,
      title: form.title,
    })
  } catch (err) {
    console.error('レシピの登録に失敗しました', err)
    message.value = { type: 'warning', text: '登録失敗' }
    return
  }
  message.value = { type: 'success', text: '登録成功' }
  resetForm()
  modalVisible.value = false
  await getRecipeList()
}

/** レシピを削除する */
async function deleteRecipe(recipe: Recipe): Promise<void> {
  try {
    await kitchenApi.deleteRecipe(recipe)
  } catch (err) {
    console.error('レシピの削除に失敗しました', err)
    return
  }
  await getRecipeList()
}

onMounted(async () => {
  try {
    await getRecipeList()
  } catch (err) {
    console.error('レシピ一覧の取得に失敗しました', err)
  }
})
</script>

<template>
  <div class="flex flex-col gap-4 p-6">
    <div class="flex items-center gap-3">
      <Button @click="openModal">レシピ追加</Button>
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
            <th class="w-36 p-2">イメージ</th>
            <th class="p-2">タイトル</th>
            <th class="w-28 p-2">削除</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in recipeList" :key="item.url" class="border-b border-border align-middle">
            <td class="p-2">
              <img
                :src="item.imageUrl"
                :alt="item.title"
                class="max-h-[120px] max-w-[120px] rounded object-cover"
              />
            </td>
            <td class="p-2">
              <a
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary underline-offset-4 hover:underline"
              >
                {{ item.title }}
              </a>
            </td>
            <td class="p-2">
              <Button variant="outline" size="sm" @click="deleteRecipe(item)">削除</Button>
            </td>
          </tr>
          <tr v-if="recipeList.length === 0">
            <td colspan="3" class="p-4 text-center text-muted-foreground">レシピがありません</td>
          </tr>
        </tbody>
      </table>
    </Panel>

    <!-- レシピ追加モーダル -->
    <div
      v-if="modalVisible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="cancelAddRecipe"
    >
      <div class="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg">
        <h3 class="mb-4 text-lg font-semibold">レシピ追加</h3>
        <form class="flex flex-col gap-4" @submit.prevent="addRecipe">
          <div class="flex flex-col gap-1.5">
            <label for="recipe-url" class="text-sm text-muted-foreground">URL</label>
            <input
              id="recipe-url"
              v-model="form.url"
              type="text"
              placeholder="https://cookpad.com/recipe/4584848"
              class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="recipe-title" class="text-sm text-muted-foreground">タイトル</label>
            <input
              id="recipe-title"
              v-model="form.title"
              type="text"
              placeholder="入力しなければ自動取得"
              class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="recipe-image" class="text-sm text-muted-foreground">画像URL</label>
            <input
              id="recipe-image"
              v-model="form.imageUrl"
              type="text"
              placeholder="入力しなければ自動取得"
              class="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" @click="cancelAddRecipe">キャンセル</Button>
            <Button type="submit" :disabled="!formValid">追加</Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
