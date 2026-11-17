/* oxlint-disable no-deprecated -- this module implements the deprecated key-value store */
import {type SanityClient} from '@sanity/client'
import {dequal as isEqual} from 'dequal/lite'
import {lastValueFrom, merge, of, Subject} from 'rxjs'
import {catchError, distinctUntilChanged, filter, map, takeUntil} from 'rxjs/operators'

import {type KeyValueStore, type KeyValueStoreValue} from './types'

// The preferences API version `@sanity/sdk` calls
const PREFERENCES_API_VERSION = '2026-11-07'

interface StoredPreference {
  key: string
  activeValue: KeyValueStoreValue | null
  activeLevel: string
}

function valueOf(preference: StoredPreference | undefined): KeyValueStoreValue | null {
  return preference && preference.activeLevel !== 'default'
    ? (preference.activeValue ?? null)
    : null
}

/**
 * A {@link KeyValueStore} that reads and writes the current user's Studio preferences in the
 * client's project. It has no access to the Studio's App SDK instance, so it calls the preferences
 * API itself, and doesn't see changes made through `useStudioPreference` until it reads a key again.
 * Vision's saved queries, which the API keeps as separate items, are only available through
 * `useKeyValueStore`.
 *
 * @internal
 * @deprecated The Studio keeps its preferences through the App SDK now: use
 * `useStudioPreference` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 * `createKeyValueStore` will be removed in Sanity Studio v7.
 */
export function createKeyValueStore(options: {client: SanityClient}): KeyValueStore {
  const client = options.client.withConfig({apiVersion: PREFERENCES_API_VERSION})
  const path = `/projects/${encodeURIComponent(client.config().projectId ?? '')}/users/me/preferences`
  const changes$ = new Subject<{key: string; value: KeyValueStoreValue | null}>()

  function read(key: string) {
    return client.observable
      .request<{data: StoredPreference[]}>({url: path, query: {keys: key}, tag: 'preferences.get'})
      .pipe(
        map(({data}) => valueOf(data.find((preference) => preference.key === key))),
        catchError((error: unknown) => {
          console.error(`Unable to read the preference "${key}"`, error)
          return of(null)
        }),
      )
  }

  function write(key: string, value: KeyValueStoreValue) {
    const url = `${path}/${encodeURIComponent(key)}`
    return client.observable.request<StoredPreference>(
      value === null
        ? {url, method: 'DELETE', tag: 'preferences.reset'}
        : {url, method: 'PUT', body: {value}, tag: 'preferences.set'},
    )
  }

  return {
    getKey(key) {
      const changes = changes$.pipe(
        filter((change) => change.key === key),
        map((change) => change.value),
      )
      // A write made while the first read is on its way is newer than what the read answers
      return merge(read(key).pipe(takeUntil(changes)), changes).pipe(distinctUntilChanged(isEqual))
    },
    async setKey(key, value) {
      changes$.next({key, value})
      try {
        const stored = valueOf(await lastValueFrom(write(key, value)))
        changes$.next({key, value: stored})
        return stored
      } catch (error) {
        console.error(`Unable to store the preference "${key}"`, error)
        changes$.next({key, value: await lastValueFrom(read(key))})
        return null
      }
    },
  }
}
