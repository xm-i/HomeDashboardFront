<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import ValueDisplay from './components/ValueDisplay.vue'
import InvestmentPortfolioChart from './components/InvestmentPortfolioChart.vue'
import InvestmentAssetTransitionChart from './components/InvestmentAssetTransitionChart.vue'
import { financialApi } from '@/services/financial'
import { jpyCurrencyId } from './utils/util'
import type {
  InvestmentProduct,
  InvestmentProductAmount,
  InvestmentProductRate,
} from '@/models/investment-product.model'
import type { InvestmentCurrencyUnit } from '@/models/investment-currency-unit.model'
import type { TradingAccount } from '@/models/trading-account.model'
import type { TradingAccountDetail } from '@/models/trading-account-detail.model'

/**
 * 投資ページ。
 * Angular 版 `InvestmentComponent` を移植する。
 * - Product / Account の 2 つの表示モードを持つ。
 * - 投資商品の追加・取得量登録・詳細表示をモーダルで行う。
 */

/** サマリー付きの口座詳細 */
interface TradingAccountDetailWithSummary extends TradingAccountDetail {
  totalValuation: number
  totalProfit: number
  rateOfReturn: number
}

/** 表示モード */
const viewType = ref<'product' | 'account'>('product')

/** 通貨単位一覧 */
const investmentCurrencyUnitList = ref<InvestmentCurrencyUnit[]>([])
/** 日本円単位 */
const yenCurrency = ref<InvestmentCurrencyUnit | null>(null)
/** 投資商品一覧 */
const investmentProductList = ref<InvestmentProduct[]>([])
/** 評価額 */
const totalValuation = ref<number | null>(null)
/** 収益率 */
const rateOfReturn = ref<number | null>(null)
/** 収益額 */
const totalProfit = ref<number | null>(null)
/** 投資商品タイプ一覧 */
const investmentProductTypeList = ref<string[]>([])
/** 投資商品カテゴリ一覧 */
const investmentProductCategoryList = ref<string[]>([])
/** 取引口座一覧 */
const tradingAccountList = ref<TradingAccount[]>([])

/** 簡易メッセージ（ng-zorro message の代替） */
const message = ref<{ type: 'success' | 'warning'; text: string } | null>(null)

/** 通貨単位 ID から単位を取得する（Angular firstOrDefaultPipe 相当） */
function currencyById(id: number): InvestmentCurrencyUnit | null {
  return investmentCurrencyUnitList.value.find((x) => x.id === id) ?? null
}

// ---- 投資商品追加モーダル ----
const addProductModalVisible = ref(false)
const addProductForm = reactive<{
  name: string
  category: string
  type: string
  currencyUnit: number | null
  key: string
}>({ name: '', category: '', type: '', currencyUnit: null, key: '' })

/** 投資商品追加フォームが有効か */
const addProductFormValid = computed(
  () =>
    addProductForm.name.length > 0 &&
    addProductForm.type.length > 0 &&
    addProductForm.category.length > 0 &&
    addProductForm.currencyUnit !== null &&
    addProductForm.key.length > 0,
)

// ---- 投資商品詳細モーダル ----
const viewingInvestmentProductDetail = ref<{
  investmentProduct: InvestmentProduct
  investmentProductAmountList: InvestmentProductAmount[]
  investmentProductRateList: InvestmentProductRate[]
} | null>(null)

// ---- 取得量登録モーダル ----
const addAmountModalProduct = ref<InvestmentProduct | null>(null)
const addAmountForm = reactive<{
  tradingAccountId: number | null
  tradingAccountCategoryId: number | null
  date: string
  amount: string
  price: string
}>({ tradingAccountId: null, tradingAccountCategoryId: null, date: '', amount: '', price: '' })

/** 選択中の取引口座 */
const selectedTradingAccount = computed<TradingAccount | null>(
  () => tradingAccountList.value.find((x) => x.tradingAccountId === addAmountForm.tradingAccountId) ?? null,
)

/** 取得量登録フォームが有効か（数値は数字を含むこと） */
const addAmountFormValid = computed(
  () =>
    addAmountForm.tradingAccountId !== null &&
    addAmountForm.tradingAccountCategoryId !== null &&
    addAmountForm.date.length > 0 &&
    /\d/.test(addAmountForm.amount) &&
    /\d/.test(addAmountForm.price),
)

