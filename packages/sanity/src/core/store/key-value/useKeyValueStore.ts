/* oxlint-disable no-deprecated -- this module implements the deprecated key-value store */
import {
  type PreferenceKey,
  type PreferenceValue,
  type SanityInstance,
  updateUserPreference,
  userPreference,
} from '@sanity/sdk'
import {dequal as isEqual} from 'dequal/lite'
import {useMemo} from 'react'
import {defer, of} from 'rxjs'
import {catchError, distinctUntilChanged, filter, map} from 'rxjs/operators'

import {usePreferenceOwner} from '../preferences/useStudioPreference'
import {type KeyValueStore, type KeyValueStoreValue} from './types'

/**
 * A {@link KeyValueStore} over the App SDK's preference cache, the one `useStudioPreference` reads
 * and writes, so a change made through either shows in both at once.
 */
export function createPreferenceKeyValueStore(
  instance: SanityInstance,
  userId: string,
): KeyValueStore {
  return {
    getKey(key) {
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
        const stored = await updateUserPreference<PreferenceKey>(instance, {
          userId,
          key: key as PreferenceKey,
          value: (value ?? undefined) as PreferenceValue<PreferenceKey> | undefined,
        })
        return stored.isDefault ? null : (stored.value as KeyValueStoreValue)
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
