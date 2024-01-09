export async function* map<T, U>(
  it: AsyncIterableIterator<T>,
  project: (value: T) => U,
): AsyncIterableIterator<U> {
  for await (const chunk of it) {
    yield project(chunk)
  }
}
