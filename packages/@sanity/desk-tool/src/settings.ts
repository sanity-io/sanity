import {useDatastores} from '@sanity/base'
import {useCallback, useEffect, useMemo, useState} from 'react'

/**
 * @internal
 */
export function useDeskToolSetting<ValueType>(
  namespace: string | null,
  key: string,
  defaultValue?: ValueType
): [ValueType | undefined, (_value: ValueType) => void] {
  const {settingsStore} = useDatastores()
  const [value, setValue] = useState<ValueType | undefined>(defaultValue)

  const deskToolSettings = useMemo(() => settingsStore.forNamespace('desk-tool'), [settingsStore])

  const settings = useMemo(() => {
    if (namespace) {
      return deskToolSettings.forNamespace(namespace).forKey(key)
    }

    return deskToolSettings.forKey(key)
  }, [deskToolSettings, namespace, key])

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
    [settings]
  )

  return useMemo(() => [value, set], [set, value])
}
