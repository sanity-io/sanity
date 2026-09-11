import {useCallback, useMemo} from 'react'
import {useObservable, useSyncObservable} from 'react-rx'
import {map} from 'rxjs/operators'

import {useKeyValueStore} from '../core/store/datastores'
import {type KeyValueStoreValue} from '../core/store/key-value/types'

const STRUCTURE_TOOL_NAMESPACE = 'studio.structure-tool'

/**
 * @internal
 */
export function useStructureToolSetting<ValueType>(
  namespace: string,
  key: string | null,
  defaultValue?: ValueType,
): [ValueType | undefined, (_value: ValueType | null) => Promise<void>] {
  const keyValueStore = useKeyValueStore()

  const keyValueStoreKey = [STRUCTURE_TOOL_NAMESPACE, namespace, key].filter(Boolean).join('.')

  const value$ = useMemo(() => {
    return keyValueStore.getKey(keyValueStoreKey).pipe(
      // The backend persists a cleared entry as `''`, so treat it like `null`.
      map((value) => (value === null || value === '' ? defaultValue : value)),
    )
  }, [defaultValue, keyValueStore, keyValueStoreKey])

  // react-rx captures an initial value once per hook instance, but this instance outlives its key
  // (`PaneContainer` is reused across panes) and `defaultValue` differs per key. Until the
  // subscription for the current `value$` emits, fall back per render to the current default, so a
  // key change never renders the previous key's default — nor its value — for a commit.
  // Use the live value for write-side equality; rendering can remain deferred.
  const observedValue = (useSyncObservable(value$, undefined) ?? defaultValue) as ValueType
  const value = (useObservable(value$, undefined) ?? defaultValue) as ValueType
  const set = useCallback(
    async (newValue: ValueType | null) => {
      if (newValue !== observedValue) {
        // A `null` value clears the stored entry: `getKey` coerces the empty
        // value back to `null`, so reads fall through to `defaultValue`.
        await keyValueStore.setKey(keyValueStoreKey, newValue as KeyValueStoreValue)
      }
    },
    [keyValueStore, keyValueStoreKey, observedValue],
  )

  return useMemo(() => [value, set], [set, value])
}
