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
   */
  legacyEditing: boolean
}

/**
 * @internal
 * A hook that provides information about whether tree array editing is enabled.
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
