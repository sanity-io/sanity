import {useState, useEffect} from 'react'
import {GlobalPresence} from '../../presence/types'
import {globalPresence$} from './presence-store'

export function useGlobalPresence(): GlobalPresence[] {
  const [presence, setPresence] = useState<GlobalPresence[]>([])
  useEffect(() => {
    const subscription = globalPresence$.subscribe(setPresence)
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  return presence
}
