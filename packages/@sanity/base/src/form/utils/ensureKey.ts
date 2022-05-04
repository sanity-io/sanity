import {randomKey} from '../inputs/arrays/common/randomKey'

export function ensureKey(item: any) {
  return item._key ? item : {...item, _key: randomKey(12)}
}
