import {type ReactNode} from 'react'
import {ZIndexContext, zIndexContextDefaults} from 'sanity/_singletons'

/**
 * TODO: Rename to `ZOffsetsProvider`
 *
 * @internal
 */
export function ZIndexProvider({children}: {children?: ReactNode}): React.JSX.Element {
  return <ZIndexContext.Provider value={zIndexContextDefaults}>{children}</ZIndexContext.Provider>
}
