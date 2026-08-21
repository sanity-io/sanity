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
  // Why it matters: from react-rx v7 there is no render-phase warm-up at all,
  // so an observable rebuilt on every render is torn down and re-subscribed on
  // every render — and if it synchronously replays a value that differs from
  // the `initialValue`, every commit forces another render and the component
  // loops. Stable identity = exactly one subscription for the hook's lifetime.
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
