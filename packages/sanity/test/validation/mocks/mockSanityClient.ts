import {type Mock, vi} from 'vitest'

type MockSanityClient = {
  fetch: Mock<(query: string) => Promise<unknown>>
  withConfig: () => MockSanityClient
}
export function createMockSanityClient(): MockSanityClient {
  const fetch = vi.fn((query: string) => Promise.resolve(null))
  const client = {
    fetch,
    withConfig: () => client,
  }
  return client
}
