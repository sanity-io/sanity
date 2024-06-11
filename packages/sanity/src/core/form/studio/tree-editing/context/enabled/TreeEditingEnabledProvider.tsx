import {useMemo} from 'react'
import {TreeEditingEnabledContext, type TreeEditingEnabledContextValue} from 'sanity/_singletons'

import {useSource} from '../../../../../studio/source'
import {useTreeEditingEnabled} from './useTreeEditingEnabled'

interface TreeEditingEnabledProviderProps {
  children: React.ReactNode
  legacyEditing?: boolean
}

export function TreeEditingEnabledProvider(props: TreeEditingEnabledProviderProps): JSX.Element {
  const {children, legacyEditing: legacyEditingProp} = props

  const {features} = useSource()
  const parentContextValue = useTreeEditingEnabled()

  const value = useMemo((): TreeEditingEnabledContextValue => {
    const legacyEditing =
      // If any parent schema type has tree editing disabled, we should enable
      // legacy array editing for any child array items by passing down the
      // parent context value
      parentContextValue.legacyEditing ||
      // Else, we should enable legacy array editing if the `legacyEditing`
      // prop is set.
      legacyEditingProp

    return {
      enabled: features?.beta?.treeArrayEditing?.enabled === true,
      legacyEditing: Boolean(legacyEditing),
    }
  }, [
    features?.beta?.treeArrayEditing?.enabled,
    legacyEditingProp,
    parentContextValue.legacyEditing,
  ])

  return (
    <TreeEditingEnabledContext.Provider value={value}>
      {children}
    </TreeEditingEnabledContext.Provider>
  )
}
