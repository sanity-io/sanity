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
  // Why it matters: react-rx skips its render-phase warm-up subscription
  // only for the observable it saw on the hook's first render. A new
  // identity on a later render gets subscribed during render again — and
  // this hook renders inside a closed menu (mounted but hidden via
  // `<Activity>`), so identity churn would fire the grants request from
  // a hidden render.
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
