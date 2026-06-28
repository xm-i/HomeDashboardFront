/** 投資商品 */
export interface InvestmentProduct {
  investmentProductId: number
  name: string
  type: string
  category: string
  key: string
  enable: boolean
  currencyUnitId: number
  latestRate: number
  amount: number
  averageRate: number
}

/** 投資商品の詳細（保有量・レート履歴付き） */
export interface InvestmentProductDetail extends InvestmentProduct {
  investmentProductAmountList: InvestmentProductAmount[]
  investmentProductRateList: InvestmentProductRate[]
}

/** 投資商品の保有量明細 */
export interface InvestmentProductAmount {
  investmentProductId: number
  investmentProductAmountId: number
  tradingAccountLogo: string
  tradingAccountName: string
  date: string
  amount: number
  price: number
}

/** 投資商品のレート履歴 */
export interface InvestmentProductRate {
  date: string
  rate: number
}
