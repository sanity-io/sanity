export async function* filter<T>(it: AsyncIterableIterator<T>, predicate: (value: T) => boolean) {
  for await (const chunk of it) {
    if (predicate(chunk)) {
      yield chunk
    }
  }
}
