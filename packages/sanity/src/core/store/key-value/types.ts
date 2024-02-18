import {type Observable} from 'rxjs'

type JsonObject = {[Key in string]: KeyValueStoreValue} & {
  [Key in string]?: KeyValueStoreValue | undefined
}
type JsonArray = KeyValueStoreValue[] | readonly KeyValueStoreValue[]
type JsonPrimitive = string | number | boolean | null

/** @internal */
export type KeyValueStoreValue = JsonPrimitive | JsonObject | JsonArray

/** @internal */
export interface KeyValueStore {
  getKey(key: string, defaultValue?: KeyValueStoreValue): Observable<KeyValueStoreValue | undefined>
  setKey(key: string, value: KeyValueStoreValue): void
}
