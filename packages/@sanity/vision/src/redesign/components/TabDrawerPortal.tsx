import {Portal, PortalProvider, usePortal} from '@sanity/ui'
import {type ReactNode} from 'react'

import {useTabDrawerSlot} from '../store/VisionActorContext'

/**
 * Renders one of the active tab's tools into the sidebar's drawer (see `TabDrawerSlot`). Inside
 * it, tooltips and menus keep portalling where they did rather than into the drawer, whose
 * scrolling would clip them.
 */
export function TabDrawerPortal({children}: {children: ReactNode}) {
  const {element} = useTabDrawerSlot()
  const portal = usePortal()
  if (!element) return null
  return (
    <PortalProvider element={element}>
      <Portal>
        <PortalProvider __unstable_elements={portal.elements} element={portal.element}>
          {children}
        </PortalProvider>
      </Portal>
    </PortalProvider>
  )
}
