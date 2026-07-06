import {type ClientConfig as SanityClientConfig, type SanityClient} from '@sanity/client'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createAuthStore} from '../createAuthStore'

// Mock supportsLocalStorage to return true so createBroadcastStorage uses localStorage.
// In jsdom/Node.js it returns false because process.versions.node is defined.
vi.mock('../../../util/supportsLocalStorage', () => ({
  supportsLocalStorage: true,
}))

/**
 * A no-op client factory. All test cases in this file share the exact same
 * function reference/source, so `clientFactory` never contributes to
 * `canonicalHash` differences between calls — only the explicitly varied
 * option (e.g. `dataset`) does.
 */
const noopClientFactory = (_options: SanityClientConfig): SanityClient =>
  ({
    request: () => Promise.resolve({}),
  }) as unknown as SanityClient

/**
 * Regression coverage for https://github.com/sanity-io/sanity/issues/12794
 * ("Presentation tool writes sanity.previewUrlSecret to wrong dataset in
 * multi-workspace hosted Studio").
 *
 * `createAuthStore` is memoized process-wide via lodash `memoize`, keyed by
 * `canonicalHash(options)` (see createAuthStore.ts). Every source's `client`
 * (used by `useClient`/`getClient`, and therefore by the Presentation tool's
 * `create-preview-secret.ts`) comes from that store's `state.client`
 * (see prepareConfig.tsx `resolveSource`). If two workspaces with different
 * `dataset`s ever resolved to the *same* memoized AuthStore, they'd share the
 * same underlying client — reproducing exactly the reported symptom (writes
 * always land in one dataset, regardless of the active workspace).
 *
 * These tests assert the memo key stays isolated per `dataset`/`projectId`,
 * which is the one shared/global piece of state in this call chain that a
 * hosted-only cache collision could plausibly live in.
 */
describe('createAuthStore: memoization key isolation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('returns the exact same store instance for identical options (memoized)', () => {
    const projectId = `memo-test-${Math.random().toString(36).slice(2)}`

    const storeA = createAuthStore({
      projectId,
      dataset: 'production',
      loginMethod: 'cookie',
      clientFactory: noopClientFactory,
    })
    const storeB = createAuthStore({
      projectId,
      dataset: 'production',
      loginMethod: 'cookie',
      clientFactory: noopClientFactory,
    })

    expect(storeB).toBe(storeA)
  })

  it('returns different store instances for the same projectId but different datasets', () => {
    const projectId = `memo-test-${Math.random().toString(36).slice(2)}`

    const productionStore = createAuthStore({
      projectId,
      dataset: 'production',
      loginMethod: 'cookie',
      clientFactory: noopClientFactory,
    })
    const developmentStore = createAuthStore({
      projectId,
      dataset: 'development',
      loginMethod: 'cookie',
      clientFactory: noopClientFactory,
    })

    expect(
      developmentStore,
      'a different `dataset` must not collide onto the first-registered AuthStore/client',
    ).not.toBe(productionStore)
  })

  it('returns different store instances for the same dataset but different projectIds', () => {
    const dataset = 'production'
    const projectIdA = `memo-test-a-${Math.random().toString(36).slice(2)}`
    const projectIdB = `memo-test-b-${Math.random().toString(36).slice(2)}`

    const storeA = createAuthStore({
      projectId: projectIdA,
      dataset,
      loginMethod: 'cookie',
      clientFactory: noopClientFactory,
    })
    const storeB = createAuthStore({
      projectId: projectIdB,
      dataset,
      loginMethod: 'cookie',
      clientFactory: noopClientFactory,
    })

    expect(storeB).not.toBe(storeA)
  })
})
