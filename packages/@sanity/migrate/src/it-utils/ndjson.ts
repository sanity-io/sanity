import {split} from './split'
import {decode} from './decode'
import {parseJSON} from './json'
import {filter} from './filter'

export function ndjson(it: AsyncIterableIterator<Uint8Array>) {
  return parseJSON(filter(split(decode(it), '\n'), (line) => Boolean(line && line.trim())))
}
