import React, {useMemo} from 'react'
import {getLegacyZIndexes} from './legacyZIndexes'
import {ZIndexContext} from './ZIndexContext'

/**
 * @todo: Rename to `ZOffsetsProvider`
 *
 * @internal
 */
export function ZIndexProvider({children}: {children?: React.ReactNode}): React.ReactElement {
  const zIndexes = useMemo(() => getLegacyZIndexes(), [])

  return <ZIndexContext.Provider value={zIndexes}>{children}</ZIndexContext.Provider>
}