// ---- 口座表示 ----
const selectedAccountId = ref<number | null>(null)
const selectedAccount = ref<TradingAccountDetailWithSummary | null>(null)
const expandSet = reactive<Set<number>>(new Set())

// 取引口座の変更で既定の預り区分を設定する
watch(
  () => addAmountForm.tradingAccountId,
  () => {
    const account = selectedTradingAccount.value
    if (!account) {
      return
    }
    const defaultCategory = account.tradingAccountCategories.find((x) => x.defaultFlag)
    addAmountForm.tradingAccountCategoryId = defaultCategory?.tradingAccountCategoryId ?? null
  },
)

// 取得量変更日の変更で取得単価を自動入力する
watch(
  () => addAmountForm.date,
  (value) => {
    if (!viewingInvestmentProductDetail.value || !value) {
      return
    }
    const rate = viewingInvestmentProductDetail.value.investmentProductRateList.find(
      (x) => dayjs(x.date).format('YYYY-MM-DD') === dayjs(value).format('YYYY-MM-DD'),
    )?.rate
    if (rate !== undefined) {
      addAmountForm.price = String(rate)
    }
  },
)

/** 投資商品一覧を取得し、サマリーを算出する */
async function getInvestmentProductList(): Promise<void> {
  investmentProductList.value = (await financialApi.getInvestmentProductList()) ?? []
  const list = investmentProductList.value
  totalValuation.value = list.reduce(
    (s, x) => s + x.latestRate * x.amount * (currencyById(x.currencyUnitId)?.latestRate ?? 0),
    0,
  )
  totalProfit.value = list.reduce(
    (s, x) =>
      s + (x.latestRate - x.averageRate) * x.amount * (currencyById(x.currencyUnitId)?.latestRate ?? 0),
    0,
  )
  rateOfReturn.value =
    (totalProfit.value / (totalValuation.value - totalProfit.value)) * 100
}

/** 口座詳細を取得し、サマリーを算出する */
async function getTradingAccountDetail(accountId: number): Promise<void> {
  const detail = (await financialApi.getTradingAccountDetail(accountId)) as TradingAccountDetailWithSummary
  const list = detail.tradingAccountDetailAmountSummaryList
  detail.totalValuation = list.reduce(
    (s, x) => s + x.latestRate * x.amount * (currencyById(x.currencyUnitId)?.latestRate ?? 0),
    0,
  )
  detail.totalProfit = list.reduce(
    (s, x) =>
      s + (x.latestRate - x.averageRate) * x.amount * (currencyById(x.currencyUnitId)?.latestRate ?? 0),
    0,
  )
  detail.rateOfReturn = (detail.totalProfit / (detail.totalValuation - detail.totalProfit)) * 100
  selectedAccount.value = detail
  expandSet.clear()
}

/** 口座選択の変更ハンドラ */
function onAccountChange(id: number): void {
  selectedAccountId.value = id
  void getTradingAccountDetail(id)
}

/** 投資商品を登録する */
async function addInvestmentProduct(): Promise<void> {
  message.value = null
  try {
    await financialApi.postRegisterInvestmentProduct(
      addProductForm.name,
      addProductForm.type,
      addProductForm.category,
      addProductForm.currencyUnit as number,
      addProductForm.key,
    )
  } catch (err: unknown) {
    console.error('投資商品の登録に失敗しました', err)
    message.value = { type: 'warning', text: '登録失敗' }
    return
  }
  message.value = { type: 'success', text: '登録成功' }
  resetAddProductForm()
  addProductModalVisible.value = false
  await getInvestmentProductList()
}

/** 投資商品追加フォームをリセットする */
function resetAddProductForm(): void {
  addProductForm.name = ''
  addProductForm.category = ''
  addProductForm.type = ''
  addProductForm.currencyUnit = null
  addProductForm.key = ''
}

/** 投資商品追加をキャンセルする */
function cancelAddInvestmentProduct(): void {
  resetAddProductForm()
  addProductModalVisible.value = false
}

/** 投資商品詳細を開く */
async function openInvestmentProductDetailModal(product: InvestmentProduct): Promise<void> {
  const detail = await financialApi.getInvestmentProductDetail(product.investmentProductId)
  viewingInvestmentProductDetail.value = {
    investmentProduct: detail,
    investmentProductAmountList: detail.investmentProductAmountList,
    investmentProductRateList: detail.investmentProductRateList,
  }
}

