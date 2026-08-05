import {type Mock, vi} from 'vitest'

type MockSanityClient = {
  fetch: Mock<(query: string) => Promise<unknown>>
  config: () => {projectId: string; apiHost: string}
  withConfig: Mock<() => MockSanityClient>
}
export function createMockSanityClient(): MockSanityClient {
  const fetch = vi.fn((query: string) => Promise.resolve(null))
  const client: MockSanityClient = {
    fetch,
    config: () => ({projectId: 'test-project', apiHost: 'https://api.sanity.io'}),
    withConfig: vi.fn(() => client),
  }
  return client
}
