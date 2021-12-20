export function createMockSanityClient() {
  const _client = {
    fetch: jest.fn((query: string) => Promise.resolve(null)) as jest.Mock<
      Promise<any>,
      [query: string]
    >,
    withConfig: () => _client,
  }

  return _client
}
