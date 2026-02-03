import {LayerProvider} from '@sanity/ui'
import {type ReactNode} from 'react'

import {type ZIndexContextValue} from '../zOffsets/types'
import {useZIndex} from '../zOffsets/useZIndex'

/** @internal */
export type ZIndexContextValueKey = keyof ZIndexContextValue

/**
 * This component should only be used by core Sanity packages.
 * @internal
 */
export function LegacyLayerProvider({
  children,
  zOffset: zOffsetKey,
}: {
  children: ReactNode
  zOffset: ZIndexContextValueKey
}) {
  const zIndex = useZIndex()
  const zOffset = zIndex[zOffsetKey]

  return <LayerProvider zOffset={zOffset}>{children}</LayerProvider>
}
