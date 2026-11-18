import {type PreferenceKey} from '@sanity/sdk'
import {useCallback, useMemo} from 'react'
import {useStudioPreference} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

/**
 * @internal
 */
export function useStructureToolSetting<ValueType>(
  namespace: string,
  key: string | null,
  defaultValue?: ValueType,
): [ValueType | undefined, (_value: ValueType | null) => Promise<void>] {
  // The registry declares each Structure tool setting under this prefix, like
  // `studio.structure-tool.layout.{...paneKey}`
  const preferenceKey = ['studio.structure-tool', namespace, key]
    .filter(Boolean)
    .join('.') as PreferenceKey
  const {value, set} = useStudioPreference(preferenceKey)
  const setValue = useCallback(
    // A `null` value removes the stored setting, so `defaultValue` applies again
    (next: ValueType | null) => set((next ?? undefined) as typeof value),
    [set],
  )
  return useMemo(
    () => [(value as ValueType | undefined) ?? defaultValue, setValue],
    [defaultValue, setValue, value],
  )
}
