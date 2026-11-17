import {type KeyValueStoreValue} from '../types'

export interface KeyValuePair {
  key: string
  value: KeyValueStoreValue | null
}
