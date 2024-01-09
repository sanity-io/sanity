function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function* delay<T>(it: AsyncIterableIterator<T>, ms: number) {
  for await (const chunk of it) {
    await sleep(ms)
    yield chunk
  }
}
