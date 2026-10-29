import {dequal} from 'dequal/lite'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {distinctUntilChanged, map} from 'rxjs'

import {usePresenceStore} from '../datastores'
import {type GlobalPresence} from './types'

type GlobalPresenceEntry = Pick<GlobalPresence, 'user' | 'locations'>

const initial: GlobalPresenceEntry[] = []

/** @internal */
export function useGlobalPresence(): GlobalPresenceEntry[] {
  const presenceStore = usePresenceStore()
  const presence$ = useMemo(
    () =>
      presenceStore.globalPresence$.pipe(
        map((presence) => presence.map(({user, locations}) => ({user, locations}))),
        distinctUntilChanged<GlobalPresenceEntry[]>(dequal),
      ),
    [presenceStore],
  )
  return useObservable(presence$, initial)
}
