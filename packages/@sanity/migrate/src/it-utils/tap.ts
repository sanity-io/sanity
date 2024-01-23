export async function* tap<T>(it: AsyncIterableIterator<T>, interceptor: (value: T) => void) {
  for await (const chunk of it) {
    interceptor(chunk)
    yield chunk
  }
}
