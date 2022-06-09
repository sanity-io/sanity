import React from 'react'
import {defaults} from './defaults'
import {ZIndexContext} from './ZIndexContext'

/**
 * @todo: Rename to `ZOffsetsProvider`
 *
 * @internal
 */
export function ZIndexProvider({children}: {children?: React.ReactNode}): React.ReactElement {
  return <ZIndexContext.Provider value={defaults}>{children}</ZIndexContext.Provider>
}
