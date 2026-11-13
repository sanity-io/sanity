import {
  type PreferenceKey,
  type PreferenceListItemValue,
  type PreferenceListKey,
  type PreferenceValue,
  updateUserPreference,
  updateUserPreferenceListItem,
  userPreference,
  userPreferenceList,
} from '@sanity/sdk'
import {useSanityInstance} from '@sanity/sdk-react'
import {useCallback, useEffect, useMemo, useSyncExternalStore} from 'react'

import {useCurrentUser} from '../user/hooks'

/**
 * A preference of the current user in the workspace's project, read and written through the App
 * SDK. `value` is `undefined` until it's read and while nobody has set it, so callers keep their own
 * fallback. `set(undefined)` removes the user's value.
 *
 * Unlike the SDK's own hooks this never suspends: the nearest boundary is the Studio's loading
 * screen.
 *
 * @internal
 */
export function useStudioPreference<K extends PreferenceKey>(key: K) {
  const {instance, userId} = usePreferenceOwner()
  const state = useMemo(
    () => userPreference.getState(instance, userId, key),
    [instance, userId, key],
  )
  const {data, status} = useSyncExternalStore(state.subscribe, state.getCurrent)
  const set = useCallback(
    async (value: PreferenceValue<K> | undefined) => {
      await updateUserPreference<PreferenceKey>(instance, {userId, key, value})
    },
    [instance, userId, key],
  )
  // The fetcher cache holds every key's value in one type; `key` picks this one
  const value = data && !data.isDefault ? (data.value as PreferenceValue<K>) : undefined
  return {value, status, set}
}

/**
 * The current user's items for a list key, like Vision's saved queries, with every page read.
 * `set(itemId, undefined)` removes an item.
 *
 * @internal
 */
export function useStudioPreferenceList<K extends PreferenceListKey>(key: K) {
  const {instance, userId} = usePreferenceOwner()
  const state = useMemo(
    () => userPreferenceList.getState(instance, userId, key),
    [instance, userId, key],
  )
  const {data: pages, error} = useSyncExternalStore(state.subscribe, state.getCurrent)
  const nextCursor = pages?.at(-1)?.nextCursor
  useEffect(() => {
    if (nextCursor) void userPreferenceList.loadMore(instance, userId, key)
  }, [instance, userId, key, nextCursor])
  const set = useCallback(
    (itemId: string, value: PreferenceListItemValue<K> | undefined) =>
      updateUserPreferenceListItem<PreferenceListKey>(instance, {userId, key, itemId, value}),
    [instance, userId, key],
  )
  const items = useMemo(
    // The fetcher cache holds every key's items in one type; `key` picks this one
    () =>
      (pages ?? []).flatMap(
        (page) => page.data as {itemId: string; value: PreferenceListItemValue<K>}[],
      ),
    [pages],
  )
  return {items, error, set}
}

function usePreferenceOwner() {
  const instance = useSanityInstance()
  // The workspace is authenticated before anything below it renders
  const userId = useCurrentUser()?.id ?? ''
  return {instance, userId}
}
