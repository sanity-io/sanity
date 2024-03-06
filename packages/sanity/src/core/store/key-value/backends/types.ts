import {type Observable} from 'rxjs'

import {type KeyValueStoreValue} from '../types'

export interface KeyValuePair {
  key: string
  value: KeyValueStoreValue | null
}

export interface Backend {
  getKey: (key: string, defValue: unknown) => Observable<unknown>
  setKey: (key: string, nextValue: unknown) => Observable<unknown>
  getKeys: (keys: string[], defValues: unknown[]) => Observable<unknown[]>
  setKeys: (keyValuePairs: KeyValuePair[]) => Observable<unknown[]>
}
