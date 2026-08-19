import {useObservable} from 'react-rx'

import {usePresenceStore} from '../datastores'
import {type GlobalPresence} from './types'

const initial: GlobalPresence[] = []

/** @internal */
export function useGlobalPresence(): GlobalPresence[] {
  const presenceStore = usePresenceStore()
  return useObservable(presenceStore.globalPresence$, initial)
}
