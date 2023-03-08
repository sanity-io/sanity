// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import debugIt from 'debug'
import config from 'config:sanity'
import {Observable, of, from, merge, defer, combineLatest} from 'rxjs'
import {
  catchError,
  map,
  mergeMap,
  mapTo,
  switchMap,
  shareReplay,
  tap,
  take,
  distinctUntilChanged,
  filter,
} from 'rxjs/operators'
import raf from 'raf'
import DataLoader from 'dataloader'
import authenticationFetcher from 'part:@sanity/base/authentication-fetcher'
import {observableCallback} from 'observable-callback'
import {generateHelpUrl} from '@sanity/generate-help-url'
import sanityClient from 'part:@sanity/base/client'
import {User, CurrentUser} from '@sanity/types'
import {debugRolesParam$} from '../debugParams'
import {authStateChangedInOtherWindow$, authStateChangedInThisWindow$} from '../authState/state'
import {getDebugRolesByNames} from '../grants/debug'
import {
  broadcastAuthStateChanged,
  clearToken,
  fetchToken,
  saveToken,
  authTokenIsAllowed,
} from '../authState'
import {UserStore, CurrentUserSnapshot} from './types'
import {consumeSessionId} from './sessionId'

const debug = debugIt('sanity:userstore')
const client = sanityClient.withConfig({apiVersion: '2021-06-07'})

const INTERNAL_USERS: User[] = [
  {
    id: '<system>',
    displayName: 'Sanity',
    imageUrl: 'https://public.sanity.io/logos/favicon-192.png',
  },
]

// Consume any session ID as early as possible (before mount) so we can remove it from the URL
let sid: string | null = consumeSessionId()
const projectId = config.api.projectId

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

INTERNAL_USERS.forEach((user) => userLoader.prime(user.id, user))

const debugRoles$ = debugRolesParam$.pipe(map(getDebugRolesByNames))

function fetchCurrentUser(): Observable<CurrentUser | null> {
  return defer(() => {
    debug('Fetching current user')
    const currentUserPromise = authenticationFetcher.getCurrentUser()
    userLoader.prime(
      'me',
      currentUserPromise.then((u) => (u ? normalizeOwnUser(u) : null))
    )
    return currentUserPromise
  }).pipe(
    switchMap((user) => {
      if (!authTokenIsAllowed() || user || (!user && !sid)) {
        debug(user ? `Received user with ID ${user.id}` : 'Received no user')

        // Nullify the session ID - in some cases (with multiple tabs/windows), we might
        // trigger a re-fetch of the authentication state, and do not want to treat a sid
        // from a previous session, successful login to be considered as the fresh one
        sid = null

        return of(user)
      }

      debug('Session ID present in URL, but no user received - fetching token')

      // Regardless of success or failure, we don't want to reuse the SID after this try
      const sessionId = sid
      sid = null

      // If we have consumed a session ID from the URL, we would expect a user to be returned,
      // as there should be a session cookie set. If (because of cookie restrictions or similar)
      // that is _not_ the case, exchange the SID for a token and persist it.
      return fetchToken(sessionId, client).pipe(
        switchMap(({token}) => {
          debug('Token received - storing in localStorage')

          // Save token to local storage
          saveToken({token, projectId})

          // Trigger local clients to be configured with token
          authStateChangedInThisWindow$.next(true)

          // Now try retrieving the user again
          debug('Re-fetching user with explicit authorization token')
          return authenticationFetcher.getCurrentUser()
        }),
        catchError((error) => {
          console.warn('Error fetching authentication token:', error)
          return of(null)
        })
      )
    }),
    tap((user) => {
      if (user) {
        // prime the data loader cache with the id of current user
        userLoader.prime(user.id, normalizeOwnUser(user))
      }
    }),
    mergeMap((user) =>
      debugRoles$.pipe(
        map((debugRoles) => (user && debugRoles.length > 0 ? {...user, roles: debugRoles} : user))
      )
    )
  )
}

const currentUser: Observable<CurrentUser | null> = merge(
  fetchCurrentUser().pipe(
    tap((user) => {
      if (!user) {
        clearToken(projectId)
      }

      debug('Current user fetched - %s', user ? 'found user' : 'no user')
    }),
    catchError((err) => {
      if (err.statusCode === 401) {
        clearToken(projectId)
        return of(null)
      }
      throw err
    })
  ), // initial fetch
  refresh$.pipe(
    tap(() => debug('Re-fetching current user in response to refresh request')),
    switchMap(() => fetchCurrentUser())
  ),
  logout$.pipe(
    tap(() => {
      debug('Logout triggered - clearing any local token')
      clearToken(projectId)
    }),
    mergeMap(() => authenticationFetcher.logout()),
    mapTo(null)
  )
).pipe(
  distinctUntilChanged<CurrentUser | null>((prev, current) => prev?.id === current?.id),
  tap((user) => {
    debug('Broadcasting auth state change, user ID: %s', user?.id || 'null')
    broadcastAuthStateChanged(user?.id || undefined)
  }),
  shareReplay({refCount: true, bufferSize: 1})
)

const updateFromRemote$ = combineLatest([currentUser, authStateChangedInOtherWindow$])
  .pipe(filter(([current, remote]) => current?.id !== remote?.id))
  .subscribe(() => {
    debug('Auth state changed in different window, refreshing locally')
    refresh()
  })

// In the case of hot module reloading, make sure we don't have dangling pointers
if (typeof module !== 'undefined' && module?.hot?.dispose) {
  module.hot.dispose(() => {
    updateFromRemote$.unsubscribe()
  })
}

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
