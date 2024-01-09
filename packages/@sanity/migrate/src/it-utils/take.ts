export async function* take<T>(it: AsyncIterableIterator<T>, count: number) {
  let i = 0
  for await (const chunk of it) {
    if (i++ >= count) return
    yield chunk
  }
}
