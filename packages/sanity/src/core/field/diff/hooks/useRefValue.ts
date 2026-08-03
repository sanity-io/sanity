import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {EMPTY} from 'rxjs'

import {useClient} from '../../../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'

export function useRefValue<T extends Record<string, any> = Record<string, any>>(
  refId: string | undefined | null,
): T | undefined {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const document$ = useMemo(
    () => (refId ? client.observable.getDocument<T>(refId) : EMPTY),
    [client, refId],
  )
  const value = useObservable(document$)

  // Always return undefined in the case of a falsey ref to prevent bug
  // when going from an ID to an undefined state
  return refId ? value : undefined
}
