import {useCallback, useEffect, useMemo, useState} from 'react'
import {useSettingsStore} from 'sanity'

/**
 * @internal
 */
export function useStructureToolSetting<ValueType>(
  namespace: string | null,
  key: string,
  defaultValue?: ValueType,
): [ValueType | undefined, (_value: ValueType) => void] {
  const settingsStore = useSettingsStore()
  const [value, setValue] = useState<ValueType | undefined>(defaultValue)

  const structureToolSettings = useMemo(
    () => settingsStore.forNamespace('structure-tool'),
    [settingsStore],
  )

  const settings = useMemo(() => {
    if (namespace) {
      return structureToolSettings.forNamespace(namespace).forKey(key)
    }

    return structureToolSettings.forKey(key)
  }, [structureToolSettings, namespace, key])

  useEffect(() => {
    const sub = settings.listen(defaultValue).subscribe({
      next: setValue as any,
    })

    return () => sub?.unsubscribe()
  }, [defaultValue, key, namespace, settings])

  const set = useCallback(
    (newValue: ValueType) => {
      setValue(newValue)
      settings.set(newValue as any)
    },
    [settings],
  )

  return useMemo(() => [value, set], [set, value])
}
