import {ReactNode, ReactElement} from 'react'
import {defaults} from './defaults'
import {ZIndexContext} from './ZIndexContext'

/**
 * TODO: Rename to `ZOffsetsProvider`
 *
 * @internal
 */
export function ZIndexProvider({children}: {children?: ReactNode}): ReactElement {
  return <ZIndexContext.Provider value={defaults}>{children}</ZIndexContext.Provider>
}
