import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
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

  const value = useObservable(value$, defaultValue) as ValueType
  const set = useCallback(
    async (newValue: ValueType | null) => {
      if (newValue !== value) {
        // A `null` value clears the stored entry: `getKey` coerces the empty
        // value back to `null`, so reads fall through to `defaultValue`.
        await keyValueStore.setKey(keyValueStoreKey, newValue as KeyValueStoreValue)
      }
    },
    [keyValueStore, keyValueStoreKey, value],
  )

  return useMemo(() => [value, set], [set, value])
}
