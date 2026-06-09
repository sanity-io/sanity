import {useEffect, useState} from 'react'

import {useClient} from '../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'

export function useRefValue(refId: string | undefined | null): Record<string, any> | undefined {
  const [value, setValue] = useState<Record<string, any> | undefined>(undefined)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  useEffect(() => {
    if (!refId) {
      return undefined
    }

    const subscription = client.observable
      .getDocument<Record<string, any>>(refId)
      .subscribe(setValue)

    return () => {
      subscription.unsubscribe()
    }
  }, [client, refId])

  // Always return undefined in the case of a falsey ref to prevent bug
  // when going from an ID to an undefined state
  return refId ? value : undefined
}
