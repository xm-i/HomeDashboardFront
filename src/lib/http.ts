import { env } from '@/config/env'

/** クエリパラメータに指定できる値の型 */
type ParamValue = string | number | boolean | null | undefined

/** fetch のオプション拡張（クエリパラメータを追加できる） */
export interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  /** クエリ文字列に付与するパラメータ */
  params?: Record<string, ParamValue>
}

/**
 * fetch のレスポンスが異常系（ステータス 2xx 以外）の場合に投げるエラー。
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly statusText: string,
    readonly url: string,
  ) {
    super(`HTTP ${status} ${statusText} (${url})`)
    this.name = 'HttpError'
  }
}

/** ベースURL（末尾スラッシュを保証する） */
const baseUrl = env.apiUrl.endsWith('/') ? env.apiUrl : `${env.apiUrl}/`

/** path とクエリパラメータから完全な URL を組み立てる */
function buildUrl(path: string, params?: Record<string, ParamValue>): string {
  // 先頭スラッシュを除去してベースURL（末尾スラッシュ付き）に対する相対解決にする
  const url = new URL(path.replace(/^\//, ''), baseUrl)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    }
  }
  return url.toString()
}

/** 共通リクエスト処理。JSON の送受信とエラー時の throw を行う */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { params, headers, ...rest } = options
  const url = buildUrl(path, params)

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  })

  if (!response.ok) {
    throw new HttpError(response.status, response.statusText, url)
  }

  // 204 No Content / 空ボディは undefined を返す
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }

  return (await response.json()) as T
}

/**
 * 共通の HTTP クライアント（ブラウザ標準の fetch ベース）。
 * REST API 呼び出しは `src/services/` の各モジュールからこのクライアントを利用する。
 */
export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
}
