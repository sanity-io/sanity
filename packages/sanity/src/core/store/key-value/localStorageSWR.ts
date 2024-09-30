import {isEqual} from 'lodash'
import {EMPTY, fromEvent, merge, of} from 'rxjs'
import {distinctUntilChanged, filter, map, share, tap} from 'rxjs/operators'

import {localStoreStorage} from './storage/localStoreStorage'
import {type GetKeyOptions, type KeyValueStore, type KeyValueStoreValue} from './types'

const storageEvent =
  typeof window === 'undefined' ? EMPTY : fromEvent<StorageEvent>(window, 'storage').pipe(share())

/**
 * Wraps a KeyValueStore and adds Stale-While-Revalidate (SWR) behavior to it
 */
export function withLocalStorageSWR(wrappedStore: KeyValueStore): KeyValueStore {
  function getKey(key: string, options?: GetKeyOptions) {
    const lsUpdates = options?.live
      ? storageEvent.pipe(
          filter((event) => event.key === key),
          map(() => localStoreStorage.getKey(key)),
        )
      : EMPTY

    return merge(of(localStoreStorage.getKey(key)), lsUpdates, wrappedStore.getKey(key)).pipe(
      distinctUntilChanged(isEqual),
      tap((value) => {
        localStoreStorage.setKey(key, value)
      }),
    )
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
