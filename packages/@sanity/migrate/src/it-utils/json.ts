export async function* parseJSON(it: AsyncIterableIterator<string>) {
  for await (const chunk of it) {
    yield JSON.parse(chunk)
  }
}

export async function* stringifyJSON(it: AsyncIterableIterator<any>) {
  for await (const chunk of it) {
    yield JSON.stringify(chunk)
  }
}
