export type JSONParser<Type> = (line: string) => Type

export interface JSONOptions<Type> {
  parse?: JSONParser<Type>
}

export async function* parseJSON<Type>(
  it: AsyncIterableIterator<string>,
  {parse = JSON.parse}: JSONOptions<Type> = {},
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
