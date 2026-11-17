import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'

import {useProjectStore} from '../../../../store/datastores'
import {hasDeployStudioGrant} from '../../../manifest/canDeployStudio'

const DISABLED$ = of(false)

/**
 * A hook that returns whether the current user can deploy the studio.
 *
 * @internal
 */
export function useCanDeployStudio(enabled: boolean = true): boolean {
  const projectStore = useProjectStore()

  // If the hook is disabled, don't subscribe to the observable
  const canDeploy$ = useMemo(
    () => (enabled ? projectStore.getGrants().pipe(map(hasDeployStudioGrant)) : DISABLED$),
    [enabled, projectStore],
  )

  return useObservable(canDeploy$, false)
}
