/** 投資商品の保有量 */
export interface InvestmentProductAmount {
  investmentProductId: number
  investmentProductAmountId: number
  date: Date
  amount: number
  price: number
  latestRate: number
}
