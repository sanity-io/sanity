import {type SanityClient} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {getProviders} from '../createLoginComponent'

interface MockClient {
  config: Record<string, unknown>
  request: ReturnType<typeof vi.fn>
  withConfig: (next: Record<string, unknown>) => MockClient
}

interface MockClientFactory {
  client: MockClient
  /** Configs captured at the moment each request was made. */
  requestConfigs: Array<Record<string, unknown>>
}

function createMockClient(initialConfig: Record<string, unknown>): MockClientFactory {
  const requestConfigs: Array<Record<string, unknown>> = []
  const make = (config: Record<string, unknown>): MockClient => {
    const client: MockClient = {
      config,
      request: vi.fn(() => {
        requestConfigs.push(client.config)
        return Promise.resolve({providers: [], thirdPartyLogin: true})
      }),
      withConfig: (next) => make({...client.config, ...next}),
    }
    return client
  }
  return {client: make(initialConfig), requestConfigs}
}

describe('getProviders', () => {
  it('requests /auth/providers without sending the auth credential', async () => {
    // Regression: when a Studio session expires, sending the now-stale token
    // (or session cookie) with /auth/providers causes the server to reject
    // the request, which surfaces as a generic "An error occurred" screen via
    // StudioErrorBoundary instead of routing the user back through the login
    // flow. /auth/providers is public, so the fix is to strip credentials —
    // an anonymous request can't trip the rejection path.
    const {client, requestConfigs} = createMockClient({
      token: 'expired-token',
      withCredentials: true,
    })

    await getProviders({
      client: client as unknown as SanityClient,
      mode: 'append',
      providers: [],
    })

    expect(requestConfigs).toHaveLength(1)
    expect(requestConfigs[0]?.token).toBeUndefined()
    expect(requestConfigs[0]?.withCredentials).toBe(false)
  })

  it('skips /auth/providers entirely in replace mode with a provider array', async () => {
    const {client, requestConfigs} = createMockClient({token: 'expired-token'})
    const customProviders = [{name: 'github', title: 'GitHub', url: 'https://example.com/login'}]

    const result = await getProviders({
      client: client as unknown as SanityClient,
      mode: 'replace',
      providers: customProviders,
    })

    expect(result).toEqual(customProviders)
    expect(requestConfigs).toHaveLength(0)
  })
})
