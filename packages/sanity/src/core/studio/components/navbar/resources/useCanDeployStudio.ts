import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'

import {useProjectStore} from '../../../../store/datastores'
import {hasDeployStudioGrant} from '../../../manifest/canDeployStudio'

// Module-level so the disabled branch keeps a stable observable identity —
// react-rx keys its store on identity, and a fresh `of(false)` per render
// turns `useObservable`'s deferred pass into a self-sustaining render loop.
const DISABLED$ = of(false)

/**
 * A hook that returns whether the current user can deploy the studio.
 *
 * @internal
 */
export function useCanDeployStudio(enabled: boolean = true): boolean {
  const projectStore = useProjectStore()

  const result$ = useMemo(
    () => projectStore.getGrants().pipe(map(hasDeployStudioGrant)),
    [projectStore],
  )

  // If the hook is disabled, don't subscribe to the observable
  const canDeploy$ = enabled ? result$ : DISABLED$

  return useObservable(canDeploy$, false)
}
