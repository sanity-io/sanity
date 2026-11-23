/* oxlint-disable no-deprecated -- this module implements the deprecated key-value store */
import {type KeyValueStoreValue} from '../types'

export interface KeyValuePair {
  key: string
  value: KeyValueStoreValue | null
}
