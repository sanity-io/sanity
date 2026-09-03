import {useObservable} from 'react-rx'

import {useProjectStore} from '../datastores'
import {type ProjectData} from './types'

/** @internal */
export function useProject(): ProjectData | null {
  const projectStore = useProjectStore()
  // No `initialValue` on purpose: react-rx then subscribes during render, so a
  // project already replayed by the shared store observable is rendered on the
  // very first frame instead of one commit later. That matters inside popovers,
  // where a late name would push the rest of the header down.
  return useObservable(projectStore.getProject()) ?? null
}
