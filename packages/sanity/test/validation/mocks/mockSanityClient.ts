import {jest} from '@jest/globals'

type MockSanityClient = {
  fetch: jest.Mock<(query: string) => Promise<unknown>>
  withConfig: () => MockSanityClient
}
export function createMockSanityClient(): MockSanityClient {
  const fetch = jest.fn((query: string) => Promise.resolve(null))
  const client = {
    fetch,
    withConfig: () => client,
  }
  return client
}
