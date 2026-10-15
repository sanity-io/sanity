import {type Path} from '@sanity/types'
import {useCallback, useState} from 'react'

import {applyAll} from '../../form/patch/applyPatch'
import {createPatchChannel} from '../../form/patch/PatchChannel'
import {type FormPatch} from '../../form/patch/types'
import {setAtPath} from '../../form/store/stateTreeHelper'
import {type StateTree} from '../../form/store/types/state'
import {type FormDocumentValue} from '../../form/types/formDocumentValue'
import {EMPTY_ARRAY} from '../../util/empty'
import {isRecord} from '../../util/isRecord'

/**
 * Focus, collapse, and in-memory patch state for the release metadata form.
 * Kept in this module so it can be replaced by the shared form-state hook
 * extracted from `useDocumentForm` without touching the form component.
 */
export function useReleaseMetadataFormState() {
  const [patchChannel] = useState(() => createPatchChannel())
  const [focusPath, setFocusPath] = useState<Path>(EMPTY_ARRAY)
  const [openPath, setOpenPath] = useState<Path>(EMPTY_ARRAY)
  const [collapsedPaths, setCollapsedPaths] = useState<StateTree<boolean> | undefined>(undefined)
  const [collapsedFieldSets, setCollapsedFieldSets] = useState<StateTree<boolean> | undefined>(
    undefined,
  )

  const onPathFocus = useCallback((path: Path) => {
    setFocusPath(path)
  }, [])

  const onPathBlur = useCallback(() => {
    setFocusPath(EMPTY_ARRAY)
  }, [])

  const onPathOpen = useCallback((path: Path) => {
    setOpenPath(path)
  }, [])

  const onSetPathCollapsed = useCallback((path: Path, collapsed: boolean) => {
    setCollapsedPaths((current) => setAtPath(current, path, collapsed))
  }, [])

  const onSetFieldSetCollapsed = useCallback((path: Path, collapsed: boolean) => {
    setCollapsedFieldSets((current) => setAtPath(current, path, collapsed))
  }, [])

  return {
    patchChannel,
    focusPath,
    openPath,
    collapsedPaths,
    collapsedFieldSets,
    onPathFocus,
    onPathBlur,
    onPathOpen,
    onSetPathCollapsed,
    onSetFieldSetCollapsed,
  }
}

export function applyReleaseMetadataPatches(
  value: FormDocumentValue,
  patches: FormPatch[],
): FormDocumentValue {
  const next: unknown = applyAll(value, patches)
  if (!isRecord(next)) return value
  const _id = next._id
  const _type = next._type
  if (typeof _id !== 'string' || typeof _type !== 'string') return value
  const documentValue: FormDocumentValue = {_id, _type}
  for (const [key, fieldValue] of Object.entries(next)) {
    documentValue[key] = fieldValue
  }
  return documentValue
}
