/* eslint-disable max-nested-callbacks */
import {type SanityDocument} from '@sanity/client'
import {type User} from '@sanity/types'
import {sortBy} from 'lodash'
import {useEffect, useMemo, useState} from 'react'
import {concat, forkJoin, map, mergeMap, type Observable, of, shareReplay, switchMap} from 'rxjs'

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

  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const [state, setState] = useState<UserListWithPermissionsHookValue>(INITIAL_STATE)

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
          granted: false,
        })),
      ),
    )

    // 3. Get all the system groups. Use the cached response if it exists to avoid unnecessary requests.
    const _systemGroup$ = client.observable.fetch('*[_type == "system.group"]').pipe(shareReplay(1))
    return [_users$, _systemGroup$]
  }, [client.observable, projectStore, userStore])

  const list$ = useMemo(() => {
    // 4. Check if the user has read permission on the document and set the `granted` property
    const grants$: Observable<UserWithPermission[]> = forkJoin([users$, systemGroup$]).pipe(
      mergeMap(async ([users, groups]) => {
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

        return await Promise.all(grantPromises || [])
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
  }, [documentValue, permission, users$, systemGroup$])

  useEffect(() => {
    const initial$ = of(INITIAL_STATE)
    const state$ = concat(initial$, list$)

    const sub = state$.subscribe({
      next: setState,
      error: (error) => {
        setState({data: [], error, loading: false})
      },
    })

    return () => {
      sub.unsubscribe()
    }
  }, [list$])

  return state
}
