import type {SanityClient} from '@sanity/client'
import type {Observable} from 'rxjs'
import {concat, defer, merge, of} from 'rxjs'
import {shareReplay, switchMapTo} from 'rxjs/operators'
import {readConfig, authTokenIsAllowed} from './config'
import {authStateChangedInOtherWindow$, authStateChangedInThisWindow$} from './state'
import * as storage from './storage'

// Project ID is part of the localStorage key so that different projects can store their separate tokens, and it's easier to do book keeping.
const getStorageKey = (projectId: string) => {
  if (!projectId) {
    throw new Error('Invalid project id')
  }
  return `__studio_auth_token_${projectId}`
}

export const saveToken = ({token, projectId}: {token: string; projectId: string}): void => {
  try {
    storage.set(getStorageKey(projectId), JSON.stringify({token, time: new Date().toISOString()}))
  } catch (err) {
    console.error(err)
  }
}

export const clearToken = (projectId: string): void => {
  try {
    storage.del(getStorageKey(projectId))
  } catch (err) {
    console.error(err)
  }
}

export const getToken = (projectId: string): string | null => {
  try {
    const item = storage.get(getStorageKey(projectId))
    if (item) {
      const {token}: {token: string} = JSON.parse(item)
      if (token && typeof token === 'string') {
        return token
      }
    }
  } catch (err) {
    console.error(err)
  }
  return null
}

export const fetchToken = (sid: string, client: SanityClient): Observable<{token: string}> => {
  return client.observable.request({
    method: 'GET',
    uri: `/auth/fetch`,
    query: {sid},
    tag: 'auth.fetch-token',
  })
}

// TODO: some kind of refresh mechanism here when we support refresh tokens / stamping?
const freshToken$ = defer(() => {
  if (!authTokenIsAllowed()) {
    return of(null)
  }

  const {projectId} = readConfig()
  if (!projectId) {
    throw new Error('No projectId configured')
  }
  return of(getToken(projectId))
})

export const authToken$ = defer(() =>
  concat(
    freshToken$,
    merge(authStateChangedInOtherWindow$, authStateChangedInThisWindow$).pipe(
      switchMapTo(freshToken$)
    )
  )
).pipe(shareReplay({bufferSize: 1, refCount: true}))
