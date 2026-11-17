import {type Mock, vi} from 'vitest'

type MockSanityClient = {
  fetch: Mock<(query: string, params?: Record<string, unknown>) => Promise<unknown>>
  getDataUrl: () => string
  request: Mock
  withConfig: () => MockSanityClient
}
export function createMockSanityClient(): MockSanityClient {
  const fetch = vi.fn((_query: string, _params?: Record<string, unknown>) => Promise.resolve(null))
  const client = {
    fetch,
    getDataUrl: () => '/doc',
    request: vi.fn(async () => ({omitted: []})),
    withConfig: () => client,
  }
  return client
}
