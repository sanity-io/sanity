import {createClient} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {createMediaLibraryClient} from '../createMediaLibraryClient'

function createTestClient(config: Record<string, unknown> = {}) {
  return createClient({
    projectId: 'abc123',
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
    ...config,
  })
}

describe('createMediaLibraryClient', () => {
  it('rewrites apiHost to the project subdomain and sets the media library resource', () => {
    const mlClient = createMediaLibraryClient(createTestClient(), 'ml123')
    const config = mlClient.config()

    expect(config.apiHost).toBe('https://abc123.api.sanity.io')
    expect(config.resource).toEqual({id: 'ml123', type: 'media-library'})
  })

  it('produces request URLs on the project host without a double slash', () => {
    // Setting `resource` makes @sanity/client ignore `useProjectHostname` and
    // build URLs from `apiHost` directly, so the rewritten host must be an
    // origin without a trailing slash.
    const mlClient = createMediaLibraryClient(createTestClient(), 'ml123')

    expect(mlClient.getUrl('/media-libraries/ml123/query')).toBe(
      'https://abc123.api.sanity.io/v2025-02-19/media-libraries/ml123/query',
    )
  })

  it('preserves custom API hosts (e.g. staging)', () => {
    const client = createTestClient({apiHost: 'https://api.sanity.work'})
    const mlClient = createMediaLibraryClient(client, 'ml123')

    expect(mlClient.config().apiHost).toBe('https://abc123.api.sanity.work')
  })

  it('drops any pathname configured on apiHost', () => {
    const client = createTestClient({apiHost: 'https://api.sanity.io/some/path'})
    const mlClient = createMediaLibraryClient(client, 'ml123')

    expect(mlClient.config().apiHost).toBe('https://abc123.api.sanity.io')
  })

  it('throws when the client has no projectId', () => {
    const client = createTestClient({projectId: undefined, useProjectHostname: false})

    expect(() => createMediaLibraryClient(client, 'ml123')).toThrow(
      'Cannot create Media Library client: missing projectId in client config',
    )
  })
})
