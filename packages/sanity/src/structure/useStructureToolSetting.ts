import {useCallback, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map} from 'rxjs/operators'
import {useKeyValueStore} from 'sanity'

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
    return keyValueStore
      .getKey(keyValueStoreKey)
      .pipe(map((value) => (value === null ? defaultValue : value)))
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
