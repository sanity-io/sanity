export async function* split(
  it: AsyncIterableIterator<string>,
  delimiter: string,
): AsyncIterableIterator<string> {
  let buf = ''
  for await (const chunk of it) {
    buf += chunk
    if (buf.includes(delimiter)) {
      const lastIndex = buf.lastIndexOf(delimiter)
      const parts = buf.substring(0, lastIndex).split(delimiter)

      for (const part of parts) {
        yield part
      }
      buf = buf.substring(lastIndex + delimiter.length)
    }
  }
  yield buf
}
