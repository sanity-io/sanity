import {useCallback, useEffect, useMemo, useState} from 'react'
import {map, startWith} from 'rxjs/operators'
import {useKeyValueStore} from 'sanity'

const STRUCTURE_TOOL_NAMESPACE = 'studio.structure-tool'

/**
 * @internal
 */
export function useStructureToolSetting<ValueType>(
  namespace: string,
  key: string | null,
  defaultValue?: ValueType,
): [ValueType | undefined, (_value: ValueType) => void] {
  const keyValueStore = useKeyValueStore()
  const [value, setValue] = useState<ValueType | undefined>(defaultValue)

  const keyValueStoreKey = [STRUCTURE_TOOL_NAMESPACE, namespace, key].filter(Boolean).join('.')

  const settings = useMemo(() => {
    return keyValueStore.getKey(keyValueStoreKey)
  }, [keyValueStore, keyValueStoreKey])

  useEffect(() => {
    const sub = settings
      .pipe(
        startWith(defaultValue),
        map((fetchedValue) => {
          return fetchedValue === null ? defaultValue : fetchedValue
        }),
      )
      .subscribe({
        next: setValue as any,
      })

    return () => sub?.unsubscribe()
  }, [defaultValue, keyValueStoreKey, settings])

  const set = useCallback(
    (newValue: ValueType) => {
      if (newValue !== value) {
        setValue(newValue)
        keyValueStore.setKey(keyValueStoreKey, newValue as string)
      }
    },
    [keyValueStore, keyValueStoreKey, value],
  )

  return useMemo(() => [value, set], [set, value])
}
