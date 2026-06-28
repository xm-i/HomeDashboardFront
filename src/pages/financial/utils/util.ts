/**
 * Financial（家計簿・投資）ページ専用のユーティリティと定数。
 * Angular 版 `pages/financial/utils/util.ts` および `constants/constants.ts` から移植。
 */

/** 日本円の通貨単位 ID（Angular 版 `jpyCurrencyId`） */
export const jpyCurrencyId = 1

/**
 * マネーフォワードの取引大カテゴリ名から、固定カテゴリ配列のインデックスを取得する。
 * チャートの系列カラーを安定させるために利用する。
 * @param category 大カテゴリ名
 * @returns 固定配列内のインデックス（見つからない場合は -1）
 */
export function getMfTransactionLargeCategoryId(category: string): number {
  return [
    '保険',
    '税・社会保障',
    '特別な支出',
    '日用品',
    '衣服・美容',
    '食費',
    '水道・光熱費',
    '趣味・娯楽',
    'その他',
    '住宅',
    '通信費',
    '交通費',
    '健康・医療',
    '未分類',
    '教養・教育',
    '現金・カード',
    '交際費',
    '自動車',
    '収入',
  ].findIndex((x) => x === category)
}
