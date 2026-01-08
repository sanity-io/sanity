import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'

import {useProjectStore} from '../../../../store/_legacy/datastores'

const DEPLOY_STUDIO_PERMISSION = 'sanity.project'
const DEPLOY_STUDIO_GRANT = 'deployStudio'

/**
 * A hook that returns whether the current user can invite members to the project.
 *
 * @internal
 */
export function useCanDeployStudio(enabled: boolean = true): boolean {
  const projectStore = useProjectStore()

  const result$ = projectStore.getGrants().pipe(
    map((grants) => {
      const permission = grants[DEPLOY_STUDIO_PERMISSION]
      return !!permission?.some((p) => p.grants.some((g) => g.name === DEPLOY_STUDIO_GRANT))
    }),
  )

  // If the hook is disabled, don't subscribe to the observable
  const canDeploy$ = enabled ? result$ : of(false)

  return useObservable(canDeploy$, false)
}
