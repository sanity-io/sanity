import {Path} from '@sanity/types'
import {useCallback, useMemo} from 'react'
import PatchEvent from '../../../PatchEvent'

// This hook will forward patches to the root onChange from the forms of the embedded objects.
export function useObjectEditFormBuilderChange(onChange: (event: PatchEvent) => void) {
  const onObjectEditFormBuilderChange = useCallback(
    (patchEvent: PatchEvent, path: Path): void => {
      let prefixedEvent = patchEvent
      path
        .slice(0)
        .reverse()
        .forEach((segment) => {
          prefixedEvent = prefixedEvent.prefixAll(segment)
        })
      onChange(prefixedEvent)
    },
    [onChange]
  )

  return useMemo(() => ({onObjectEditFormBuilderChange}), [onObjectEditFormBuilderChange])
}
