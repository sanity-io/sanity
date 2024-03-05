import {type SanityClient} from '@sanity/client'
import {merge, type Observable, Subject} from 'rxjs'
import {filter, map, switchMap} from 'rxjs/operators'

import {serverBackend} from './backends/server'
import {type KeyValueStore, type KeyValueStoreValue} from './types'

/** @internal */
export function createKeyValueStore({client}: {client: SanityClient}): KeyValueStore {
  const storageBackend = serverBackend({client})

  const setKey$ = new Subject<{key: string; value: KeyValueStoreValue}>()

  const updates$ = setKey$.pipe(
    switchMap((event) =>
      storageBackend.set(event.key, event.value).pipe(
        map((nextValue) => ({
          key: event.key,
          value: nextValue,
        })),
      ),
    ),
  )

  const getKey = (
    key: string,
    defaultValue: KeyValueStoreValue,
  ): Observable<KeyValueStoreValue> => {
    return merge(
      storageBackend.get(key, defaultValue),
      updates$.pipe(
        filter((update) => update.key === key),
        map((update) => update.value),
      ),
    ) as Observable<KeyValueStoreValue>
  }

  const setKey = (key: string, value: KeyValueStoreValue) => {
    setKey$.next({key, value})
  }

  return {getKey, setKey}
}