/** 投資商品詳細を閉じる */
function closeInvestmentProductDetail(): void {
  viewingInvestmentProductDetail.value = null
}

/** 取得量登録を開く */
function openAddAmountModal(): void {
  addAmountModalProduct.value = viewingInvestmentProductDetail.value?.investmentProduct ?? null
}

/** 取得量登録をキャンセルする */
function cancelAddInvestmentProductAmount(): void {
  addAmountForm.tradingAccountId = null
  addAmountForm.tradingAccountCategoryId = null
  addAmountForm.date = ''
  addAmountForm.amount = ''
  addAmountForm.price = ''
  addAmountModalProduct.value = null
}

/** 取得量を登録する */
async function addInvestmentProductAmount(): Promise<void> {
  if (addAmountModalProduct.value === null) {
    return
  }
  message.value = null
  try {
    await financialApi.postRegisterInvestmentProductAmount(
      addAmountModalProduct.value.investmentProductId,
      addAmountForm.tradingAccountId as number,
      addAmountForm.tradingAccountCategoryId as number,
      dayjs(addAmountForm.date).format('YYYY-MM-DD'),
      Number(addAmountForm.amount),
      Number(addAmountForm.price),
    )
  } catch (err: unknown) {
    console.error('取得量の登録に失敗しました', err)
    message.value = { type: 'warning', text: '登録失敗' }
    return
  }
  message.value = { type: 'success', text: '登録成功' }
  // 口座・預り区分・日付・取得単価は維持し、取得量のみクリアする
  addAmountForm.amount = ''
  addAmountModalProduct.value = null
}

/** 展開状態を切り替える */
function onExpandChange(id: number): void {
  if (expandSet.has(id)) {
    expandSet.delete(id)
  } else {
    expandSet.add(id)
  }
}

/** カテゴリ候補を追加する */
function addCategoryCandidate(value: string): void {
  if (value && !investmentProductCategoryList.value.includes(value)) {
    investmentProductCategoryList.value.push(value)
  }
}

/** 取得方式候補を追加する */
function addTypeCandidate(value: string): void {
  if (value && !investmentProductTypeList.value.includes(value)) {
    investmentProductTypeList.value.push(value)
  }
}

