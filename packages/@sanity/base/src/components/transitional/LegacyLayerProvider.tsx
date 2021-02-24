import {LayerProvider} from '@sanity/ui'
import React from 'react'
import {useZIndex} from '../zOffsets/useZIndex'
import {ZIndexContextValue} from '../zOffsets/types'

export type ZIndexContextValueKey = keyof ZIndexContextValue

/**
 * This component should only be used by core Sanity packages.
 * @internal
 */
export function LegacyLayerProvider({
  children,
  zOffset: zOffsetKey,
}: {
  children: React.ReactNode
  zOffset: ZIndexContextValueKey
}) {
  const zIndex = useZIndex()
  const zOffset = zIndex[zOffsetKey]

  return <LayerProvider zOffset={zOffset}>{children}</LayerProvider>
}
