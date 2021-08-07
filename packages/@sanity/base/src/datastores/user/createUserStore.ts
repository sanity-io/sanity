// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {Observable, of, from, merge, defer, concat} from 'rxjs'
import {catchError, map, mergeMap, mapTo, switchMap, shareReplay, tap, take} from 'rxjs/operators'
import raf from 'raf'
import DataLoader from 'dataloader'
import authenticationFetcher from 'part:@sanity/base/authentication-fetcher'
import {observableCallback} from 'observable-callback'
import generateHelpUrl from '@sanity/generate-help-url'
import sanityClient from 'part:@sanity/base/client'
import {debugRolesParam$} from '../debugParams'
import {getDebugRolesByNames} from '../grants/debug'
import {User, CurrentUser, UserStore, CurrentUserSnapshot} from './types'

const client = sanityClient.withConfig({apiVersion: '2021-06-07'})

const [logout$, logout] = observableCallback()
const [refresh$, refresh] = observableCallback()

const userLoader = new DataLoader(
  (userIds: readonly string[]) =>
    fetchApiEndpoint<(User | null)[]>(`/users/${userIds.join(',')}`, {tag: 'users.get'})
      .then(arrayify)
      .then((response) => userIds.map((id) => response.find((user) => user?.id === id) || null)),
  {
    batchScheduleFn: (cb) => raf(cb),
  }
)

const debugRoles$ = debugRolesParam$.pipe(map(getDebugRolesByNames))

function fetchCurrentUser(): Observable<CurrentUser | null> {
  return defer(() => {
    const currentUserPromise = authenticationFetcher.getCurrentUser() as Promise<CurrentUser>
    userLoader.prime(
      'me',
      // @ts-expect-error although not reflected in typings, priming with a promise is indeed supported, see https://github.com/graphql/dataloader/issues/235#issuecomment-692495153 and this PR for fixing it https://github.com/graphql/dataloader/pull/252
      currentUserPromise.then((u) => (u ? normalizeOwnUser(u) : null))
    )
    return currentUserPromise
  }).pipe(
    tap((user) => {
      if (user) {
        // prime the data loader cache with the id of current user
        userLoader.prime(user.id, normalizeOwnUser(user))
      }
    }),
    mergeMap((user) =>
      concat(
        of(user),
        debugRoles$.pipe(
          map((debugRoles) => (debugRoles.length > 0 ? {...user, roles: debugRoles} : user))
        )
      )
    )
  )
}

const currentUser: Observable<CurrentUser | null> = merge(
  fetchCurrentUser(), // initial fetch
  refresh$.pipe(switchMap(() => fetchCurrentUser())), // re-fetch as response to request to refresh current user
  logout$.pipe(
    mergeMap(() => authenticationFetcher.logout()),
    mapTo(null)
  )
).pipe(shareReplay({refCount: true, bufferSize: 1}))

const normalizedCurrentUser = currentUser.pipe(
  map((user) => (user ? normalizeOwnUser(user) : user))
)

function fetchApiEndpoint<T>(endpoint: string, {tag}: {tag: string}): Promise<T> {
  return client.request({
    uri: endpoint,
    withCredentials: true,
    tag,
  })
}

function getUser(userId: string): Observable<User | null> {
  return userId === 'me' ? normalizedCurrentUser : from(userLoader.load(userId))
}

async function getUsers(ids: string[]): Promise<User[]> {
  const users = await userLoader.loadMany(ids)
  return users.filter(isUser)
}

function arrayify<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

function normalizeOwnUser(user: CurrentUser): User {
  return {
    id: user.id,
    displayName: user.name,
    imageUrl: user.profileImage,
  }
}

function isUser(thing: any): thing is User {
  return Boolean(typeof thing?.id === 'string')
}

const currentUserEvents = currentUser.pipe(
  map((user): CurrentUserSnapshot => ({type: 'snapshot', user})),
  catchError((error: Error) => of({type: 'error', error} as const))
)

let warned = false
function getDeprecatedCurrentUserEvents() {
  if (!warned) {
    console.warn(
      `userStore.currentUser is deprecated. Instead use \`userStore.me\`, which is an observable of the current user (or null if not logged in). ${generateHelpUrl(
        'studio-user-store-currentuser-deprecated'
      )}`
    )
    warned = true
  }
  return currentUserEvents
}

const observableApi = {
  me: currentUser,
  getCurrentUser: () => currentUser.pipe(take(1)),
  getUser: getUser,
  getUsers: (userIds: string[]) => from(getUsers(userIds)),
  get currentUser() {
    return getDeprecatedCurrentUserEvents()
  },
}

export default function createUserStore(): UserStore {
  return {
    actions: {logout, retry: refresh},
    me: currentUser,
    getCurrentUser() {
      return currentUser.pipe(take(1)).toPromise()
    },
    getUser(id: string) {
      return getUser(id).pipe(take(1)).toPromise()
    },
    getUsers,
    get currentUser() {
      return getDeprecatedCurrentUserEvents()
    },
    observable: observableApi,
  }
}
