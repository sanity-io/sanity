import {type SanityClient} from '@sanity/client'
import {vi} from 'vitest'

import {type AccessRequest} from './types'

/**
 * Client stub routing by URL: `/access/requests/me` hits `list`, everything
 * else hits `submit`. `withConfig` returns itself so the Access API version
 * pinning is transparent.
 */
export function createClientStub(
  handlers: {
    list?: () => Promise<AccessRequest[] | null>
    submit?: () => Promise<unknown>
  } = {},
): SanityClient {
  const client = {
    request: vi.fn((options: {url: string}) =>
      options.url === '/access/requests/me'
        ? (handlers.list ?? (() => Promise.resolve([])))()
        : (handlers.submit ?? (() => Promise.resolve(null)))(),
    ),
    withConfig: vi.fn((): unknown => client),
  }
  // oxlint-disable-next-line no-unsafe-type-assertion -- test double; the rule is off for *.test.* files and this helper only feeds them
  return client as unknown as SanityClient
}

export function createAccessRequest(overrides: Partial<AccessRequest> = {}): AccessRequest {
  const createdAt = overrides.createdAt ?? new Date().toISOString()
  return {
    id: 'req-1',
    status: 'pending',
    resourceId: 'project-a',
    resourceType: 'project',
    createdAt,
    updatedAt: createdAt,
    updatedByUserId: 'user-2',
    requestedByUserId: 'user-1',
    type: 'access',
    note: '',
    ...overrides,
  }
}

/** An error shaped like `@sanity/client`'s ClientError for a given status/body. */
export function createApiError(statusCode: number, body: Record<string, unknown> = {}) {
  return Object.assign(new Error(`HTTP ${statusCode}`), {
    response: {statusCode, body},
  })
}
