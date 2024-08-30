/* eslint-disable max-nested-callbacks */
import {type SanityDocument} from '@sanity/client'
import {type User} from '@sanity/types'
import {sortBy} from 'lodash'
import {useMemo, useRef} from 'react'
import {useObservable} from 'react-rx'
import {forkJoin, map, mergeMap, type Observable, of, switchMap} from 'rxjs'

import {
  type DocumentValuePermission,
  grantsPermissionOn,
  type ProjectData,
  useProjectStore,
  useUserStore,
} from '../store'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
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
export type UserListWithPermissionsHookValue = Loadable<UserWithPermission[]>

/**
 * @beta
 * @hidden
 */
export interface UserWithPermission extends User {
  granted: boolean
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

/**
 * @beta
 * Returns a list of users with the specified permission on the document.
 * If no document is provided it will return all as `granted: true`
 */
export function useUserListWithPermissions(
  opts: UserListWithPermissionsOptions,
): UserListWithPermissionsHookValue {
  const {documentValue, permission} = opts

  const cachedSystemGroupsRef = useRef<[] | null>(null)
  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const list$ = useMemo(() => {
    // 1. Get the project members and filter out the robot users
    const members$: Observable<ProjectData['members']> = projectStore
      .get()
      .pipe(map((res: ProjectData) => res.members?.filter((m) => !m.isRobot)))

    // 2. Map the members to users to get more data of the users such as displayName (used for filtering)
    const users$: Observable<UserWithPermission[]> = members$.pipe(
      switchMap(async (members) => {
        const ids = members.map(({id}) => id)
        const users = await userStore.getUsers(ids)
        return users
      }),
      map((res) =>
        res.map((user) => ({
          displayName: user.displayName,
          id: user.id,
          granted: false,
        })),
      ),
    )

    // 3. Get all the system groups. Use the cached response if it exists to avoid unnecessary requests.
    const cached = cachedSystemGroupsRef.current
    const systemGroup$ = cached ? of(cached) : client.observable.fetch('*[_type == "system.group"]')

    // 4. Check if the user has read permission on the document and set the `granted` property
    const grants$: Observable<UserWithPermission[]> = forkJoin([users$, systemGroup$]).pipe(
      mergeMap(async ([users, groups]) => {
        if (!cached) {
          cachedSystemGroupsRef.current = groups
        }

        const grantPromises = users?.map(async (user) => {
          const grants = groups.map((group: any) => {
            if (group.members.includes(user.id)) {
              return group.grants
            }

            return []
          })

          const flattenedGrants = [...grants].flat()
          const {granted} = await grantsPermissionOn(
            user.id,
            flattenedGrants,
            permission,
            documentValue,
          )

          return {
            ...user,
            granted: granted,
          }
        })

        const usersWithPermission = await Promise.all(grantPromises || [])

        return usersWithPermission
      }),
    )

    // 5. Sort the users alphabetically
    const $alphabetical: Observable<Loadable<UserWithPermission[]>> = grants$.pipe(
      map((res) => ({
        error: null,
        loading: false,
        data: sortBy(res, 'displayName'),
      })),
    )

    return $alphabetical
  }, [client.observable, documentValue, projectStore, userStore, permission])

  return useObservable(list$, INITIAL_STATE)
}