onMounted(async () => {
  try {
    investmentCurrencyUnitList.value = (await financialApi.getInvestmentCurrencyUnitList()) ?? []
    yenCurrency.value =
      investmentCurrencyUnitList.value.find((x) => x.id === jpyCurrencyId) ?? null
    await getInvestmentProductList()
    investmentProductTypeList.value = (await financialApi.getInvestmentProductTypeList()) ?? []
    investmentProductCategoryList.value =
      (await financialApi.getInvestmentProductCategoryList()) ?? []
    tradingAccountList.value = (await financialApi.getTradingAccountList()) ?? []
  } catch (err: unknown) {
    console.error('投資情報の取得に失敗しました', err)
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- 表示モード切替 -->
    <div class="inline-flex overflow-hidden rounded-md border border-border">
      <button
        type="button"
        class="px-3 py-1 text-sm"
        :class="viewType === 'product' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'"
        @click="viewType = 'product'"
      >
        Product
      </button>
      <button
        type="button"
        class="px-3 py-1 text-sm"
        :class="viewType === 'account' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'"
        @click="viewType = 'account'"
      >
        Account
      </button>
    </div>

    <span
      v-if="message"
      class="ml-2 text-sm"
      :class="message.type === 'success' ? 'text-green-500' : 'text-yellow-500'"
    >
      {{ message.text }}
    </span>

    <!-- Product 表示 -->
    <template v-if="viewType === 'product'">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <Button @click="addProductModalVisible = true">投資商品追加</Button>
        <div class="flex flex-wrap gap-4 text-sm">
          <div>
            収益額:
            <ValueDisplay :value="totalProfit ?? NaN" :investment-currency-unit="yenCurrency" />
          </div>
          <div>
            収益率:
            <ValueDisplay :value="rateOfReturn ?? NaN" type="percent" :investment-currency-unit="yenCurrency" />
          </div>
          <div>
            評価額:
            <ValueDisplay
              :value="totalValuation ?? NaN"
              type="static-price"
              :investment-currency-unit="yenCurrency"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div class="aspect-square">
          <InvestmentPortfolioChart
            :investment-product-list="investmentProductList"
            :investment-currency-unit-list="investmentCurrencyUnitList"
          />
        </div>
        <div class="aspect-square">
          <InvestmentAssetTransitionChart />
        </div>
      </div>

      <!-- 投資商品テーブル -->
      <div class="overflow-hidden rounded-lg border border-border">
        <table class="w-full text-sm">
          <thead class="bg-muted text-muted-foreground">
            <tr>
              <th class="px-2 py-1 text-left">名前</th>
              <th class="w-[130px] px-2 py-1 text-left">評価額</th>
              <th class="w-[130px] px-2 py-1 text-left">現在値<br />取得平均単価</th>
              <th class="w-[130px] px-2 py-1 text-left">損益額<br />(損益率)</th>
              <th class="w-[130px] px-2 py-1 text-left">詳細</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in investmentProductList"
              :key="item.investmentProductId"
              class="border-t border-border text-foreground"
            >
              <td class="px-2 py-1">{{ item.name }}</td>
              <td class="px-2 py-1">
                <ValueDisplay
                  :value="item.latestRate * item.amount"
                  type="static-price-with-yen"
                  :investment-currency-unit="currencyById(item.currencyUnitId)"
                />
              </td>
              <td class="px-2 py-1">
                <ValueDisplay
                  :value="item.latestRate"
                  type="static-price"
                  :investment-currency-unit="currencyById(item.currencyUnitId)"
                /><br />
                <ValueDisplay
                  :value="item.averageRate"
                  type="static-price"
                  :investment-currency-unit="currencyById(item.currencyUnitId)"
                  :adjust-number-of-decimal-point="2"
                />
              </td>
              <td class="px-2 py-1">
                <ValueDisplay
                  :value="(item.latestRate - item.averageRate) * item.amount"
                  :investment-currency-unit="currencyById(item.currencyUnitId)"
                /><br />
                <ValueDisplay :value="(item.latestRate / item.averageRate) * 100 - 100" type="percent" />
              </td>
              <td class="px-2 py-1">
                <Button size="sm" @click="openInvestmentProductDetailModal(item)">詳細</Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Account 表示 -->
    <template v-else>
      <div class="flex flex-col gap-4 xl:flex-row">
        <!-- 口座選択 -->
        <div class="flex flex-row flex-wrap gap-2 xl:w-48 xl:flex-col">
          <button
            v-for="account in tradingAccountList"
            :key="account.tradingAccountId"
            type="button"
            class="rounded-md border border-border px-3 py-1 text-sm"
            :class="
              selectedAccountId === account.tradingAccountId
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground'
            "
            @click="onAccountChange(account.tradingAccountId)"
          >
            {{ account.name }}
          </button>
        </div>

        <!-- 口座詳細 -->
        <div v-if="selectedAccount" class="flex-1 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <img
              :src="selectedAccount.tradingAccountLogo"
              :title="selectedAccount.tradingAccountName"
              class="max-h-[60px] max-w-[200px]"
            />
            <div class="flex flex-wrap gap-4 text-sm">
              <div>
                収益額:
                <ValueDisplay :value="selectedAccount.totalProfit" :investment-currency-unit="yenCurrency" />
              </div>
              <div>
                収益率:
                <ValueDisplay
                  :value="selectedAccount.rateOfReturn"
                  type="percent"
                  :investment-currency-unit="yenCurrency"
                />
              </div>
              <div>
                評価額:
                <ValueDisplay
                  :value="selectedAccount.totalValuation"
                  type="static-price"
                  :investment-currency-unit="yenCurrency"
                />
              </div>
            </div>
          </div>

          <h2 class="text-lg font-semibold">サマリー</h2>
          <div class="overflow-hidden rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead class="bg-muted text-muted-foreground">
                <tr>
                  <th class="px-2 py-1 text-left">名前</th>
                  <th class="w-[130px] px-2 py-1 text-left">購入量</th>
                  <th class="w-[130px] px-2 py-1 text-left">取得平均額</th>
                  <th class="w-[130px] px-2 py-1 text-left">現在価格</th>
                  <th class="w-[130px] px-2 py-1 text-left">評価額</th>
                  <th class="w-[130px] px-2 py-1 text-left">損益額<br />(損益率)</th>
                </tr>
              </thead>
              <tbody>
                <template
                  v-for="item in selectedAccount.tradingAccountDetailAmountSummaryList"
                  :key="item.investmentProductId"
                >
                  <tr
                    class="cursor-pointer border-t border-border text-foreground"
                    @click="onExpandChange(item.investmentProductId)"
                  >
                    <td class="px-2 py-1">
                      <span v-if="item.tradingAccountCategoryDetailAmountList.length > 0" class="mr-1">{{
                        expandSet.has(item.investmentProductId) ? '▼' : '▶'
                      }}</span>
                      {{ item.name }}
                    </td>
                    <td class="px-2 py-1">
                      <ValueDisplay :value="item.amount" type="amount" :adjust-number-of-decimal-point="4" />
                    </td>
                    <td class="px-2 py-1">
                      <ValueDisplay
                        :value="item.averageRate"
                        type="static-price"
                        :investment-currency-unit="currencyById(item.currencyUnitId)"
                      />
                    </td>
                    <td class="px-2 py-1">
                      <ValueDisplay
                        :value="item.latestRate"
                        type="static-price-with-yen"
                        :investment-currency-unit="currencyById(item.currencyUnitId)"
                      />
                    </td>
                    <td class="px-2 py-1">
                      <ValueDisplay
                        :value="item.latestRate * item.amount"
                        type="static-price-with-yen"
                        :investment-currency-unit="currencyById(item.currencyUnitId)"
                      />
                    </td>
                    <td class="px-2 py-1">
                      <ValueDisplay
                        :value="(item.latestRate - item.averageRate) * item.amount"
                        :investment-currency-unit="currencyById(item.currencyUnitId)"
                      /><br />
                      <ValueDisplay :value="(item.latestRate / item.averageRate) * 100 - 100" type="percent" />
                    </td>
                  </tr>
                  <template v-if="expandSet.has(item.investmentProductId)">
                    <tr
                      v-for="child in item.tradingAccountCategoryDetailAmountList"
                      :key="child.tradingAccountCategoryName"
                      class="border-t border-border bg-muted/30 text-foreground"
                    >
                      <td class="px-2 py-1 pl-8">{{ child.tradingAccountCategoryName }}</td>
                      <td class="px-2 py-1">
                        <ValueDisplay :value="child.amount" type="amount" :adjust-number-of-decimal-point="4" />
                      </td>
                      <td class="px-2 py-1">
                        <ValueDisplay
                          :value="child.averageRate"
                          type="static-price"
                          :investment-currency-unit="currencyById(item.currencyUnitId)"
                        />
                      </td>
                      <td class="px-2 py-1">
                        <ValueDisplay
                          :value="item.latestRate"
                          type="static-price-with-yen"
                          :investment-currency-unit="currencyById(item.currencyUnitId)"
                        />
                      </td>
                      <td class="px-2 py-1">
                        <ValueDisplay
                          :value="item.latestRate * child.amount"
                          type="static-price-with-yen"
                          :investment-currency-unit="currencyById(item.currencyUnitId)"
                        />
                      </td>
                      <td class="px-2 py-1">
                        <ValueDisplay
                          :value="(item.latestRate - child.averageRate) * child.amount"
                          :investment-currency-unit="currencyById(item.currencyUnitId)"
                        /><br />
                        <ValueDisplay :value="(item.latestRate / child.averageRate) * 100 - 100" type="percent" />
                      </td>
                    </tr>
                  </template>
                </template>
              </tbody>
            </table>
          </div>

          <h2 class="text-lg font-semibold">履歴</h2>
          <div class="overflow-hidden rounded-lg border border-border">
            <table class="w-full text-sm">
              <thead class="bg-muted text-muted-foreground">
                <tr>
                  <th class="w-[130px] px-2 py-1 text-left">預り区分</th>
                  <th class="px-2 py-1 text-left">名前</th>
                  <th class="w-[130px] px-2 py-1 text-left">日付</th>
                  <th class="w-[130px] px-2 py-1 text-left">取得単価</th>
                  <th class="w-[130px] px-2 py-1 text-left">取得量</th>
                  <th class="w-[130px] px-2 py-1 text-left">取得額</th>
                  <th class="w-[130px] px-2 py-1 text-left">現在価格<br />損益額<br />(損益率)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in selectedAccount.tradingAccountDetailAmountList"
                  :key="index"
                  class="border-t border-border text-foreground"
                >
                  <td class="px-2 py-1">{{ item.tradingAccountCategoryName }}</td>
                  <td class="px-2 py-1">{{ item.investmentProductName }}</td>
                  <td class="px-2 py-1">{{ dayjs(item.date).format('YYYY-MM-DD') }}</td>
                  <td class="px-2 py-1">
                    <ValueDisplay
                      :value="item.price"
                      type="static-price"
                      :investment-currency-unit="currencyById(item.currencyUnitId)"
                      :adjust-number-of-decimal-point="2"
                    />
                  </td>
                  <td class="px-2 py-1">{{ item.amount.toLocaleString() }}</td>
                  <td class="px-2 py-1">
                    <ValueDisplay
                      :value="item.price * item.amount"
                      type="static-price"
                      :investment-currency-unit="currencyById(item.currencyUnitId)"
                    />
                  </td>
                  <td class="px-2 py-1">
                    <ValueDisplay
                      :value="item.latestRate * item.amount"
                      type="static-price"
                      :investment-currency-unit="currencyById(item.currencyUnitId)"
                    /><br />
                    <ValueDisplay
                      :value="(item.latestRate - item.price) * item.amount"
                      :investment-currency-unit="currencyById(item.currencyUnitId)"
                    /><br />
                    <ValueDisplay :value="(item.latestRate / item.price) * 100 - 100" type="percent" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- 投資商品追加モーダル -->
    <div
      v-if="addProductModalVisible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="cancelAddInvestmentProduct"
    >
      <div class="w-full max-w-lg rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg">
        <h3 class="mb-4 text-lg font-semibold">投資商品情報登録モーダル</h3>
        <form class="flex flex-col gap-3" @submit.prevent="addInvestmentProduct">
          <div class="flex items-center gap-3">
            <label class="w-24 text-sm text-muted-foreground">名前</label>
            <input
              v-model="addProductForm.name"
              type="text"
              placeholder="Accenture"
              class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div class="flex items-center gap-3">
            <label class="w-24 text-sm text-muted-foreground">カテゴリ</label>
            <input
              v-model="addProductForm.category"
              list="category-candidates"
              type="text"
              placeholder="米国株式"
              class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              @change="addCategoryCandidate(addProductForm.category)"
            />
            <datalist id="category-candidates">
              <option v-for="c in investmentProductCategoryList" :key="c" :value="c" />
            </datalist>
          </div>
          <div class="flex items-center gap-3">
            <label class="w-24 text-sm text-muted-foreground">取得方式</label>
            <input
              v-model="addProductForm.type"
              list="type-candidates"
              type="text"
              placeholder="ScrapingService.Targets.YahooFinance"
              class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
              @change="addTypeCandidate(addProductForm.type)"
            />
            <datalist id="type-candidates">
              <option v-for="t in investmentProductTypeList" :key="t" :value="t" />
            </datalist>
          </div>
          <div class="flex items-center gap-3">
            <label class="w-24 text-sm text-muted-foreground">通貨単位</label>
            <select
              v-model="addProductForm.currencyUnit"
              class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option :value="null" disabled>米ドル</option>
              <option v-for="unit in investmentCurrencyUnitList" :key="unit.id" :value="unit.id">
                {{ unit.name }}
              </option>
            </select>
          </div>
          <div class="flex items-center gap-3">
            <label class="w-24 text-sm text-muted-foreground">キー情報</label>
            <input
              v-model="addProductForm.key"
              type="text"
              placeholder="ACN"
              class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" @click="cancelAddInvestmentProduct">キャンセル</Button>
            <Button type="submit" :disabled="!addProductFormValid">登録</Button>
          </div>
        </form>
      </div>
    </div>

    <!-- 投資商品詳細モーダル -->
    <div
      v-if="viewingInvestmentProductDetail"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeInvestmentProductDetail"
    >
      <div class="w-full max-w-3xl rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold">
            {{ viewingInvestmentProductDetail.investmentProduct.name }}
          </h3>
          <Button variant="outline" size="sm" @click="closeInvestmentProductDetail">閉じる</Button>
        </div>
        <Button class="mb-3" size="sm" @click="openAddAmountModal">取得量登録</Button>
        <div class="overflow-auto rounded-lg border border-border">
          <table class="w-full text-sm">
            <thead class="bg-muted text-muted-foreground">
              <tr>
                <th class="w-[130px] px-2 py-1 text-left">証券口座</th>
                <th class="w-[130px] px-2 py-1 text-left">日付</th>
                <th class="w-[130px] px-2 py-1 text-left">取得単価</th>
                <th class="w-[130px] px-2 py-1 text-left">取得量</th>
                <th class="w-[130px] px-2 py-1 text-left">取得額</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in viewingInvestmentProductDetail.investmentProductAmountList"
                :key="index"
                class="border-t border-border text-foreground"
              >
                <td class="px-2 py-1">
                  <img
                    :src="item.tradingAccountLogo"
                    :title="item.tradingAccountName"
                    class="max-h-[30px] max-w-[100px]"
                  />
                </td>
                <td class="px-2 py-1">{{ dayjs(item.date).format('YYYY-MM-DD') }}</td>
                <td class="px-2 py-1">
                  <ValueDisplay
                    :value="item.price"
                    type="static-price"
                    :investment-currency-unit="
                      currencyById(viewingInvestmentProductDetail.investmentProduct.currencyUnitId)
                    "
                    :adjust-number-of-decimal-point="2"
                  />
                </td>
                <td class="px-2 py-1">{{ item.amount.toLocaleString() }}</td>
                <td class="px-2 py-1">
                  <ValueDisplay
                    :value="item.price * item.amount"
                    type="static-price"
                    :investment-currency-unit="
                      currencyById(viewingInvestmentProductDetail.investmentProduct.currencyUnitId)
                    "
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 取得量登録モーダル -->
    <div
      v-if="addAmountModalProduct"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="cancelAddInvestmentProductAmount"
    >
      <div class="w-full max-w-lg rounded-lg border border-border bg-card p-6 text-card-foreground shadow-lg">
        <h3 class="mb-2 text-lg font-semibold">投資商品取得量登録モーダル</h3>
        <div class="mb-3 text-sm text-muted-foreground">{{ addAmountModalProduct.name }}</div>
        <form class="flex flex-col gap-3" @submit.prevent="addInvestmentProductAmount">
          <div class="flex items-center gap-3">
            <label class="w-28 text-sm text-muted-foreground">口座</label>
            <select
              v-model="addAmountForm.tradingAccountId"
              class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option :value="null" disabled>SBI証券</option>
              <option v-for="item in tradingAccountList" :key="item.tradingAccountId" :value="item.tradingAccountId">
                {{ item.name }}
              </option>
            </select>
          </div>
          <div class="flex items-center gap-3">
            <label class="w-28 text-sm text-muted-foreground">預り区分</label>
            <select
              v-model="addAmountForm.tradingAccountCategoryId"
              :disabled="!selectedTradingAccount"
              class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:opacity-50"
            >
              <option :value="null" disabled>預り区分</option>
              <option
                v-for="cat in selectedTradingAccount?.tradingAccountCategories ?? []"
                :key="cat.tradingAccountCategoryId"
                :value="cat.tradingAccountCategoryId"
              >
                {{ cat.tradingAccountCategoryName }}
              </option>
            </select>
          </div>
          <div class="flex items-center gap-3">
            <label class="w-28 text-sm text-muted-foreground">取得量変更日</label>
            <input
              v-model="addAmountForm.date"
              type="date"
              class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div class="flex items-center gap-3">
            <label class="w-28 text-sm text-muted-foreground">取得量</label>
            <input
              v-model="addAmountForm.amount"
              type="text"
              placeholder="100"
              class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div class="flex items-center gap-3">
            <label class="w-28 text-sm text-muted-foreground">取得単価</label>
            <input
              v-model="addAmountForm.price"
              type="text"
              placeholder="16.516"
              class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div class="text-sm text-muted-foreground">
            金額 : {{ (Number(addAmountForm.amount) * Number(addAmountForm.price)).toLocaleString() }}
          </div>
          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" @click="cancelAddInvestmentProductAmount">キャンセル</Button>
            <Button type="submit" :disabled="!addAmountFormValid">登録</Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
