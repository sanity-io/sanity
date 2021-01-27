import {LayerProvider} from '@sanity/ui'
import React from 'react'
import {useZIndex} from '../ZIndexProvider'

export type LegacyLayerZIndexKey =
  | 'pane'
  | 'paneResizer'
  | 'navbar'
  | 'navbarPopover'
  | 'navbarDialog'
  | 'navbarFixed'
  | 'dropdown'
  | 'fullscreenEdit'
  | 'portal'
  | 'popoverBackground'
  | 'popover'
  | 'tooltip'
  | 'modalBackground'
  | 'modal'
  | 'movingItem'
  | 'spinner'
  | 'drawershade'
  | 'drawer'

/**
 * @internal This component should only be used by core Sanity packages.
 */
export function LegacyLayerProvider({
  children,
  zOffset: zOffsetKey,
}: {
  children: React.ReactNode
  zOffset: LegacyLayerZIndexKey
}) {
  const zIndex = useZIndex()
  const zOffset = zIndex[zOffsetKey]

  return <LayerProvider zOffset={zOffset}>{children}</LayerProvider>
}
