import {useEffect, useState} from 'react'

import {useClient} from '../../hooks'
import {type ConsentStatus, getTelemetryConsent$} from './telemetryConsent'

/**
 * Returns the current user's telemetry consent status.
 * The underlying API call is cached — multiple components using this hook
 * share a single request.
 *
 * @internal
 */
export function useTelemetryConsent(): ConsentStatus {
  const client = useClient({apiVersion: '2023-12-18'})
  const [status, setStatus] = useState<ConsentStatus>('loading')

  useEffect(() => {
    const sub = getTelemetryConsent$(client).subscribe({
      next: setStatus,
      error: () => setStatus('denied'),
    })
    return () => sub.unsubscribe()
  }, [client])

  return status
}
