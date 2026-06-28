import type { Transaction } from './transaction.model'

/** 汎用の絞り込み条件インターフェース */
export interface Condition<T> {
  condition: (value: T) => boolean
}

/**
 * 取引明細の絞り込み条件。
 * Angular 版では linq を利用していたが、Vue 版ではネイティブ配列メソッドで実装する。
 */
export class TransactionCondition implements Condition<Transaction> {
  month: string | null = null
  largeCategory: string | null = null
  middleCategory: string | null = null
  largeCategories: string[] = []

  condition(value: Transaction): boolean {
    return (
      (this.month === null ? true : value.date.startsWith(this.month)) &&
      ((this.largeCategory !== null && this.middleCategory !== null) ||
      this.largeCategories.length === 0
        ? true
        : this.largeCategories.some((x) => x === value.largeCategory)) &&
      (this.largeCategory === null ? true : value.largeCategory === this.largeCategory) &&
      (this.middleCategory === null ? true : value.middleCategory === this.middleCategory)
    )
  }
}
