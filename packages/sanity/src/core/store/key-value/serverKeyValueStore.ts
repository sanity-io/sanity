import {type SanityClient} from '@sanity/client'
import {isEqual} from 'lodash'
import {concat, type Observable, Subject} from 'rxjs'
import {distinctUntilChanged, filter, map} from 'rxjs/operators'

import {createServerStorage} from './storage/serverStorage'
import {type KeyValueStore, type KeyValueStoreValue} from './types'

export function createServerKeyValueStore({client}: {client: SanityClient}): KeyValueStore {
  const serverStorage = createServerStorage({client})

  const events$ = new Subject<{
    type: 'optimistic' | 'commit'
    key: string
    value: KeyValueStoreValue
  }>()

  function getKey(key: string) {
    return serverStorage.getKey(key)
  }

  function setKey(key: string, value: KeyValueStoreValue) {
    events$.next({type: 'optimistic', key, value})

    /*
     * The backend returns the result of the set operation, so we can just pass that along.
     * Most utils do not use it (they will take advantage of local state first) but it reflects the
     * backend function and could be useful for debugging.
     */
    return serverStorage.setKey(key, value).then((storedValue) => {
      events$.next({type: 'commit', key, value: storedValue})
      return storedValue
    })
  }

  return {
    getKey(key: string): Observable<KeyValueStoreValue | null> {
      return concat(
        getKey(key),
        events$.pipe(
          filter((event) => event.key === key),
          map((event) => event.value),
          distinctUntilChanged(isEqual),
        ),
      )
    },
    setKey,
  }
}
