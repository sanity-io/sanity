import {useContext, useMemo} from 'react'
import {useSource} from 'sanity'

import {TreeEditingEnabledContext} from './TreeEditingEnabledContext'
import {type TreeEditingEnabledContextValue} from './types'

/**
 * @internal
 */
export function useTreeEditingEnabled(): TreeEditingEnabledContextValue {
  const {features} = useSource()

  const {legacyEditing} = useContext(TreeEditingEnabledContext)

  return useMemo(
    (): TreeEditingEnabledContextValue => ({
      enabled: features?.beta?.treeArrayEditing?.enabled === true,
      legacyEditing: Boolean(legacyEditing),
    }),
    [features, legacyEditing],
  )
}
