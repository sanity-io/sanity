export async function mapAsync<T, U>(
  it: AsyncIterableIterator<T>,
  project: (value: T) => Promise<U>,
  concurrency: number,
): Promise<AsyncIterable<U>> {
  // todo: convert to top level import when we can
  const {pMapIterable} = await import('p-map')

  return pMapIterable(it, (v) => project(v), {
    concurrency: concurrency,
  })
}
