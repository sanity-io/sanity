import type * as SanityClientModule from '@sanity/client'
import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {BehaviorSubject, firstValueFrom} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type LoginMethod} from '../../../../config/auth/types'
import {getAuthTokenStorageKey} from '../constants'
import {_createLegacyAuthStore} from '../createLegacyAuthStore'

// The credentials `/auth/id` was asked with: the token, or `cookie`. `createAuthIdProbe` makes
// the request with a client of its own, from `createClient`.
const askedWith = vi.hoisted(() => [] as string[])
vi.mock('@sanity/client', async (importOriginal) => ({
  ...(await importOriginal<typeof SanityClientModule>()),
  createClient: (config: SanityClientConfig) => ({
    request: () => {
      const credential = config.token ?? (config.withCredentials ? 'cookie' : 'none')
      askedWith.push(credential)
      return credential === 'rejected-token'
        ? Promise.reject(Object.assign(new Error('Unauthorized'), {statusCode: 401}))
        : Promise.resolve({id: `user-for-${credential}`})
    },
  }),
}))

// The store and the probe read the stored token only where localStorage is supported.
vi.mock('../../../../util/supportsLocalStorage', () => ({supportsLocalStorage: true}))

const clientFactory = (config: SanityClientConfig) =>
  ({config: () => config, request: vi.fn(() => new Promise(() => {}))}) as unknown as SanityClient

function createDashboardStore(token$: BehaviorSubject<string | null>) {
  return _createLegacyAuthStore({
    projectId: 'p-dashboard',
    dataset: 'production',
    clientFactory,
    getSessionId: () => undefined,
    consumeHashToken: () => undefined,
    observeWorkbenchToken: () => token$,
    refreshWorkbenchToken: () => {},
  })
}

describe('createLegacyAuthStore: currentUserId in a dashboard', () => {
  it("asks /auth/id with the dashboard's token, and again when it changes", async () => {
    askedWith.length = 0
    const token$ = new BehaviorSubject<string | null>('first-token')
    const ids: (string | undefined)[] = []
    const subscription = createDashboardStore(token$).currentUserId!.subscribe((id) => ids.push(id))
    await vi.waitFor(() => expect(ids).toEqual(['user-for-first-token']))

    token$.next('second-token')

    await vi.waitFor(() => expect(ids).toEqual(['user-for-first-token', 'user-for-second-token']))
    expect(askedWith).toEqual(['first-token', 'second-token'])
    subscription.unsubscribe()
  })

  it('is undefined, without asking, while the dashboard is signed out', async () => {
    askedWith.length = 0
    const token$ = new BehaviorSubject<string | null>(null)

    expect(await firstValueFrom(createDashboardStore(token$).currentUserId!)).toBeUndefined()
    expect(askedWith).toEqual([])
  })

  it('is undefined for a token the project rejects', async () => {
    const token$ = new BehaviorSubject<string | null>('rejected-token')

    expect(await firstValueFrom(createDashboardStore(token$).currentUserId!)).toBeUndefined()
  })

  it('keeps the answer for a later subscriber, as when the menu opens after a hover', async () => {
    askedWith.length = 0
    const token$ = new BehaviorSubject<string | null>('kept-token')
    const currentUserId = createDashboardStore(token$).currentUserId!

    // The hover preload subscribes for the first answer only.
    expect(await firstValueFrom(currentUserId)).toBe('user-for-kept-token')
    // The menu opens after the request has settled.
    expect(await firstValueFrom(currentUserId)).toBe('user-for-kept-token')

    expect(askedWith).toEqual(['kept-token'])
  })
})

function createStandaloneStore(projectId: string, loginMethod: LoginMethod) {
  return _createLegacyAuthStore({
    projectId,
    dataset: 'production',
    loginMethod,
    clientFactory,
    getSessionId: () => undefined,
    consumeHashToken: () => undefined,
  })
}

function storeToken(projectId: string, token: string) {
  localStorage.setItem(getAuthTokenStorageKey(projectId), JSON.stringify({token}))
}

describe('createLegacyAuthStore: currentUserId by login method', () => {
  beforeEach(() => {
    localStorage.clear()
    askedWith.length = 0
  })

  it('asks with the stored token for dual', async () => {
    storeToken('p-dual-token', 'stored-token')
    const store = createStandaloneStore('p-dual-token', 'dual')

    expect(await firstValueFrom(store.currentUserId!)).toBe('user-for-stored-token')
    expect(askedWith).toEqual(['stored-token'])
  })

  it('asks with the cookie for dual when no token is stored', async () => {
    const store = createStandaloneStore('p-dual-cookie', 'dual')

    expect(await firstValueFrom(store.currentUserId!)).toBe('user-for-cookie')
    expect(askedWith).toEqual(['cookie'])
  })

  it('asks with the cookie for cookie, even when a token is stored', async () => {
    storeToken('p-cookie', 'stored-token')
    const store = createStandaloneStore('p-cookie', 'cookie')

    expect(await firstValueFrom(store.currentUserId!)).toBe('user-for-cookie')
    expect(askedWith).toEqual(['cookie'])
  })

  it('is undefined, without asking, for token when no token is stored', async () => {
    const store = createStandaloneStore('p-token', 'token')

    expect(await firstValueFrom(store.currentUserId!)).toBeUndefined()
    expect(askedWith).toEqual([])
  })
})
