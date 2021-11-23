import React, {useMemo} from 'react'
import {DeskToolContext} from './DeskToolContext'
import {DeskToolContextValue} from './types'

/**
 * @internal
 */
export function DeskToolProvider({
  children,
  layoutCollapsed,
}: {
  children?: React.ReactNode
  layoutCollapsed: boolean
}): React.ReactElement {
  const contextValue: DeskToolContextValue = useMemo(
    () => ({
      features: {
        backButton: layoutCollapsed,
        reviewChanges: !layoutCollapsed,
        splitPanes: !layoutCollapsed,
        splitViews: !layoutCollapsed,
      },
      layoutCollapsed,
    }),
    [layoutCollapsed]
  )

  return <DeskToolContext.Provider value={contextValue}>{children}</DeskToolContext.Provider>
}
