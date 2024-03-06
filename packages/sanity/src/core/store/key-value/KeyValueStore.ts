import {type SanityClient} from '@sanity/client'
import {merge, Observable, Subject} from 'rxjs'
import {filter, map, switchMap} from 'rxjs/operators'

import {serverBackend} from './backends/server'
import {type KeyValueStore, type KeyValueStoreValue} from './types'

/** @internal */
export function createKeyValueStore({client}: {client: SanityClient}): KeyValueStore {
  const storageBackend = serverBackend({client})

  const setKey$ = new Subject<{key: string; value: KeyValueStoreValue}>()

  const updates$ = setKey$.pipe(
    switchMap((event) =>
      storageBackend.setKey(event.key, event.value).pipe(
        map((nextValue) => ({
          key: event.key,
          value: nextValue,
        })),
      ),
    ),
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
    /*
     * The backend returns the result of the set operation, so we can just pass that along.
     * Most utils do not use it (they will take advantage of local state first) but it reflects the
     * backend function and could be useful for debugging.
     */
    const response = new Observable<KeyValueStoreValue>((subscriber) => {
      const subscription = storageBackend.setKey(key, value).subscribe({
        next: (nextValue) => {
          subscriber.next(nextValue as KeyValueStoreValue)
          subscriber.complete()
        },
        //storageBackend should handle its own errors, we're just passing along the result.
        error: (err) => {
          subscriber.error(err)
        },
      })
      return () => subscription.unsubscribe()
    })

    setKey$.next({key, value})
    return response
  }

  return {getKey, setKey}
}
