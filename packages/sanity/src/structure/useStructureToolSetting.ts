import {isEqual} from 'lodash-es'
import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {distinctUntilChanged, map, scan} from 'rxjs/operators'
import {type KeyValueStoreValue, useKeyValueStore} from 'sanity'

const STRUCTURE_TOOL_NAMESPACE = 'studio.structure-tool'

/**
 * @internal
 */
export function useStructureToolSetting<ValueType>(
  namespace: string,
  key: string | null,
  defaultValue?: ValueType,
): [ValueType | undefined, (_value: ValueType) => Promise<void>] {
  const keyValueStore = useKeyValueStore()

  const keyValueStoreKey = [STRUCTURE_TOOL_NAMESPACE, namespace, key].filter(Boolean).join('.')

  const value$ = useMemo(() => {
    return keyValueStore.getKey(keyValueStoreKey).pipe(
      // Use scan to prevent null from overwriting a valid value.
      // This handles the race condition where local storage has the new value
      // but the server returns null before the async save completes.
      scan(
        (acc: KeyValueStoreValue | null, value: KeyValueStoreValue | null) => {
          // If we already have a non-null value and server returns null, keep existing
          if (value === null && acc !== null) {
            return acc
          }
          return value
        },
        null as KeyValueStoreValue | null,
      ),
      map((value) => (value === null ? defaultValue : value)),
      distinctUntilChanged(isEqual),
    )
  }, [defaultValue, keyValueStore, keyValueStoreKey])

  const value = useObservable(value$, defaultValue) as ValueType
  const set = useCallback(
    async (newValue: ValueType) => {
      if (newValue !== value) {
        await keyValueStore.setKey(keyValueStoreKey, newValue as string)
      }
    },
    [keyValueStore, keyValueStoreKey, value],
  )

  return useMemo(() => [value, set], [set, value])
}
