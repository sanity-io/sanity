import {useContext, useMemo} from 'react'
import {useSource} from 'sanity'
import {PortableTextAwareContext} from 'sanity/_singletons'

interface useTreeArrayEditingConfigHookValue {
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
 * A hook that provides information about the tree array editing config.
 * This hook needs to exist while we have the two type of solutions for array editing available
 * and the PTE is not yet fully integrated with the tree array editing feature.
 */
export function useTreeArrayEditingConfig(): useTreeArrayEditingConfigHookValue {
  const {features} = useSource()
  const hasEditorParent = useContext(PortableTextAwareContext)?.hasEditorParent

  return useMemo(
    (): useTreeArrayEditingConfigHookValue => ({
      enabled: features?.beta?.treeArrayEditing?.enabled === true,
      legacyEditing: Boolean(hasEditorParent),
    }),
    [features, hasEditorParent],
  )
}
