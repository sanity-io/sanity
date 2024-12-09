import {isEqual} from 'lodash'
import {merge, of} from 'rxjs'
import {distinctUntilChanged, tap} from 'rxjs/operators'

import {localStoreStorage} from './storage/localStoreStorage'
import {type KeyValueStore, type KeyValueStoreValue} from './types'

/**
 * Wraps a KeyValueStore and adds Stale-While-Revalidate (SWR) behavior to it
 */
export function withLocalStorageSWR(wrappedStore: KeyValueStore): KeyValueStore {
  function getKey(key: string) {
    return merge(
      of(localStoreStorage.getKey(key)),
      wrappedStore.getKey(key).pipe(
        tap((wrappedStoreValue) => {
          localStoreStorage.setKey(key, wrappedStoreValue)
        }),
      ),
    ).pipe(distinctUntilChanged(isEqual))
  }
  function setKey(key: string, nextValue: KeyValueStoreValue) {
    localStoreStorage.setKey(key, nextValue)
    return wrappedStore.setKey(key, nextValue)
  }
  return {
    getKey,
    setKey,
  }
}
