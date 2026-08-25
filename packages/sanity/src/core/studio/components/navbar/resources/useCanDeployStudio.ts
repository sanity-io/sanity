import {useMemo} from 'react'
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

  // Keep the observable identity stable across renders (mirrors
  // useCanInviteProjectMembers).
  //
  // Why it matters: once this hook has received an emission, react-rx
  // re-subscribes *replacement* observables during render (that is what
  // lets rebuild-every-render consumers converge instead of looping).
  // Stable identity = exactly one subscription for the hook's lifetime.
  //
  // The React Compiler usually memoizes this expression already. The
  // explicit `useMemo` keeps the guarantee even where the compiler bails.
  const canDeploy$ = useMemo(() => {
    if (!enabled) return of(false)
    return projectStore.getGrants().pipe(map(hasDeployStudioGrant))
  }, [enabled, projectStore])

  return useObservable(canDeploy$, false)
}
