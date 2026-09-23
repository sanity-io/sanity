import {of} from 'rxjs'
import {type Mock, vi} from 'vitest'

type MockSanityClient = {
  fetch: Mock<(query: string) => Promise<unknown>>
  getDataUrl: () => string
  observable: {request: Mock}
  withConfig: () => MockSanityClient
}
export function createMockSanityClient(): MockSanityClient {
  const fetch = vi.fn((query: string) => Promise.resolve(null))
  const client = {
    fetch,
    getDataUrl: () => '/doc',
    observable: {request: vi.fn(() => of({omitted: []}))},
    withConfig: () => client,
  }
  return client
}
