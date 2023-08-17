import {useEffect, useState} from 'react'
import {useClient} from '../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'

export function useRefValue<T extends Record<string, any> = Record<string, any>>(
  refId: string | undefined | null,
): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  useEffect(() => {
    if (!refId) {
      return undefined
    }

    const subscription = client.observable.getDocument<T>(refId).subscribe(setValue)

    return () => {
      subscription.unsubscribe()
    }
  }, [client, refId])

  // Always return undefined in the case of a falsey ref to prevent bug
  // when going from an ID to an undefined state
  return refId ? value : undefined
}
