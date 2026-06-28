/** 取引口座 */
export interface TradingAccount {
  tradingAccountId: number
  name: string
  logo: string
  tradingAccountCategories: TradingAccountCategory[]
}

/** 取引口座のカテゴリ */
export interface TradingAccountCategory {
  tradingAccountCategoryId: number
  tradingAccountCategoryName: string
  defaultFlag: boolean
}
