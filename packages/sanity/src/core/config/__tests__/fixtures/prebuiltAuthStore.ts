import {createClient, type RequestHandler, type SanityClient} from '@sanity/client'

import {createMockAuthStore} from '../../../store/authStore/createMockAuthStore'
import {type AuthStore} from '../../../store/authStore/types'

export const passthroughRequestHandler: RequestHandler = (request, next) => next(request)

export function createBareClient(projectId = 'abc123'): SanityClient {
  return createClient({projectId, dataset: 'test', apiVersion: '2025-01-01', useCdn: false})
}

/**
 * The pre-built store shape under test: `createMockAuthStore` plus the
 * `logout` a store must have for the studio to complete a forced logout
 * (`createMockAuthStore` has none, which is why the gate skips it).
 */
export function createPrebuiltStore(
  client: SanityClient,
  extra: Partial<AuthStore> = {},
): AuthStore {
  return {
    ...createMockAuthStore({client, currentUser: null}),
    logout: () => Promise.resolve(),
    ...extra,
  }
}
