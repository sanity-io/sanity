/* eslint-disable max-nested-callbacks */
import {useState, useEffect, useMemo} from 'react'
import {Observable, concat, forkJoin, map, mergeMap, of, switchMap} from 'rxjs'
import {SanityDocument} from '@sanity/client'
import {sortBy} from 'lodash'
import {Loadable, MentionOptionUser, MentionOptionsHookValue} from '../../types'
import {grantsPermissionOn} from './helpers'
import {
  useProjectStore,
  useUserStore,
  useClient,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  ProjectData,
} from 'sanity'

const INITIAL_STATE: MentionOptionsHookValue = {
  data: [],
  error: null,
  loading: true,
}

/**
 * @beta
 * @hidden
 */
export interface MentionHookOptions {
  documentValue: SanityDocument | null
}

let cachedSystemGroups: [] | null = null

/**
 * @beta
 * @hidden
 */
export function useMentionOptions(opts: MentionHookOptions): MentionOptionsHookValue {
  const {documentValue} = opts

  const projectStore = useProjectStore()
  const userStore = useUserStore()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

  const [state, setState] = useState<MentionOptionsHookValue>(INITIAL_STATE)

  const list$ = useMemo(() => {
    // 1. Get the project members and filter out the robot users
    const members$: Observable<ProjectData['members']> = projectStore
      .get()
      .pipe(map((res: ProjectData) => res.members?.filter((m) => !m.isRobot)))

    // 2. Map the members to users to get more data of the users such as displayName (used for filtering)
    const users$: Observable<MentionOptionUser[]> = members$.pipe(
      switchMap(async (members) => {
        const ids = members.map(({id}) => id)
        const users = await userStore.getUsers(ids)
        return users
      }),
      map((res) =>
        res.map((user) => ({
          displayName: user.displayName,
          id: user.id,
          canBeMentioned: false,
        })),
      ),
    )

    // 3. Get all the system groups. Use the cached response if it exists to avoid unnecessary requests.
    const cached = cachedSystemGroups
    const systemGroup$ = cached ? of(cached) : client.observable.fetch('*[_type == "system.group"]')

    // 4. Check if the user has read permission on the document and set the `canBeMentioned` property
    const grants$: Observable<MentionOptionUser[]> = forkJoin([users$, systemGroup$]).pipe(
      mergeMap(async ([users, groups]) => {
        if (!cached) {
          cachedSystemGroups = groups
        }

        const grantPromises = users?.map(async (user) => {
          const grants = groups.map((group: any) => {
            if (group.members.includes(user.id)) {
              return group.grants
            }

            return []
          })

          const flattenedGrants = [...grants].flat()
          const {granted} = await grantsPermissionOn(user, flattenedGrants, 'read', documentValue)

          return {
            ...user,
            canBeMentioned: granted,
          }
        })

        const usersWithPermission = await Promise.all(grantPromises || [])

        return usersWithPermission
      }),
    )

    // 5. Sort the users alphabetically
    const $alphabetical: Observable<Loadable<MentionOptionUser[]>> = grants$.pipe(
      map((res) => ({
        error: null,
        loading: false,
        data: sortBy(res, 'displayName'),
      })),
    )

    return $alphabetical
  }, [client.observable, documentValue, projectStore, userStore])

  useEffect(() => {
    const initial$ = of(INITIAL_STATE)
    const state$ = concat(initial$, list$)

    const sub = state$.subscribe(setState)

    return () => {
      sub.unsubscribe()
    }
  }, [list$])

  return state
}
