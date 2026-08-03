import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'

import {useProjectStore} from '../../../../store/datastores'
import {hasDeployStudioGrant} from '../../../manifest/canDeployStudio'

/**
 * A hook that returns whether the current user can deploy the studio.
 *
 * @internal
 */
export function useCanDeployStudio(enabled: boolean = true): boolean {
  const projectStore = useProjectStore()

  const result$ = projectStore.getGrants().pipe(map(hasDeployStudioGrant))

  // If the hook is disabled, don't subscribe to the observable
  const canDeploy$ = enabled ? result$ : of(false)

  return useObservable(canDeploy$, false)
}
