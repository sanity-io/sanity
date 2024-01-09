export async function toArray<T>(it: AsyncIterableIterator<T>): Promise<T[]> {
  const result: T[] = []
  for await (const chunk of it) {
    result.push(chunk)
  }
  return result
}
