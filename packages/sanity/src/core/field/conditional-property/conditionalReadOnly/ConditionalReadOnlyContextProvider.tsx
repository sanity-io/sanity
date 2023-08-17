import React, {useMemo} from 'react'
import {ConditionalReadOnlyContext} from './ConditionalReadOnlyContext'
import {ConditionalReadOnlyContextValue} from './types'

/**
 * @internal
 */
export function ConditionalReadOnlyContextProvider(props: {
  children?: React.ReactNode
  readOnly?: boolean
}): React.ReactElement {
  const {children, readOnly} = props

  const contextValue: ConditionalReadOnlyContextValue = useMemo(
    () => ({
      readOnly,
    }),
    [readOnly],
  )

  return (
    <ConditionalReadOnlyContext.Provider value={contextValue}>
      {children}
    </ConditionalReadOnlyContext.Provider>
  )
}
