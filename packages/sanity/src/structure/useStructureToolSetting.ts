import {useCallback, useDeferredValue, useMemo} from 'react'
import {useObservable as useSyncObservable} from 'react-rx'
import {map} from 'rxjs/operators'
import {type KeyValueStoreValue, useKeyValueStore} from 'sanity'

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

  // Keep the immediate store value for write-side equality checks; only defer
  // the value returned for rendering so a stale deferred snapshot cannot skip
  // (or redundantly issue) a setKey while the store has already moved on. The
  // rendered value defers identity and value as one snapshot (reusing the
  // single subscription) so a storage key change never renders the previous
  // key's value.
  const observedValue = useSyncObservable(value$, defaultValue) as ValueType
  const snapshot = useMemo(
    () => ({observable: value$, value: observedValue}),
    [value$, observedValue],
  )
  const deferredSnapshot = useDeferredValue(snapshot)
  const value = deferredSnapshot.observable === value$ ? deferredSnapshot.value : observedValue
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
