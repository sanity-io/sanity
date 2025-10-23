import {useMemo} from 'react'
import {TreeEditingEnabledContext} from 'sanity/_singletons'

import {useSource} from '../../../../../studio/source'
import {type TreeEditingEnabledContextValue} from './useTreeEditingEnabled'

interface TreeEditingEnabledProviderProps {
  children: React.ReactNode
  /**
   * A boolean indicating whether legacy editing is enabled - meaning that it will use the old modal based editing experience
   */
  legacyEditing?: boolean
}

export function TreeEditingEnabledProvider(
  props: TreeEditingEnabledProviderProps,
): React.JSX.Element {
  const {children, legacyEditing} = props
  const {beta} = useSource()

  const value = useMemo((): TreeEditingEnabledContextValue => {
    return {
      enabled: beta?.form?.enhancedObjectDialog?.enabled === true,
      legacyEditing: Boolean(legacyEditing),
    }
  }, [beta?.form?.enhancedObjectDialog?.enabled, legacyEditing])

  return (
    <TreeEditingEnabledContext.Provider value={value}>
      {children}
    </TreeEditingEnabledContext.Provider>
  )
}
