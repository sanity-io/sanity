export async function* filter<T>(
  it: AsyncIterableIterator<T>,
  predicate: (value: T) => boolean | Promise<boolean>,
) {
  for await (const chunk of it) {
    if (await predicate(chunk)) {
      yield chunk
    }
  }
}
