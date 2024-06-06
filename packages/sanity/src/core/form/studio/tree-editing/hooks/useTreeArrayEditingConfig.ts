import {useContext, useMemo} from 'react'
import {type Path, useSource} from 'sanity'
import {PortableTextAwareContext} from 'sanity/_singletons'

import {hasException} from '../utils/hasException'

interface useTreeArrayEditingConfigHookValue {
  /**
   * A boolean indicating whether tree array editing is enabled.
   */
  enabled: boolean
  /**
   * A list of exceptions where tree array editing should not be used.
   */
  exceptions: string[]
  /**
   * A boolean indicating whether the path has conflicts with the tree array editing feature.
   */
  hasConflicts: boolean
  /**
   * A boolean indicating whether the legacy array editing should be used.
   * Specifically it's currently used to add an exception for PTEs since they are
   * currently outside of the scope of the tree array editing feature.
   */
  legacyEditing: boolean
}

/**
 * @internal
 * A hook that provides information about the tree array editing config.
 * This hook needs to exist while we have the two type of solutions for array editing available
 * and the PTE is not yet fully integrated with the tree array editing feature.
 */
export function useTreeArrayEditingConfig(path: Path): useTreeArrayEditingConfigHookValue {
  const {features} = useSource()
  const exceptions = useMemo(() => features?.beta?.treeArrayEditing?.exceptions ?? [], [features])
  const hasEditorParent = useContext(PortableTextAwareContext)?.hasEditorParent
  const foundException = hasException(path, exceptions)

  return useMemo(
    (): useTreeArrayEditingConfigHookValue => ({
      enabled: features?.beta?.treeArrayEditing?.enabled === true,
      hasConflicts: foundException,
      exceptions,
      legacyEditing: Boolean(hasEditorParent),
    }),
    [features, hasEditorParent, foundException, exceptions],
  )
}
