import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'

import {useProjectStore} from '../../../store/datastores'

const PERMISSION_NAME = 'sanity.project.members'
const GRANT_NAME = 'invite'

interface UseCanInviteProjectMembersOptions {
  /**
   * Whether the hook is enabled and should request the grants from the server.
   * If disabled, the hook will return `false` immediately.
   * Defaults to `true`.
   */
  enabled?: boolean
}

/**
 * A hook that returns whether the current user can invite members to the project.
 *
 * @internal
 */
export function useCanInviteProjectMembers(opts?: UseCanInviteProjectMembersOptions) {
  const {enabled = true} = opts || {}
  const projectStore = useProjectStore()

  // Keep the observable identity stable across renders.
  //
  // Why it matters: once this hook has received an emission, react-rx
  // re-subscribes *replacement* observables during render (that is what
  // lets rebuild-every-render consumers converge instead of looping).
  // Stable identity = exactly one subscription for the hook's lifetime.
  //
  // The React Compiler usually memoizes this expression already. The
  // explicit `useMemo` keeps the guarantee even where the compiler bails.
  const canInvite$ = useMemo(() => {
    if (!enabled) return of(false)
    return projectStore.getGrants().pipe(
      map((grants) => {
        const permission = grants[PERMISSION_NAME]

        return !!permission?.some((p) => p.grants.some((g) => g.name === GRANT_NAME))
      }),
    )
  }, [enabled, projectStore])

  return useObservable(canInvite$, false)
}
