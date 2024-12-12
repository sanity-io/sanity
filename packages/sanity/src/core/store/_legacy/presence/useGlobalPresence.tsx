import {startTransition, useEffect, useState} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'

import {usePresenceStore} from '../datastores'
import {type GlobalPresence} from './types'

const initial: GlobalPresence[] = []
const fallback = of(initial)

/** @internal */
export function useGlobalPresence(): GlobalPresence[] {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => startTransition(() => setReady(true)))
    return () => clearTimeout(timeout)
  }, [])
  const presenceStore = usePresenceStore()

  return useObservable(ready ? presenceStore.globalPresence$ : fallback, initial)
}
