/**
 * Staging rate-limits per IP, and CI regularly starts a dozen e2e runs (two dataset
 * creations each) within the same minute, so 429s during setup are contention rather than
 * failures. `@sanity/client` only retries network errors, so HTTP 429 (and transient 5xx)
 * responses are retried here with a wait that honors `Retry-After` when the API sends it.
 */
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504])
const DEFAULT_MAX_ATTEMPTS = 6
const BASE_DELAY_MS = 5_000
const MAX_DELAY_MS = 60_000

interface RetryOptions {
  log?: (message: string) => void
  maxAttempts?: number
  sleep?: (ms: number) => Promise<void>
}

interface HttpErrorLike {
  response?: {headers?: Record<string, string | string[] | undefined>}
  statusCode?: number
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export function getRetryDelayMs(error: unknown, attempt: number): number | undefined {
  const {response, statusCode} = (error ?? {}) as HttpErrorLike
  if (typeof statusCode !== 'number' || !RETRYABLE_STATUSES.has(statusCode)) return undefined

  const retryAfterHeader = response?.headers?.['retry-after']
  const retryAfter = Number(
    Array.isArray(retryAfterHeader) ? retryAfterHeader[0] : retryAfterHeader,
  )
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, MAX_DELAY_MS)
  }
  return Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS)
}

export async function withRateLimitRetry<T>(
  label: string,
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {log = console.warn, maxAttempts = DEFAULT_MAX_ATTEMPTS, sleep = defaultSleep} = options

  for (let attempt = 0; ; attempt += 1) {
    try {
      // oxlint-disable-next-line no-await-in-loop -- retries are sequential by definition
      return await operation()
    } catch (error) {
      const delayMs = getRetryDelayMs(error, attempt)
      if (delayMs === undefined || attempt + 1 >= maxAttempts) throw error

      const {statusCode} = error as HttpErrorLike
      log(
        `${label}: HTTP ${statusCode}, retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt + 2} of ${maxAttempts})`,
      )
      // oxlint-disable-next-line no-await-in-loop -- see above
      await sleep(delayMs)
    }
  }
}
