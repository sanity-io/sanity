import {useState, useEffect} from 'react'
import {globalPresence$} from './presence-store'

export function useGlobalPresence() {
  const [presence, setPresence] = useState([])
  useEffect(() => {
    const subscription = globalPresence$.subscribe(setPresence)
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  return presence
}
