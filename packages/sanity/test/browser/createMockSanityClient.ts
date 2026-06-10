export function createMockSanityClient() {
  const _client = {
    fetch: (query: string) => Promise.resolve(null) as Promise<any>,
    withConfig: () => _client,
  }

  return _client
}
