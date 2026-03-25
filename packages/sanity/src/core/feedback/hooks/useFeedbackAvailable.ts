import {useEffect, useState} from 'react'

import {FEEDBACK_TUNNEL_URL} from '../feedbackClient'

/**
 * Checks whether the Sentry feedback tunnel is operational by sending
 * a minimal valid envelope (header only, no items — Sentry accepts it
 * with a 200 and creates nothing).
 *
 * @internal
 */
export function useFeedbackAvailable(dsn: string): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    // Minimal valid envelope (header only, no items)
    // eslint-disable-next-line camelcase
    const body = `${JSON.stringify({dsn, sent_at: new Date().toISOString()})}\n`

    fetch(FEEDBACK_TUNNEL_URL, {method: 'POST', mode: 'no-cors', body})
      .then(() => setAvailable(true))
      .catch(() => setAvailable(false))
  }, [dsn])

  return available
}
