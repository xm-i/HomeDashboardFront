import { http } from '@/lib/http'
import type { Asset } from '@/models/asset.model'
import type { Transaction } from '@/models/transaction.model'
import type {
  InvestmentProduct,
  InvestmentProductDetail,
} from '@/models/investment-product.model'
import type { InvestmentCurrencyUnit } from '@/models/investment-currency-unit.model'
import type { InvestmentAsset } from '@/models/investment-asset.model'
import type { TradingAccount } from '@/models/trading-account.model'
import type { TradingAccountDetail } from '@/models/trading-account-detail.model'

/**
 * 家計簿・投資の REST API。
 * Angular 版 `financial-api.service.ts`（FinancialApiService）のエンドポイントを移植。
 * 日付は全て "YYYY-MM-DD" 形式の文字列で渡す。
 */
export const financialApi = {
  /** 指定期間の資産一覧を取得する */
  getAssets: (from: string, to: string) =>
    http.get<Asset[]>('api/financial-api/get-assets', { params: { from, to } }),

  /** 指定期間の最新資産一覧を取得する */
  getLatestAsset: (from: string, to: string) =>
    http.get<Asset[]>('api/financial-api/get-latest-asset', { params: { from, to } }),

  /** 指定期間の取引明細を取得する */
  getTransactions: (from: string, to: string) =>
    http.get<Transaction[]>('api/financial-api/get-transactions', { params: { from, to } }),

  /** 指定期間の家計簿データ更新をリクエストし、進捗確認用のキーを取得する */
  postUpdateRequest: (from: string, to: string) =>
    http.post<{ key: string }>('api/financial-api/post-update-by-term-request', { from, to }),

  /** 更新リクエストの進捗（0〜100）を取得する */
  getUpdateStatus: (key: string) =>
    http.get<{ progress: number }>('api/financial-api/get-update-status', { params: { key } }),

  /** 投資商品を登録する */
  postRegisterInvestmentProduct: (
    name: string,
    type: string,
    category: string,
    currencyUnitId: number,
    key: string,
  ) =>
    http.post<{ result: boolean }>('api/financial-api/post-register-investment-product', {
      name,
      type,
      category,
      currencyUnitId,
      key,
    }),

  /** 投資商品の保有量を登録する */
  postRegisterInvestmentProductAmount: (
    investmentProductId: number,
    tradingAccountId: number,
    tradingAccountCategoryId: number,
    date: string,
    amount: number,
    price: number,
  ) =>
    http.post<{ result: boolean }>('api/financial-api/post-register-investment-product-amount', {
      investmentProductId,
      tradingAccountId,
      tradingAccountCategoryId,
      date,
      amount,
      price,
    }),

  /** 投資商品の詳細（保有量・レート履歴付き）を取得する */
  getInvestmentProductDetail: (investmentProductId: number) =>
    http.get<InvestmentProductDetail>('api/financial-api/get-investment-product-detail', {
      params: { investmentProductId },
    }),

  /** 投資商品一覧を取得する */
  getInvestmentProductList: () =>
    http.get<InvestmentProduct[]>('api/financial-api/get-investment-product-list'),

  /** 投資の通貨単位一覧を取得する */
  getInvestmentCurrencyUnitList: () =>
    http.get<InvestmentCurrencyUnit[]>('api/financial-api/get-investment-currency-unit-list'),

  /** 投資商品の種別一覧を取得する */
  getInvestmentProductTypeList: () =>
    http.get<string[]>('api/financial-api/get-investment-product-type-list'),

  /** 投資商品のカテゴリ一覧を取得する */
  getInvestmentProductCategoryList: () =>
    http.get<string[]>('api/financial-api/get-investment-product-category-list'),

  /** 指定期間の投資資産を取得する */
  getInvestmentAssets: (from: string, to: string) =>
    http.get<InvestmentAsset>('api/financial-api/get-investment-assets', { params: { from, to } }),

  /** 取引口座一覧を取得する */
  getTradingAccountList: () =>
    http.get<TradingAccount[]>('api/financial-api/get-trading-account-list'),

  /** 取引口座の詳細を取得する */
  getTradingAccountDetail: (tradingAccountId: number) =>
    http.get<TradingAccountDetail>('api/financial-api/get-trading-account-detail', {
      params: { tradingAccountId },
    }),
}
