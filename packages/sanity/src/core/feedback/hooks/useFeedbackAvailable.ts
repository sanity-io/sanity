import {useEffect, useState} from 'react'

import {FEEDBACK_TUNNEL_URL} from '../feedbackClient'

interface UseFeedbackAvailableOptions {
  dsn: string
  /** When `true`, skips the tunnel check and returns `false` immediately. Defaults to `false`. */
  skip?: boolean
}

/**
 * Checks whether the Sentry feedback tunnel is operational by sending
 * a minimal valid envelope (header only, no items — Sentry accepts it
 * with a 200 and creates nothing).
 *
 * @internal
 */
export function useFeedbackAvailable(options: UseFeedbackAvailableOptions): boolean | null {
  const {dsn, skip = false} = options
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    if (skip) {
      setAvailable(false)
      return
    }

    // eslint-disable-next-line camelcase
    const body = `${JSON.stringify({dsn, sent_at: new Date().toISOString()})}\n`

    fetch(FEEDBACK_TUNNEL_URL, {method: 'POST', body})
      // 200 → ok: envelope forwarded successfully
      // 400 → error: malformed envelope or missing DSN
      // 403 → error: invalid Sentry host
      // 502 → error: Sentry unreachable
      // catch → error: tunnel itself unreachable (ad blocker, network error)

      .then(async (response) => {
        setAvailable(response.ok)

        // Consume the body stream to free the underlying HTTP connection.
        // Without this, the unconsumed body keeps the H2/H3 stream open,
        // which can cause head-of-line blocking on multiplexed connections.
        await response.arrayBuffer().catch(() => undefined)
      })
      .catch(() => setAvailable(false))
  }, [dsn, skip])

  return available
}
