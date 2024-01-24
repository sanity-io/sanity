import {split} from './split'
import {decodeText} from './decodeText'
import {type JSONOptions, parseJSON} from './json'
import {filter} from './filter'

export function ndjson<Type>(
  it: AsyncIterableIterator<Uint8Array>,
  options?: JSONOptions<Type>,
): AsyncIterableIterator<Type> {
  return parseJSON(
    filter(split(decodeText(it), '\n'), (line) => Boolean(line && line.trim())),
    options,
  )
}
