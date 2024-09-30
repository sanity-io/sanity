import {type Observable} from 'rxjs'

type JsonObject = {[Key in string]: KeyValueStoreValue} & {
  [Key in string]?: KeyValueStoreValue | undefined
}
type JsonArray = KeyValueStoreValue[] | readonly KeyValueStoreValue[]
type JsonPrimitive = string | number | boolean | null

export interface GetKeyOptions {
  /**
   * if `true` this setting will sync instantly (on a best-effort basis) if changed elsewhere
   * Note: this only syncs across tabs within the same browser for now
   * in the future we might include the semantics of `live` to mean that it's also live updated if changed remotely
   */
  live?: boolean
}
/** @internal */
export type KeyValueStoreValue = JsonPrimitive | JsonObject | JsonArray

/** @internal */
export interface KeyValueStore {
  getKey(key: string, options?: {live?: boolean}): Observable<KeyValueStoreValue | null>
  setKey(key: string, value: KeyValueStoreValue): Promise<KeyValueStoreValue>
}
