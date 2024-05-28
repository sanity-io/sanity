import {useContext, useMemo} from 'react'
import {useSource} from 'sanity'
import {PortableTextAwareContext} from 'sanity/_singletons'

interface TreeArrayEditingEnabledHookValue {
  /**
   * A boolean indicating whether tree array editing is enabled.
   */
  enabled: boolean
  /**
   * A boolean indicating whether the legacy array editing should be used.
   * Specifically it's currently used to add an exception for PTEs since they are
   * currently outside of the scope of the tree array editing feature.
   */
  legacyEditing: boolean
}

/**
 * @internal
 * A hook that provides information about whether tree array editing is enabled.
 * This hook needs to exist while we have the two type of solutions for array editing available
 * and the PTE is not yet fully integrated with the tree array editing feature.
 */
export function useTreeArrayEditingEnabled(): TreeArrayEditingEnabledHookValue {
  const {features} = useSource()
  const hasEditorParent = useContext(PortableTextAwareContext)?.hasEditorParent

  return useMemo(
    (): TreeArrayEditingEnabledHookValue => ({
      enabled: features?.beta?.treeArrayEditing?.enabled === true,
      legacyEditing: Boolean(hasEditorParent),
    }),
    [features, hasEditorParent],
  )
}
