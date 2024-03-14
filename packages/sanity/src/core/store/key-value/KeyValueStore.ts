import {type SanityClient} from '@sanity/client'
import {merge, type Observable, Subject} from 'rxjs'
import {filter, map, shareReplay, switchMap, take} from 'rxjs/operators'

import {serverBackend} from './backends/server'
import {type KeyValueStore, type KeyValueStoreValue} from './types'

/** @internal */
export function createKeyValueStore({client}: {client: SanityClient}): KeyValueStore {
  const storageBackend = serverBackend({client})

  const setKey$ = new Subject<{key: string; value: KeyValueStoreValue}>()

  const updates$ = setKey$.pipe(
    switchMap((event) => {
      return storageBackend.setKey(event.key, event.value).pipe(
        map((nextValue) => ({
          key: event.key,
          value: nextValue,
        })),
      )
    }),
    shareReplay(1),
  )

  const getKey = (key: string): Observable<KeyValueStoreValue> => {
    return merge(
      storageBackend.getKey(key),
      updates$.pipe(
        filter((update) => update.key === key),
        map((update) => update.value),
      ),
    ) as Observable<KeyValueStoreValue>
  }

  const setKey = (key: string, value: KeyValueStoreValue): Observable<KeyValueStoreValue> => {
    setKey$.next({key, value})

    /*
     * The backend returns the result of the set operation, so we can just pass that along.
     * Most utils do not use it (they will take advantage of local state first) but it reflects the
     * backend function and could be useful for debugging.
     */
    return updates$.pipe(
      filter((update) => update.key === key),
      map((update) => update.value as KeyValueStoreValue),
      take(1),
    )
  }

  return {getKey, setKey}
}
