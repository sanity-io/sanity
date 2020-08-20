import {useState, useEffect} from 'react'
import {globalPresence$} from './presence-store'
import {GlobalPresence} from './types'

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
