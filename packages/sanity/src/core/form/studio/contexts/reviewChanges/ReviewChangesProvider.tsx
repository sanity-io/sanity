import React, {useMemo} from 'react'
import {ReviewChangesContext} from './ReviewChangesContext'
import {ReviewChangesContextValue} from './types'

/**
 * @internal
 */
export function ReviewChangesContextProvider(props: {
  children?: React.ReactNode
  changesOpen: boolean
}): React.ReactElement {
  const {children, changesOpen} = props
  const contextValue: ReviewChangesContextValue = useMemo(() => ({changesOpen}), [changesOpen])

  return (
    <ReviewChangesContext.Provider value={contextValue}>{children}</ReviewChangesContext.Provider>
  )
}
