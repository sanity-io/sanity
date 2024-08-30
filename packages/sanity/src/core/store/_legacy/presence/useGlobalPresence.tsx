// import {useEffect, useState} from 'react'
import {useObservable} from 'react-rx'

import {usePresenceStore} from '../datastores'
import {type GlobalPresence} from './types'

/** @internal */
export function useGlobalPresence(): GlobalPresence[] {
  // const [presence, setPresence] = useState<GlobalPresence[]>([])
  const presenceStore = usePresenceStore()
  return useObservable(presenceStore.globalPresence$, [])

  // useEffect(() => {
  //   const subscription = presenceStore.globalPresence$.subscribe(setPresence)

  //   return () => {
  //     subscription.unsubscribe()
  //   }
  // }, [presenceStore])

  // return presence
}
