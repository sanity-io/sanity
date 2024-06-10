import {useContext, useMemo} from 'react'
import {useSource} from 'sanity'

import {usePortableTextAware} from '../../../../hooks/usePortableTextAware'
import {TreeEditingEnabledContext} from './TreeEditingEnabledContext'
import {type TreeEditingEnabledContextValue} from './types'

/**
 * @internal
 */
export function useTreeEditingEnabled(): TreeEditingEnabledContextValue {
  const {features} = useSource()

  // Forward the legacy editing value from the parent context
  const {legacyEditing} = useContext(TreeEditingEnabledContext)

  // If we are inside a portable text editor, we should enable legacy editing
  const hasEditorParent = usePortableTextAware()?.hasEditorParent

  return useMemo(
    (): TreeEditingEnabledContextValue => ({
      enabled: features?.beta?.treeArrayEditing?.enabled === true,
      legacyEditing: hasEditorParent || Boolean(legacyEditing),
    }),
    [features?.beta?.treeArrayEditing?.enabled, hasEditorParent, legacyEditing],
  )
}
