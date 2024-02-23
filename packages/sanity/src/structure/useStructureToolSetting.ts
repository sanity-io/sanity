import {useCallback, useEffect, useMemo, useState} from 'react'
import {startWith} from 'rxjs/operators'
import {useKeyValueStore} from 'sanity'

/**
 * @internal
 */
export function useStructureToolSetting<ValueType>(
  namespace: string | null,
  key: string,
  defaultValue?: ValueType,
): [ValueType | undefined, (_value: ValueType) => void] {
  const keyValueStore = useKeyValueStore()
  const [value, setValue] = useState<ValueType | undefined>(defaultValue)

  const keyValueStoreKey = namespace
    ? `structure-tool::${namespace}::${key}`
    : `structure-tool::${key}`

  const settings = useMemo(() => {
    return keyValueStore.getKey(keyValueStoreKey)
  }, [keyValueStore, keyValueStoreKey])

  useEffect(() => {
    const sub = settings.pipe(startWith(defaultValue)).subscribe({
      next: setValue as any,
    })

    return () => sub?.unsubscribe()
  }, [defaultValue, keyValueStoreKey, settings])

  const set = useCallback(
    (newValue: ValueType) => {
      setValue(newValue)
      keyValueStore.setKey(keyValueStoreKey, newValue as string)
    },
    [keyValueStore, keyValueStoreKey],
  )

  return useMemo(() => [value, set], [set, value])
}
