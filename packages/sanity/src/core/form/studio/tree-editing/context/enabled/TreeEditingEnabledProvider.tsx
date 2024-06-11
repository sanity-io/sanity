import {useMemo} from 'react'

import {TreeEditingEnabledContext} from './TreeEditingEnabledContext'
import {type TreeEditingEnabledContextValue} from './types'
import {useTreeEditingEnabled} from './useTreeEditingEnabled'

interface TreeEditingEnabledProviderProps {
  children: React.ReactNode
  legacyEditingEnabled?: boolean
}

export function TreeEditingEnabledProvider(props: TreeEditingEnabledProviderProps): JSX.Element {
  const {children, legacyEditingEnabled} = props

  const parentContextValue = useTreeEditingEnabled()

  const value = useMemo((): TreeEditingEnabledContextValue => {
    const legacyEditing =
      // If any parent schema type has tree editing disabled, we should enable
      // legacy array editing for any child array items by passing down the
      // parent context value
      parentContextValue.legacyEditing ||
      // Else, we should enable legacy array editing if the `legacyEditingEnabled`
      // prop is set.
      legacyEditingEnabled

    return {
      enabled: parentContextValue.enabled,
      legacyEditing: Boolean(legacyEditing),
    }
  }, [legacyEditingEnabled, parentContextValue.enabled, parentContextValue.legacyEditing])

  return (
    <TreeEditingEnabledContext.Provider value={value}>
      {children}
    </TreeEditingEnabledContext.Provider>
  )
}
