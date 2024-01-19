import {ReactElement, ReactNode, useMemo} from 'react'
import {ReviewChangesContext} from './ReviewChangesContext'
import {ReviewChangesContextValue} from './types'

/**
 * @internal
 */
export function ReviewChangesContextProvider(props: {
  children?: ReactNode
  changesOpen: boolean
}): ReactElement {
  const {children, changesOpen} = props
  const contextValue: ReviewChangesContextValue = useMemo(() => ({changesOpen}), [changesOpen])

  return (
    <ReviewChangesContext.Provider value={contextValue}>{children}</ReviewChangesContext.Provider>
  )
}
