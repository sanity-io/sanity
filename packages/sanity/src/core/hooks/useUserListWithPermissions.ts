import {type SanityDocument} from '@sanity/client'
import {type User} from '@sanity/types'
import sortBy from 'lodash-es/sortBy.js'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  catchError,
  concat,
  forkJoin,
  map,
  mergeMap,
  type Observable,
  of,
  shareReplay,
  switchMap,
} from 'rxjs'

import {useProjectStore, useUserStore} from '../store/datastores'
import {grantsPermissionOn} from '../store/grants/grantsStore'
import {type DocumentValuePermission, type Grant} from '../store/grants/types'
import {type ProjectData} from '../store/project/types'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {getSystemGroups$} from '../util/getSystemGroups$'
import {useClient} from './useClient'

type Loadable<T> = {
  data: T | null
  error: Error | null
  loading: boolean
}

/**
 * @beta
 * @hidden
 */
export type UserListWithPermissionsHookValue = Loadable<UserWithPermission[]> & {
  /** when true, comments has mention feature disabled
   * @internal
   * */
  disabled?: boolean
}

/**
 * @beta
 * @hidden
 */
export interface UserWithPermission extends User {
  granted: boolean
  projectUserId?: string
}

const INITIAL_STATE: UserListWithPermissionsHookValue = {
  data: [],
  error: null,
  loading: true,
}

/**
 * @beta
 */
export interface UserListWithPermissionsOptions {
  documentValue: SanityDocument | null
  permission: DocumentValuePermission
}

async function hasPermissionFromAnyGrant(
  userId: string,
  grants: Grant[],
  permission: DocumentValuePermission,
  documentValue: SanityDocument | null,
): Promise<boolean> {
  if (!documentValue) {
    return true
  }

  const results = await Promise.all(
    grants.map(async (grant) => {
      try {
        const {granted} = await grantsPermissionOn(userId, [grant], permission, documentValue)
        return granted
      } catch {
        // Some grants cannot be evaluated client-side, such as filters using
        // `user::attributes()`. Fail closed for only the unevaluable grant.
        return false
      }
    }),
  )

  return results.some(Boolean)
}

/**
 * @beta
 * Returns a list of users with the specified permission on the document.
 * If no document is provided it will return all as `granted: true`
 */
export function useUserListWithPermissions(
  opts: UserListWithPermissionsOptions,
): UserListWithPermissionsHookValue {
  const {documentValue, permission} = opts

  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const [users$, systemGroup$] = useMemo(() => {
    // 1. Get the project members and filter out the robot users
    const members$: Observable<ProjectData['members']> = projectStore
      .get()
      .pipe(map((res: ProjectData) => res.members?.filter((m) => !m.isRobot)))
      .pipe(shareReplay(1))

    // 2. Map the members to users to get more data of the users such as displayName (used for filtering)
    const _users$: Observable<UserWithPermission[]> = members$.pipe(
      switchMap(async (members) => {
        const ids = members.map(({id}) => id)
        const users = await userStore.getUsers(ids)
        return users
      }),
      map((res) =>
        res.map((user) => ({
          displayName: user.displayName,
          id: user.id,
          sanityUserId: user.sanityUserId,
          granted: false,
        })),
      ),
    )

    // 3. Get all the system groups. Use the cached response if it exists to avoid unnecessary requests.
    const _systemGroup$ = getSystemGroups$(client.observable)
    return [_users$, _systemGroup$]
  }, [client.observable, projectStore, userStore])

  const state$ = useMemo(() => {
    // 4. Check if the user has read permission on the document and set the `granted` property
    const grants$: Observable<UserWithPermission[]> = forkJoin([users$, systemGroup$]).pipe(
      mergeMap(async ([users, groups]) => {
        const grantPromises = users?.map(async (user) => {
          const grants = groups.map((group: any) => {
            if (group.members?.includes(user.id)) {
              return group.grants
            }

            return []
          })

          const flattenedGrants = [...grants].flat()
          const granted = await hasPermissionFromAnyGrant(
            user.id,
            flattenedGrants,
            permission,
            documentValue,
          )

          return {
            ...user,
            granted,
          }
        })

        return await Promise.all(grantPromises || [])
      }),
    )

    // 5. Sort the users alphabetically
    return concat(
      of(INITIAL_STATE),
      grants$.pipe(
        map((res) => ({
          error: null,
          loading: false,
          data: sortBy(res, 'displayName'),
        })),
        catchError((error: Error) => of({data: [] as UserWithPermission[], error, loading: false})),
      ),
    )
  }, [documentValue, permission, users$, systemGroup$])

  return useObservable(state$, INITIAL_STATE)
}
