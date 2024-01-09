export async function* parseJSON(
  it: AsyncIterableIterator<string>,
): AsyncIterableIterator<unknown> {
  for await (const chunk of it) {
    yield JSON.parse(chunk)
  }
}

export async function* stringifyJSON(it: AsyncIterableIterator<unknown>) {
  for await (const chunk of it) {
    yield JSON.stringify(chunk)
  }
}
