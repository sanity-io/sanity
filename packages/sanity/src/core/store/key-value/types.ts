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
 * `useStudioPreference` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 * This type will be removed in Sanity Studio v7.
 */
export type KeyValueStoreValue = JsonPrimitive | JsonObject | JsonArray

/**
 * The current user's Studio preferences in the workspace's project. Only the Studio's own keys
 * are stored, and `setKey(key, null)` removes the user's value.
 *
 * @internal
 * @deprecated The Studio keeps its preferences through the App SDK now: use
 * `useStudioPreference` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 * This interface will be removed in Sanity Studio v7.
 */
export interface KeyValueStore {
  getKey(key: string): Observable<KeyValueStoreValue | null>
  setKey(key: string, value: KeyValueStoreValue): Promise<KeyValueStoreValue>
}
