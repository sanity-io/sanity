type Parser<Type> = (line: string) => Type

interface Options<Type> {
  parse?: Parser<Type>
}

export async function* parseJSON<Type>(
  it: AsyncIterableIterator<string>,
  {parse = JSON.parse}: Options<Type> = {},
): AsyncIterableIterator<Type> {
  for await (const chunk of it) {
    yield parse(chunk)
  }
}

export async function* stringifyJSON(it: AsyncIterableIterator<unknown>) {
  for await (const chunk of it) {
    yield JSON.stringify(chunk)
  }
}
