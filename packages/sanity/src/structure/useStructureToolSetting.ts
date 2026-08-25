import {useCallback, useMemo} from 'react'
import {useObservable, useSyncObservable} from 'react-rx'
import {map} from 'rxjs/operators'
import {type KeyValueStoreValue, useKeyValueStore} from 'sanity'

import {useShallowUnique} from './hooks/useShallowUnique'

const STRUCTURE_TOOL_NAMESPACE = 'studio.structure-tool'

/**
 * @internal
 */
export function useStructureToolSetting<ValueType>(
  namespace: string,
  key: string | null,
  unstableDefaultValue?: ValueType,
): [ValueType | undefined, (_value: ValueType | null) => Promise<void>] {
  const keyValueStore = useKeyValueStore()
  // Keyed on contents: `defaultValue` can be an object (e.g. a sort order),
  // and its reference feeds the observable identity below — a fresh identity
  // per render is loop-capable under react-rx v5.
  const defaultValue = useShallowUnique(unstableDefaultValue)

  const keyValueStoreKey = [STRUCTURE_TOOL_NAMESPACE, namespace, key].filter(Boolean).join('.')

  const value$ = useMemo(() => {
    return keyValueStore.getKey(keyValueStoreKey).pipe(
      // The backend persists a cleared entry as `''`, so treat it like `null`.
      map((value) => (value === null || value === '' ? defaultValue : value)),
    )
  }, [defaultValue, keyValueStore, keyValueStoreKey])

  // Keep the immediate store value for write-side equality checks so a stale
  // deferred snapshot cannot skip (or redundantly issue) a setKey while the
  // store has already moved on. The rendered value is deferred by react-rx v5
  // (identity-coherent, and sharing the same store subscription as the sync
  // read), so a storage key change never renders the previous key's value.
  const observedValue = useSyncObservable(value$, defaultValue) as ValueType
  const value = useObservable(value$, defaultValue) as ValueType
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
