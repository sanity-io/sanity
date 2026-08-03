import {useMemo} from 'react'
import {catchError, of} from 'rxjs'

import {useClient} from '../../hooks/useClient'
import {useDeferredObservableValue} from '../../util/useDeferredObservableValue'
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

  const consent$ = useMemo(
    () => getTelemetryConsent$(client).pipe(catchError(() => of('denied' as const))),
    [client],
  )

  return useDeferredObservableValue(consent$, 'loading')
}
