/** 取引口座の詳細 */
export interface TradingAccountDetail {
  tradingAccountName: string
  tradingAccountLogo: string
  tradingAccountDetailAmountSummaryList: TradingAccountDetailAmountSummary[]
  tradingAccountDetailAmountList: TradingAccountDetailAmount[]
}

/** 取引口座の保有量サマリ */
export interface TradingAccountDetailAmountSummary {
  investmentProductId: number
  name: string
  key: string
  type: string
  category: string
  currencyUnitId: number
  enable: boolean
  amount: number
  averageRate: number
  latestRate: number
  tradingAccountCategoryDetailAmountList: TradingAccountCategoryDetailAmount[]
}

/** 取引口座の保有量明細 */
export interface TradingAccountDetailAmount {
  tradingAccountCategoryName: string
  investmentProductId: number
  investmentProductName: string
  investmentProductAmountId: number
  currencyUnitId: number
  date: Date
  amount: number
  price: number
  /** 現在価格（API が返す最新レート。損益計算に利用） */
  latestRate: number
}

/** 取引口座カテゴリ別の保有量 */
export interface TradingAccountCategoryDetailAmount {
  tradingAccountCategoryName: string
  amount: number
  averageRate: number
}
