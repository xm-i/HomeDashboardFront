/** 投資の通貨単位 */
export interface InvestmentCurrencyUnit {
  id: number
  name: string
  unit: string
  numberOfDecimalPoint: number
  latestRate: number
}
