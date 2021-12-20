/* eslint-disable no-console */
import {Patch as EditorPatch} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'
import {useCallback, useMemo} from 'react'
import {Subject} from 'rxjs'
import PatchEvent from '../../../PatchEvent'

// This hook will forward patches to the root onChange from the forms of the embedded objects.
export function useObjectEditFormBuilderChange(
  onChange: (event: PatchEvent) => void,
  patches$: Subject<EditorPatch>
) {
  const onObjectEditFormBuilderChange = useCallback(
    (patchEvent: PatchEvent, path: Path): void => {
      let prefixedEvent = patchEvent
      path
        .slice(0)
        .reverse()
        .forEach((segment) => {
          prefixedEvent = prefixedEvent.prefixAll(segment)
        })
      prefixedEvent.patches.map((patch) => patches$.next(patch))
      onChange(prefixedEvent)
    },
    [onChange, patches$]
  )

  return useMemo(() => ({onObjectEditFormBuilderChange}), [onObjectEditFormBuilderChange])
}
