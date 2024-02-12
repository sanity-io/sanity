import debug from './debug'

const MAX_RETRIES = 5
const BACKOFF_DELAY_BASE = 200

const exponentialBackoff = (retryCount: number) => Math.pow(2, retryCount) * BACKOFF_DELAY_BASE

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
    try {
      return await operation()
    } catch (err) {
      // Immediately rethrow if the error is not server-related.
      if (err.response && err.response.statusCode && err.response.statusCode < 500) {
        throw err
      }

      const retryDelay = exponentialBackoff(retryCount)
      debug(`Error encountered, retrying after ${retryDelay}ms: %s`, err.message)
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }

  throw new Error('Operation failed after all retries')
}

export default withRetry
