import {useState, useEffect} from 'react'
import {useDatastores} from '../useDatastores'
import {GlobalPresence} from './types'

export function useGlobalPresence(): GlobalPresence[] {
  const [presence, setPresence] = useState<GlobalPresence[]>([])
  const {presenceStore} = useDatastores()

  useEffect(() => {
    const subscription = presenceStore.globalPresence$.subscribe(setPresence)

    return () => {
      subscription.unsubscribe()
    }
  }, [presenceStore])

  return presence
}
