import {split} from './split'
import {decodeText} from './decodeText'
import {parseJSON} from './json'
import {filter} from './filter'

export function ndjson(it: AsyncIterableIterator<Uint8Array>) {
  return parseJSON(filter(split(decodeText(it), '\n'), (line) => Boolean(line && line.trim())))
}
