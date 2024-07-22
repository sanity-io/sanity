import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {usePresenceStore} from '../datastores'
import {type GlobalPresence} from './types'

/** @internal */
export function useGlobalPresence(): GlobalPresence[] {
  const presenceStore = usePresenceStore()
  const observable = useMemo(() => presenceStore.globalPresence$, [presenceStore])
  return useObservable(observable, [])
}
