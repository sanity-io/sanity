import {useObservable} from 'react-rx'
import {map, of} from 'rxjs'

import {useProjectStore} from '../../../store/_legacy/datastores'

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

  const result$ = projectStore.getGrants().pipe(
    map((grants) => {
      const permission = grants[PERMISSION_NAME]

      return !!permission?.some((p) => p.grants.some((g) => g.name === GRANT_NAME))
    }),
  )

  // If the hook is disabled, don't subscribe to the observable
  const canInvite$ = enabled ? result$ : of(false)

  return useObservable(canInvite$, false)
}
