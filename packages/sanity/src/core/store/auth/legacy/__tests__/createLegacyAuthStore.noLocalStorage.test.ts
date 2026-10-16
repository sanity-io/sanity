import type * as SanityClientModule from '@sanity/client'
import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {firstValueFrom} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {_createLegacyAuthStore} from '../createLegacyAuthStore'

// The credentials `/auth/id` was asked with: the token, or `cookie`.
const askedWith = vi.hoisted(() => [] as string[])
vi.mock('@sanity/client', async (importOriginal) => ({
  ...(await importOriginal<typeof SanityClientModule>()),
  createClient: (config: SanityClientConfig) => ({
    request: () => {
      const credential = config.token ?? (config.withCredentials ? 'cookie' : 'none')
      askedWith.push(credential)
      return Promise.resolve({id: `user-for-${credential}`})
    },
  }),
}))

// A browser that blocks localStorage, as some private modes do: the store keeps its token in
// memory instead.
vi.mock('../../../../util/supportsLocalStorage', () => ({supportsLocalStorage: false}))

const clientFactory = (config: SanityClientConfig) =>
  ({config: () => config, request: vi.fn(() => new Promise(() => {}))}) as unknown as SanityClient

describe('createLegacyAuthStore: currentUserId without localStorage', () => {
  it('asks with the token the store holds in memory', async () => {
    const store = _createLegacyAuthStore({
      projectId: 'p-memory-token',
      dataset: 'production',
      loginMethod: 'token',
      clientFactory,
      getSessionId: () => undefined,
      consumeHashToken: () => 'hash-token',
    })

    expect(await firstValueFrom(store.currentUserId!)).toBe('user-for-hash-token')
    expect(askedWith).toEqual(['hash-token'])
  })
})
