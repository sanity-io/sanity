import {useEffect, useState} from 'react'
import {useClient} from '../../../hooks'

export function useRefValue<T = unknown>(refId: string | undefined | null): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined)
  const client = useClient()

  useEffect(() => {
    if (!refId) {
      return undefined
    }

    const subscription = client.observable.getDocument(refId).subscribe(setValue)

    return () => {
      subscription.unsubscribe()
    }
  }, [client, refId])

  // Always return undefined in the case of a falsey ref to prevent bug
  // when going from an ID to an undefined state
  return refId ? value : undefined
}
