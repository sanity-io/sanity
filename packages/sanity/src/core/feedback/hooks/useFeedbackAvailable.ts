import {useEffect, useState} from 'react'

import {FEEDBACK_TUNNEL_URL} from '../feedbackClient'

/**
 * Checks whether the feedback tunnel is reachable (in case if sentry or service is down).
 * This is a work around for the fact we don't have a way of feature flagging this
 * So if we need to this form in the future, for one reason or another, we can do it this way.
 *
 * Returns `true` when reachable, `false` when blocked, `null` while the check is in flight.
 *
 * @internal
 */
export function useFeedbackAvailable(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    fetch(FEEDBACK_TUNNEL_URL, {method: 'HEAD', mode: 'no-cors'})
      .then(() => setAvailable(true))
      .catch(() => setAvailable(false))
  }, [])

  return available
}
