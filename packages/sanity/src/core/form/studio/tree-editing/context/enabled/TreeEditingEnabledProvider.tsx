import {useMemo} from 'react'
import {TreeEditingEnabledContext} from 'sanity/_singletons'

import {useSource} from '../../../../../studio/source'
import {type TreeEditingEnabledContextValue} from './useTreeEditingEnabled'

interface TreeEditingEnabledProviderProps {
  children: React.ReactNode
  legacyEditing?: boolean
}

export function TreeEditingEnabledProvider(
  props: TreeEditingEnabledProviderProps,
): React.JSX.Element {
  const {children, legacyEditing} = props
  const {beta} = useSource()

  const value = useMemo((): TreeEditingEnabledContextValue => {
    return {
      enabled: beta?.treeArrayEditing?.enabled === true, // The tree editing beta feature is now enabled
      legacyEditing: Boolean(legacyEditing),
    }
  }, [beta?.treeArrayEditing?.enabled, legacyEditing])

  return (
    <TreeEditingEnabledContext.Provider value={value}>
      {children}
    </TreeEditingEnabledContext.Provider>
  )
}
