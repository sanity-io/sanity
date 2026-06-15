import {startTransition, useEffect, useReducer} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'

import {usePresenceStore} from '../datastores'
import {type GlobalPresence} from './types'

const initial: GlobalPresence[] = []
const fallback = of(initial)

/** @internal */
export function useGlobalPresence(): GlobalPresence[] {
  const [mounted, mount] = useReducer(() => true, false)
  // Using `startTransition` here ensures that rapid re-renders that affect the deps used by `usePresenceStore` delay the transition to `mounted=true`, thus avoiding creating websocket connections that will be closed immediately.
  useEffect(() => startTransition(mount), [])

  const presenceStore = usePresenceStore()
  return useObservable(mounted ? presenceStore.globalPresence$ : fallback, initial)
}
