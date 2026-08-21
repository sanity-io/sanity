import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'

import {useProjectStore} from '../../../store/datastores'

const PERMISSION_NAME = 'sanity.project.members'
const GRANT_NAME = 'invite'

// Module-level so the disabled branch keeps a stable observable identity —
// react-rx keys its store on identity, and a fresh `of(false)` per render
// turns `useObservable`'s deferred pass into a self-sustaining render loop.
const DISABLED$ = of(false)

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

  const result$ = useMemo(
    () =>
      projectStore.getGrants().pipe(
        map((grants) => {
          const permission = grants[PERMISSION_NAME]

          return !!permission?.some((p) => p.grants.some((g) => g.name === GRANT_NAME))
        }),
      ),
    [projectStore],
  )

  // If the hook is disabled, don't subscribe to the observable
  const canInvite$ = enabled ? result$ : DISABLED$

  return useObservable(canInvite$, false)
}
