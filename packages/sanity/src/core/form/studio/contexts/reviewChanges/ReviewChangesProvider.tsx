import {type ReactElement, type ReactNode, useMemo} from 'react'
import {ReviewChangesContext} from 'sanity/_singletons'

import {type ReviewChangesContextValue} from './types'

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
