import {type ReactElement, type ReactNode} from 'react'
import {ZIndexContext, zIndexContextDefaults} from 'sanity/_singleton'

/**
 * TODO: Rename to `ZOffsetsProvider`
 *
 * @internal
 */
export function ZIndexProvider({children}: {children?: ReactNode}): ReactElement {
  return <ZIndexContext.Provider value={zIndexContextDefaults}>{children}</ZIndexContext.Provider>
}
