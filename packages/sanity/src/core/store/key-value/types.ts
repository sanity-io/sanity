/* oxlint-disable no-deprecated -- this module implements the deprecated key-value store */
import {type Observable} from 'rxjs'

type JsonObject = {[Key in string]: KeyValueStoreValue} & {
  [Key in string]?: KeyValueStoreValue | undefined
}
type JsonArray = KeyValueStoreValue[] | readonly KeyValueStoreValue[]
type JsonPrimitive = string | number | boolean | null

/**
 * @internal
 * @deprecated The Studio keeps its preferences through the App SDK now: use
 * `useStudioPreference` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`
 * instead. `KeyValueStoreValue` will be removed in Sanity Studio v7.
 */
export type KeyValueStoreValue = JsonPrimitive | JsonObject | JsonArray

/**
 * @internal
 * @deprecated The Studio keeps its preferences through the App SDK now: use
 * `useStudioPreference` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`
 * instead. `KeyValueStore` will be removed in Sanity Studio v7.
 */
export interface KeyValueStore {
  getKey(key: string): Observable<KeyValueStoreValue | null>
  setKey(key: string, value: KeyValueStoreValue): Promise<KeyValueStoreValue>
}
