import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind のクラス名を条件付きで結合し、重複を解決するヘルパー。
 * shadcn-vue の各コンポーネントで利用する。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
