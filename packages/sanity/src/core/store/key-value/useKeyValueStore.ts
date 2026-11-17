/* oxlint-disable no-deprecated -- this module implements the deprecated key-value store */
import {
  type PreferenceKey,
  type PreferenceListItemValue,
  type PreferenceValue,
  type SanityInstance,
  updateUserPreference,
  updateUserPreferenceListItem,
  userPreference,
  userPreferenceList,
  type UserPreferenceListPage,
} from '@sanity/sdk'
import {dequal as isEqual} from 'dequal/lite'
import {useMemo} from 'react'
import {defer, of} from 'rxjs'
import {catchError, distinctUntilChanged, filter, map, tap} from 'rxjs/operators'

import {usePreferenceOwner} from '../preferences/useStudioPreference'
import {type KeyValueStore, type KeyValueStoreValue} from './types'

// Versions of Vision from before the App SDK keep their saved queries under this key as
// `{queries}`, while the preferences API keeps each query as an item of a list
const SAVED_QUERIES = 'studio.vision-tool.saved-queries'

type SavedQuery = PreferenceListItemValue<typeof SAVED_QUERIES>

function queriesOf(pages: UserPreferenceListPage[]): SavedQuery[] {
  // The item's ID is the query's key: older `_key`s had `:`, which an item's ID can't have
  return pages.flatMap((page) =>
    page.data.map(({itemId, value}) => ({...(value as SavedQuery), _key: itemId})),
  )
}

function queriesIn(value: KeyValueStoreValue): SavedQuery[] {
  return value && typeof value === 'object' && 'queries' in value && Array.isArray(value.queries)
    ? (value.queries as SavedQuery[])
    : []
}

/**
 * A {@link KeyValueStore} over the App SDK's preference cache, the one `useStudioPreference` reads
 * and writes, so a change made through either shows in both at once.
 */
export function createPreferenceKeyValueStore(
  instance: SanityInstance,
  userId: string,
): KeyValueStore {
  function readSavedQueries() {
    return defer(
      () => userPreferenceList.getState(instance, userId, SAVED_QUERIES).observable,
    ).pipe(
      tap(({data: pages}) => {
        // A failed page shows on the entry's `error`, and the next refetch reads it again
        if (pages?.at(-1)?.nextCursor) {
          userPreferenceList.loadMore(instance, userId, SAVED_QUERIES).catch(() => {})
        }
      }),
      // Vision writes back the whole list it read, so a partial one would remove the queries left
      filter(({status, data: pages}) => status !== 'pending' && !pages?.at(-1)?.nextCursor),
      map(({data: pages}) => (pages ? {queries: queriesOf(pages)} : null)),
    )
  }

  async function writeSavedQueries(value: KeyValueStoreValue): Promise<KeyValueStoreValue> {
    const next = queriesIn(value)
    let pages = await userPreferenceList.resolveState(instance, userId, SAVED_QUERIES)
    while (pages.at(-1)?.nextCursor) {
      pages = await userPreferenceList.loadMore(instance, userId, SAVED_QUERIES)
    }
    const current = new Map(queriesOf(pages).map((query) => [query._key, query]))
    const kept = new Set(next.map((query) => query._key))
    const write = (itemId: string, query?: SavedQuery) =>
      updateUserPreferenceListItem(instance, {userId, key: SAVED_QUERIES, itemId, value: query})
    await Promise.all([
      ...next
        .filter((query) => !isEqual(current.get(query._key), query))
        .map((query) => write(query._key, query)),
      ...[...current.keys()].filter((itemId) => !kept.has(itemId)).map((itemId) => write(itemId)),
    ])
    await userPreferenceList.refetch(instance, userId, SAVED_QUERIES)
    return value ?? {queries: []}
  }

  async function writeValue(key: string, value: KeyValueStoreValue) {
    const stored = await updateUserPreference<PreferenceKey>(instance, {
      userId,
      key: key as PreferenceKey,
      value: (value ?? undefined) as PreferenceValue<PreferenceKey> | undefined,
    })
    return stored.isDefault ? null : (stored.value as KeyValueStoreValue)
  }

  return {
    getKey(key) {
      if (key === SAVED_QUERIES) return readSavedQueries().pipe(distinctUntilChanged(isEqual))
      // Deferred, since looking up a key the SDK doesn't declare throws
      return defer(
        () => userPreference.getState(instance, userId, key as PreferenceKey).observable,
      ).pipe(
        filter((snapshot) => snapshot.status !== 'pending'),
        map((snapshot) =>
          snapshot.status === 'success' && !snapshot.data.isDefault
            ? (snapshot.data.value as KeyValueStoreValue)
            : null,
        ),
        catchError(() => of(null)),
        distinctUntilChanged(isEqual),
      )
    },
    async setKey(key, value) {
      try {
        return await (key === SAVED_QUERIES ? writeSavedQueries(value) : writeValue(key, value))
      } catch (error) {
        console.error(`Unable to store the preference "${key}"`, error)
        return null
      }
    },
  }
}

/**
 * Returns a {@link KeyValueStore} for the current user's Studio preferences in the workspace's
 * project, read and written through the App SDK like `useStudioPreference`.
 *
 * @internal
 * @deprecated The Studio keeps its preferences through the App SDK now: use
 * `useStudioPreference` from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`.
 * `useKeyValueStore` will be removed in Sanity Studio v7.
 */
export function useKeyValueStore(): KeyValueStore {
  const {instance, userId} = usePreferenceOwner()
  return useMemo(() => createPreferenceKeyValueStore(instance, userId), [instance, userId])
}
