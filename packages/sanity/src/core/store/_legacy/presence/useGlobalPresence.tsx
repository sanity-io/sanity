import {useState, useEffect} from 'react'
import {usePresenceStore} from '../datastores'
import {GlobalPresence} from './types'

/** @internal */
export function useGlobalPresence(): GlobalPresence[] {
  const [presence, setPresence] = useState<GlobalPresence[]>([])
  const presenceStore = usePresenceStore()

  useEffect(() => {
    const subscription = presenceStore.globalPresence$.subscribe(setPresence)

    return () => {
      subscription.unsubscribe()
    }
  }, [presenceStore])

  return presence
}
