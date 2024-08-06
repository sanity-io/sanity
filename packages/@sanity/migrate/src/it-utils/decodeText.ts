export async function* decodeText(it: AsyncIterableIterator<Uint8Array>) {
  const decoder = new TextDecoder()
  for await (const chunk of it) {
    yield decoder.decode(chunk, {stream: true})
  }
}
